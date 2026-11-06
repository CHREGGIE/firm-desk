import { firm } from "@/lib/firm";
import { createLead, leadStatus, validateLead } from "@/lib/leads";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "We couldn't read that form." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "We couldn't read that form." }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;
  if (typeof raw.fax === "string" && raw.fax.trim()) {
    return Response.json({ reference: "AG-0000", status: "thin" });
  }
  const validated = validateLead(raw, "form");
  if (!validated.ok) return Response.json({ error: validated.error }, { status: 400 });
  try {
    const saved = await createLead(validated.value);
    const status = saved.status || leadStatus(validated.value);
    const mark =
      status === "urgent"
        ? "It's marked as a deadline."
        : status === "ready"
          ? "It's marked ready for review."
          : "It's marked thin, because a name or a fact is still missing.";
    return Response.json({
      reference: saved.reference,
      status,
      reply: `Filed as ${saved.reference}. ${mark} If you don't hear back, call ${firm.phone}.`,
    });
  } catch {
    console.error("lead insert failed");
    return Response.json({ error: `We couldn't file that. Call ${firm.phone}.` }, { status: 500 });
  }
}
