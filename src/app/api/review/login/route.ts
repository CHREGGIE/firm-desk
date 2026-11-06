import { reviewPassword, reviewToken } from "@/lib/review-auth";

export async function POST(request: Request) {
  const password = reviewPassword();
  if (!password) {
    return Response.json({ error: "Review isn't configured." }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Missing password." }, { status: 400 });
  }
  const given = body && typeof body === "object" ? (body as { password?: unknown }).password : "";
  if (typeof given !== "string" || given !== password) {
    return Response.json({ error: "That password didn't work." }, { status: 401 });
  }
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": `ag_review=${reviewToken(password)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`,
    },
  });
}
