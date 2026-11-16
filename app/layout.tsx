import type { Metadata } from "next";
import "./globals.css";

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

export const metadata: Metadata = {
  metadataBase: new URL(vercelHost ? `https://${vercelHost}` : "http://localhost:3000"),
  title: "Guest Feedback | McDonald’s",
  description: "How was your visit? Share a McDonald’s restaurant review using the number on your receipt.",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "How was your visit? | McDonald’s Guest Feedback", description: "Tell us about your last visit.", images: ["/meal.webp"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
