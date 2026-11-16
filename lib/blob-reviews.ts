import { get, list, put } from "@vercel/blob";
type Review = { id: string; rating: number; text: string; date: string; name?: string; avatar?: string; source?: "google"; sourceUrl?: string };
const publicListPath = "published/reviews.json";
export function hasReviewStore() { return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()); }
async function readJson(path: string): Promise<unknown> {
  const file = await get(path, { access: "private", useCache: false });
  if (!file) return undefined;
  if (file.statusCode !== 200 || !file.stream) throw new Error("Review unavailable.");
  return new Response(file.stream).json();
}
function asReview(value: unknown): Review {
  if (!value || typeof value !== "object") throw new Error("Invalid review.");
  const { id, rating, text, date, name, avatar, source, sourceUrl } = value as Partial<Review>;
  if (typeof id !== "string" || !id || typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5 || typeof text !== "string" || !text.trim() || text.length > 2000 || typeof date !== "string" || !Number.isFinite(Date.parse(date))) throw new Error("Invalid review data.");
  const result: Review = {id, rating, text, date};
  if (typeof name === "string" && name.trim() && name.length <= 60) result.name = name.trim();
  if (typeof avatar === "string" && avatar.length <= 80000 && /^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/]+=*$/.test(avatar)) result.avatar = avatar;
  if (source === "google" && typeof sourceUrl === "string" && /^https:\/\/(www\.)?google\.com\//.test(sourceUrl)) { result.source = source; result.sourceUrl = sourceUrl; }
  return result;
}
export async function publishedBlobReviews(): Promise<Review[]> {
  const curated = await readJson(publicListPath);
  const published = Array.isArray(curated) ? curated.map(asReview) : [];
  const userReviews: Review[] = [];
  let cursor: string | undefined;
  do {
    const batch = await list({ prefix: "submitted/", limit: 500, cursor });
    const items = await Promise.all(batch.blobs.map(b => readJson(b.pathname).then(asReview)));
    userReviews.push(...items);
    cursor = batch.hasMore ? batch.cursor : undefined;
  } while (cursor && userReviews.length < 1000);
  return [...userReviews.sort((a,b) => Date.parse(b.date) - Date.parse(a.date)), ...published].slice(0,1000);
}
export async function saveSubmittedBlob(id: string, rating: number, text: string, name: string, avatar: string) {
  const review: Review = { id, rating, text, date: new Date().toISOString(), name, ...(avatar ? { avatar } : {}) };
  const path = `submitted/${id.toLowerCase()}.json`;
  try {
    await put(path, JSON.stringify(review), { access: "private", allowOverwrite: false, addRandomSuffix: false, contentType: "application/json" });
    return 201;
  } catch (error) {
    const previous = await readJson(path);
    if (!previous) throw error;
    const saved = asReview(previous);
    return saved.id.toLowerCase() === id.toLowerCase() && saved.rating === rating && saved.text === text && saved.name === name && (saved.avatar || "") === avatar ? 200 : 409;
  }
}
