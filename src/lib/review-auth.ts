import { createHmac, timingSafeEqual } from "node:crypto";

const LOCAL_PASSWORD = "desk-review";

export function reviewPassword(): string | null {
  const configured = process.env.REVIEW_PASSWORD?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return null;
  return LOCAL_PASSWORD;
}

export function localReviewHint(): string {
  if (process.env.REVIEW_PASSWORD?.trim()) return "";
  if (process.env.NODE_ENV === "production") return "";
  return LOCAL_PASSWORD;
}

export function reviewToken(password: string): string {
  return createHmac("sha256", password).update("ainsworth-gorkin-review").digest("hex");
}

export function isReviewCookie(value: string | undefined): boolean {
  const password = reviewPassword();
  if (!password || !value) return false;
  const expected = Buffer.from(reviewToken(password));
  const received = Buffer.from(value);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
