import { forbidden, sameOrigin } from "@/lib/guard";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": "ag_review=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
}
