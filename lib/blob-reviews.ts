import { get, put } from "@vercel/blob";

type Review = { id: string; rating: number; text: string; date: string };
const publicListPath = "published/reviews.json";

export function hasReviewStore() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_STORE_ID?.trim());
}

async function readJson(path: string): Promise<unknown> {
  const file = await get(path, { access: "private", useCache: false });
  if (!file) return undefined;
  if (file.statusCode !== 200 || !file.stream) throw new Error("Review file unavailable.");
  return new Response(file.stream).json();
}

function asReview(value: unknown): Review {
  if (!value || typeof value !== "object") throw new Error("Invalid review data.");
  const { id, rating, text, date } = value as Partial<Review>;
  if (
    typeof id !== "string" || !id.trim() || id.length > 128 ||
    typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
    typeof text !== "string" || !text.trim() || text.length > 2000 ||
    typeof date !== "string" || !Number.isFinite(Date.parse(date))
  ) throw new Error("Invalid review data.");
  return { id, rating, text, date };
}

export async function publishedBlobReviews(): Promise<Review[]> {
  // Only this curated file can appear on the site. Pending blobs are never listed.
  const data = await readJson(publicListPath);
  if (data === undefined) return [];
  if (!Array.isArray(data)) throw new Error("Invalid published reviews.");
  return data.map(asReview);
}

export async function savePendingBlob(id: string, rating: number, text: string) {
  const review: Review = { id, rating, text, date: new Date().toISOString() };
  const path = `pending/${id.toLowerCase()}.json`;
  try {
    await put(path, JSON.stringify(review), {
      access: "private", allowOverwrite: false, addRandomSuffix: false,
      contentType: "application/json",
    });
    return 201;
  } catch (writeError) {
    // A concurrent retry or a lost write acknowledgement may leave the object saved.
    const existing = await readJson(path);
    if (existing === undefined) throw writeError;
    const saved = asReview(existing);
    return saved.id.toLowerCase() === id.toLowerCase() && saved.rating === rating && saved.text === text ? 200 : 409;
  }
}
