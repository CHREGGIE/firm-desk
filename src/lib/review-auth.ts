import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// There is no built-in password. Production needs REVIEW_PASSWORD. A dev
// server without it makes a random one when it starts and prints it on the
// login page, so a fresh clone still works and nothing guessable ships.
function devPassword(): string {
  const holder = globalThis as { __agDevReviewPassword?: string };
  holder.__agDevReviewPassword ??= `dev-${randomBytes(6).toString("hex")}`;
  return holder.__agDevReviewPassword;
}

export function reviewPassword(): string | null {
  const configured = process.env.REVIEW_PASSWORD?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return null;
  return devPassword();
}

export function localReviewHint(): string {
  if (process.env.REVIEW_PASSWORD?.trim()) return "";
  if (process.env.NODE_ENV === "production") return "";
  return devPassword();
}

export function reviewToken(password: string): string {
  return createHmac("sha256", password).update("ainsworth-gorkin-review").digest("hex");
}

export function passwordMatches(given: string, password: string): boolean {
  const a = createHmac("sha256", "ag-compare").update(given).digest();
  const b = createHmac("sha256", "ag-compare").update(password).digest();
  return timingSafeEqual(a, b);
}

export function isReviewCookie(value: string | undefined): boolean {
  const password = reviewPassword();
  if (!password || !value) return false;
  const expected = Buffer.from(reviewToken(password));
  const received = Buffer.from(value);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
