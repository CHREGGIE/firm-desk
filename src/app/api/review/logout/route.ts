export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": "ag_review=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
}
