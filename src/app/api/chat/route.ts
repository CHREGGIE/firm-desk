import {
  emptyIntake,
  respond,
  savedMessage,
  type ChatCard,
  type ChatTurn,
  type IntakeContact,
  type IntakeDraft,
  type IntakePhase,
} from "@/lib/chat";
import { createConsultation, validateConsultation } from "@/lib/consultations";

const PHASES = new Set<IntakePhase>([
  "idle",
  "matter",
  "name",
  "email",
  "phone",
  "summary",
  "timing",
  "contact",
  "confirm",
  "saved",
]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The desk couldn't read that." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "The desk couldn't read that." }, { status: 400 });
  }

  const payload = body as { messages?: unknown; intake?: unknown };
  const messages = parseMessages(payload.messages);
  if (!messages) {
    return Response.json(
      { error: "Send a short message and try again." },
      { status: 400 },
    );
  }

  const intake = parseIntake(payload.intake);
  let result = respond(messages, intake);

  if (result.readyToSave) {
    const validated = validateConsultation(
      {
        name: result.intake.name,
        email: result.intake.email,
        phone: result.intake.phone,
        practice: result.intake.practice,
        summary: result.intake.summary,
        timing: result.intake.timing,
        contact: result.intake.contact,
      },
      "chat",
    );
    if (!validated.ok) {
      result = {
        ...result,
        readyToSave: false,
        text: validated.error,
      };
    } else {
      try {
        const reference = await createConsultation(validated.value);
        const card: ChatCard = {
          kind: "confirmation",
          reference,
          title: "Message filed",
        };
        result = {
          text: savedMessage(reference),
          cards: [card],
          suggestions: ["Where is the office?", "Who will call me?", "Start over"],
          intake: { ...result.intake, phase: "saved" },
          readyToSave: false,
        };
      } catch {
        result = {
          ...result,
          readyToSave: false,
          text: "I have the details, but I couldn't file them just now. Say yes to try again, or call (401) 555-0148.",
          suggestions: ["Yes, send it"],
        };
      }
    }
  }

  return Response.json({
    text: result.text,
    cards: result.cards,
    suggestions: result.suggestions,
    intake: result.intake,
  });
}

function parseMessages(value: unknown): ChatTurn[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) return null;
  const messages: ChatTurn[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const text = (item as { text?: unknown }).text;
    if (role !== "visitor" && role !== "desk") return null;
    if (typeof text !== "string") return null;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 2000) return null;
    messages.push({ role, text: trimmed });
  }
  if (messages[messages.length - 1]?.role !== "visitor") return null;
  return messages;
}

function parseIntake(value: unknown): IntakeDraft {
  const blank = emptyIntake();
  if (!value || typeof value !== "object") return blank;
  const raw = value as Record<string, unknown>;
  const phase = typeof raw.phase === "string" && PHASES.has(raw.phase as IntakePhase)
    ? (raw.phase as IntakePhase)
    : "idle";
  const contact = raw.contact;
  const safeContact: IntakeContact =
    contact === "phone" || contact === "email" || contact === "either" ? contact : "";
  return {
    name: clip(raw.name, 80),
    email: clip(raw.email, 120),
    phone: clip(raw.phone, 30),
    practice: clip(raw.practice, 40),
    summary: clip(raw.summary, 1000),
    timing: clip(raw.timing, 80),
    contact: safeContact,
    phase,
  };
}

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
