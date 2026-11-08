import { markDocuments, recordOpen, validVisitId } from "@/lib/visits";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ ok: false }, { status: 400 });
  const raw = body as { visitId?: unknown; source?: unknown; documents?: unknown };
  if (!validVisitId(raw.visitId)) return Response.json({ ok: false }, { status: 400 });
  const source = raw.source === "embed" ? "embed" : "site";
  try {
    if (raw.documents === true) await markDocuments(raw.visitId);
    else await recordOpen(raw.visitId, source);
  } catch {
    console.error("visit open failed");
  }
  return Response.json({ ok: true });
}
