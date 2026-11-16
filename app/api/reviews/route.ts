import { hasReviewStore, publishedBlobReviews, savePendingBlob } from "../../../lib/blob-reviews";
import { getReviewDb } from "../../../lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxBodyBytes = 16 * 1024;
const receiptPattern = /^(?=.*[a-z0-9])[a-z0-9 #./-]{1,64}$/i;
const submissionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function conflictingSubmission() {
  return json({ error: "This form already sent a different review. Start a new review to submit again." }, 409);
}

async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let bytes = 0;
  let content = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBodyBytes) {
        await reader.cancel();
        return json({ error: "This review is too long to submit." }, 413);
      }
      content += decoder.decode(value, { stream: true });
    }
    return JSON.parse(content + decoder.decode());
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function GET() {
  try {
    const sql = getReviewDb();
    if (!sql) {
      if (!hasReviewStore()) return json({ reviews: [], acceptingReviews: false });
      return json({ reviews: await publishedBlobReviews(), acceptingReviews: true });
    }

    const reviews = await sql`
      SELECT id::text AS id, rating, review_text AS text, created_at AS date
      FROM public.reviews WHERE published = true
      ORDER BY created_at DESC, public.reviews.id DESC
    `;
    return json({ reviews, acceptingReviews: true });
  } catch {
    return json({ error: "We couldn't load guest reviews. Please try again." }, 503);
  }
}

export async function POST(request: Request) {
  try {
    const sql = getReviewDb();
    if (!sql && !hasReviewStore()) {
      return json({ error: "Review submissions are temporarily unavailable." }, 503);
    }
    if (request.headers.get("Sec-Fetch-Site") === "cross-site") {
      return json({ error: "Please submit your review from the feedback page." }, 403);
    }
    if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return json({ error: "Please send this review as JSON." }, 415);
    }

    const body = await readBody(request);
    if (body instanceof Response) return body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "Please check the review form and try again." }, 400);
    }
    const { receipt, rating, text, submissionId } = body as Record<string, unknown>;
    if (typeof receipt !== "string" || !receiptPattern.test(receipt.trim())) {
      return json({ error: "Enter the receipt number printed on your receipt." }, 400);
    }
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return json({ error: "Choose a rating from 1 to 5 stars." }, 400);
    }
    const reviewText = typeof text === "string" ? text.trim() : "";
    if (!reviewText || reviewText.length > 2000 || reviewText.includes("\0")) {
      return json({ error: "Write a review between 1 and 2,000 characters." }, 400);
    }
    if (typeof submissionId !== "string" || !submissionIdPattern.test(submissionId)) {
      return json({ error: "Reopen the review form and try again." }, 400);
    }
    if (!sql) {
      const status = await savePendingBlob(submissionId, rating, reviewText);
      return status === 409 ? conflictingSubmission() : json({ ok: true }, status);
    }
    const [saved] = await sql`
      INSERT INTO public.reviews (submission_id, rating, review_text)
      VALUES (${submissionId}, ${rating}, ${reviewText})
      ON CONFLICT (submission_id) DO NOTHING RETURNING id
    `;
    if (saved) return json({ ok: true }, 201);

    const [previous] = await sql`
      SELECT rating, review_text FROM public.reviews WHERE submission_id = ${submissionId}
    `;
    if (previous?.rating === rating && previous.review_text === reviewText) {
      return json({ ok: true });
    }
    return conflictingSubmission();
  } catch {
    return json({ error: "We couldn't save your review. Please try again." }, 503);
  }
}
