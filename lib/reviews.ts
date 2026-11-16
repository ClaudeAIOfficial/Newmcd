import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;

export function getReviewDb() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;

  client ??= postgres(url, {
    max: 2,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 8,
  });
  return client;
}
