import { hasReviewStore, publishedBlobReviews, saveSubmittedBlob } from "../../../lib/blob-reviews";
import { getReviewDb } from "../../../lib/reviews";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const receiptPattern = /^\d{26,64}$/;
const submissionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const avatarPattern = /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/]+={0,2}$/;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  try {
    const sql = getReviewDb();
    if (!sql) {
      if (!hasReviewStore()) return json({ reviews: [], acceptingReviews: false });
      return json({ reviews: await publishedBlobReviews(), acceptingReviews: true });
    }
    const reviews = await sql`SELECT id::text AS id, rating, review_text AS text, created_at AS date, display_name AS name, avatar_data AS avatar FROM public.reviews WHERE published = true ORDER BY created_at DESC, public.reviews.id DESC LIMIT 500`;
    return json({ reviews, acceptingReviews: true });
  } catch { return json({ error: "We couldn't load guest reviews." }, 503); }
}
export async function POST(request: Request) {
  try {
    const sql = getReviewDb();
    if (!sql && !hasReviewStore()) return json({ error: "Review submissions are temporarily unavailable." }, 503);
    if (request.headers.get("Sec-Fetch-Site") === "cross-site") return json({ error: "Submit from the feedback page." }, 403);
    if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") return json({ error: "Expected JSON." }, 415);
    const bodyText = await request.text();
    if (bodyText.length > 110000) return json({ error: "Profile picture or review is too large." }, 413);
    let body: Record<string, unknown>;
    try { body = JSON.parse(bodyText); } catch { return json({ error: "Invalid request." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid review." }, 400);
    const { receipt, rating, text, submissionId, name, avatar } = body;
    if (typeof receipt !== "string" || !receiptPattern.test(receipt)) return json({ error: "Enter at least 26 digits." }, 400);
    const displayName = typeof name === "string" ? name.trim() : "";
    if (!displayName || displayName.length > 60 || /[<>\x00-\x1f]/.test(displayName)) return json({ error: "Enter a valid display name up to 60 characters." }, 400);
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: "Choose 1 to 5 stars." }, 400);
    const reviewText = typeof text === "string" ? text.trim() : "";
    if (!reviewText || reviewText.length > 2000 || reviewText.includes("\0")) return json({ error: "Write up to 2,000 characters." }, 400);
    if (typeof submissionId !== "string" || !submissionIdPattern.test(submissionId)) return json({ error: "Restart the review form." }, 400);
    const profilePicture = avatar === "" || avatar == null ? "" : avatar;
    if (typeof profilePicture !== "string" || (profilePicture.length > 80000 || (profilePicture && !avatarPattern.test(profilePicture)))) return json({ error: "Invalid profile picture." }, 400);
    if (!sql) {
      const status = await saveSubmittedBlob(submissionId, rating, reviewText, displayName, profilePicture);
      return status === 409 ? json({ error: "This form already submitted a different review." }, 409) : json({ ok: true }, status);
    }
    const [saved] = await sql`INSERT INTO public.reviews (submission_id, rating, review_text, display_name, avatar_data, published) VALUES (${submissionId}, ${rating}, ${reviewText}, ${displayName}, ${profilePicture}, true) ON CONFLICT (submission_id) DO NOTHING RETURNING id`;
    if (saved) return json({ ok: true }, 201);
    const [previous] = await sql`SELECT rating, review_text, display_name, avatar_data FROM public.reviews WHERE submission_id = ${submissionId}`;
    if (previous?.rating === rating && previous.review_text === reviewText && previous.display_name === displayName && (previous.avatar_data || "") === profilePicture) return json({ ok: true });
    return json({ error: "This form already submitted a different review." }, 409);
  } catch { return json({ error: "We couldn't save your review. Please try again." }, 503); }
}
