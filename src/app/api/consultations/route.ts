import { createConsultation, validateConsultation } from "@/lib/consultations";
import { firm } from "@/lib/firm";

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
    return Response.json({ reference: "CW-0000" });
  }

  const validated = validateConsultation(raw, "form");
  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  try {
    const reference = await createConsultation(validated.value);
    return Response.json({
      reference,
      reply: `We'll reply within one business day. If you don't hear back, call ${firm.phone}.`,
    });
  } catch {
    return Response.json(
      { error: `We couldn't file that. Call ${firm.phone}.` },
      { status: 500 },
    );
  }
}
