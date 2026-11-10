import { firm } from "@/lib/firm";
import {
  emptyIntake,
  respond,
  savedMessage,
  type ChatCard,
  type ChatTurn,
  type IntakeDraft,
  type IntakePhase,
} from "@/lib/chat";
import { clientIp, forbidden, mintDraftId, overLimit, sameOrigin, signedDraftId, slowDown } from "@/lib/guard";
import { createLead, validateLead } from "@/lib/leads";
import { recordChat, validVisitId } from "@/lib/visits";

const PHASES = new Set<IntakePhase>([
  "idle",
  "company",
  "role",
  "name",
  "email",
  "phone",
  "opponent",
  "place",
  "deadline",
  "stake",
  "summary",
  "documents",
  "confirm",
  "saved",
]);

const CHAT_LIMIT = 120;
const CHAT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  if (overLimit(`chat:${clientIp(request)}`, CHAT_LIMIT, CHAT_WINDOW_MS)) return slowDown();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The desk couldn't read that." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "The desk couldn't read that." }, { status: 400 });
  }

  const payload = body as { messages?: unknown; intake?: unknown; visitId?: unknown; source?: unknown };
  const messages = parseMessages(payload.messages);
  if (!messages) {
    return Response.json({ error: "Send a short message and try again." }, { status: 400 });
  }

  let result = respond(messages, parseIntake(payload.intake));
  result = { ...result, intake: { ...result.intake, draftId: serverDraftId(result.intake.draftId) } };
  let filed: { reference: string; status: "urgent" | "ready" | "thin" } | undefined;
  if (result.readyToSave) {
    const validated = validateLead(result.intake, "chat");
    if (!validated.ok) {
      result = { ...result, readyToSave: false, text: validated.error };
    } else {
      try {
        const saved = await createLead(validated.value);
        filed = saved;
        const card: ChatCard = { kind: "confirmation", reference: saved.reference, title: "File for review" };
        result = {
          text: savedMessage(saved.reference, saved.status),
          cards: [card],
          suggestions: ["Where is the office?", "Start over"],
          intake: { ...result.intake, phase: "saved" },
          readyToSave: false,
        };
      } catch {
        console.error("lead insert failed");
        result = {
          ...result,
          readyToSave: false,
          text: `I have the details, but I couldn't file them just now. Say yes to try again, or call ${firm.phone}.`,
          suggestions: ["Yes, send it"],
        };
      }
    }
  }

  if (validVisitId(payload.visitId)) {
    const lastVisitor = [...messages].reverse().find((message) => message.role === "visitor");
    try {
      await recordChat({
        visitId: payload.visitId,
        source: payload.source === "embed" ? "embed" : "site",
        visitorMessages: messages.filter((message) => message.role === "visitor").length,
        intake: result.intake,
        lastVisitorText: lastVisitor?.text ?? "",
        reference: filed?.reference,
        status: filed?.status,
      });
    } catch {
      console.error("visit update failed");
    }
  }

  return Response.json({
    text: result.text,
    cards: result.cards,
    suggestions: result.suggestions,
    intake: result.intake,
  });
}

// respond() runs without the server secret, so any draft id it returns, or one
// a visitor sent back, is swapped for a minted one unless it is already signed.
function serverDraftId(value: string): string {
  if (!value || signedDraftId(value)) return value;
  try {
    return mintDraftId();
  } catch {
    return "";
  }
}

// The desk only needs recent turns. A long conversation keeps its last 40
// instead of being refused, which used to strand anyone who fixed an answer.
const MAX_TURNS = 40;

function parseMessages(value: unknown): ChatTurn[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 400) return null;
  const messages: ChatTurn[] = [];
  for (const item of value.slice(-MAX_TURNS)) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const text = (item as { text?: unknown }).text;
    if (role !== "visitor" && role !== "desk") return null;
    if (typeof text !== "string") return null;
    const trimmed = text.trim();
    if (!trimmed) return null;
    if (role === "visitor" && trimmed.length > 2000) return null;
    messages.push({ role, text: trimmed.slice(0, 4000) });
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
  return {
    phase,
    matter: clip(raw.matter, 40),
    company: clip(raw.company, 120),
    role: clip(raw.role, 80),
    name: clip(raw.name, 80),
    email: clip(raw.email, 120),
    phone: clip(raw.phone, 30),
    opponent: clip(raw.opponent, 120),
    place: clip(raw.place, 80),
    deadline: clip(raw.deadline, 120),
    stake: clip(raw.stake, 200),
    summary: clip(raw.summary, 1000),
    docNote: clip(raw.docNote, 1000),
    draftId: /^[a-f0-9]{24}$/.test(clip(raw.draftId, 64)) ? clip(raw.draftId, 64) : "",
    editing: raw.editing === true,
  };
}

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
