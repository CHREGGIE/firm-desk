import { clearLimit, clientIp, forbidden, overLimit, sameOrigin, slowDown } from "@/lib/guard";
import { passwordMatches, reviewPassword, reviewToken } from "@/lib/review-auth";

const WRONG_LIMIT = 8;
const WRONG_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const password = reviewPassword();
  if (!password) {
    return Response.json({ error: "Review isn't configured." }, { status: 503 });
  }
  const key = `login:${clientIp(request)}`;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Missing password." }, { status: 400 });
  }
  const given = body && typeof body === "object" ? (body as { password?: unknown }).password : "";
  if (typeof given !== "string" || given.length > 200 || !passwordMatches(given, password)) {
    if (overLimit(key, WRONG_LIMIT, WRONG_WINDOW_MS)) return slowDown();
    await new Promise((resolve) => setTimeout(resolve, 400));
    return Response.json({ error: "That password didn't work." }, { status: 401 });
  }
  clearLimit(key);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": `ag_review=${reviewToken(password)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`,
    },
  });
}
