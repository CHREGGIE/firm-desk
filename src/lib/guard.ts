import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { reviewPassword } from "./review-auth";

// Draft ids are 24 hex characters: 12 random, then 12 of an HMAC over those.
// The server mints them, so a visitor cannot invent fresh ids to get around
// the five-file limit on one lead.
const DRAFT_ID = /^[a-f0-9]{24}$/;

function draftSecret(): string | null {
  const configured = process.env.DESK_SECRET?.trim();
  if (configured) return configured;
  const password = reviewPassword();
  return password ? `draft:${password}` : null;
}

function draftTag(nonce: string, secret: string): string {
  return createHmac("sha256", secret).update(`draft:${nonce}`).digest("hex").slice(0, 12);
}

export function mintDraftId(): string {
  const secret = draftSecret();
  if (!secret) throw new Error("The desk isn't configured for files.");
  const nonce = randomBytes(6).toString("hex");
  return nonce + draftTag(nonce, secret);
}

export function signedDraftId(value: unknown): value is string {
  if (typeof value !== "string" || !DRAFT_ID.test(value)) return false;
  const secret = draftSecret();
  if (!secret) return false;
  const expected = Buffer.from(draftTag(value.slice(0, 12), secret));
  return timingSafeEqual(expected, Buffer.from(value.slice(12)));
}

// Browsers always send Origin on a POST from fetch. A POST that names another
// site came from a page that is not this desk or its /embed iframe.
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// A fixed window per key, held in this process. On Vercel each instance keeps
// its own count, so this slows one caller down. It is not a global limit; a
// Vercel Firewall rate-limit rule is the place for that.
type Window = { count: number; resetAt: number };
const store = (globalThis as { __agLimits?: Map<string, Window> }).__agLimits ?? new Map<string, Window>();
(globalThis as { __agLimits?: Map<string, Window> }).__agLimits = store;

export function overLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    if (store.size > 10_000) {
      for (const [name, entry] of store) if (entry.resetAt <= now) store.delete(name);
    }
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

export function clearLimit(key: string): void {
  store.delete(key);
}

export function forbidden(): Response {
  return Response.json({ error: "That request didn't come from the desk." }, { status: 403 });
}

export function slowDown(): Response {
  return Response.json(
    { error: "Too many tries in a short time. Wait a few minutes and try again." },
    { status: 429, headers: { "retry-after": "600" } },
  );
}
