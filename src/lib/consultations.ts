import { randomBytes } from "node:crypto";
import { sql } from "./db";
import { getPractice } from "./firm";

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type ConsultationInput = {
  name: string;
  email: string;
  phone: string;
  practice: string;
  summary: string;
  timing: string;
  contact: string;
  source: "chat" | "form";
};

export function validateConsultation(
  value: unknown,
  source: "chat" | "form",
): { ok: true; value: ConsultationInput } | { ok: false; error: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "The message was empty." };
  }
  const raw = value as Record<string, unknown>;
  const name = clip(raw.name, 80);
  const email = clip(raw.email, 120).toLowerCase();
  const phone = clip(raw.phone, 30);
  const practice = clip(raw.practice, 40);
  const summary = clip(raw.summary, 1000);
  const timing = clip(raw.timing, 80);
  const contact = clip(raw.contact, 20);

  if (name.length < 3) return { ok: false, error: "Add a first and last name." };
  if (!EMAIL.test(email)) return { ok: false, error: "That email doesn't look right." };
  if (summary.length < 15) {
    return { ok: false, error: "Add a sentence about what happened." };
  }
  if (containsSensitive(summary) || containsSensitive(name)) {
    return {
      ok: false,
      error: "Remove account numbers and Social Security numbers before sending.",
    };
  }
  if (practice && practice !== "unsure" && !getPractice(practice)) {
    return { ok: false, error: "Pick a practice the firm actually handles." };
  }
  if (!["phone", "email", "either", ""].includes(contact)) {
    return { ok: false, error: "Say whether we should call or email." };
  }
  const digits = phone.replace(/\D/g, "");
  if (phone && digits.length < 10) {
    return { ok: false, error: "That phone number looks short." };
  }
  if (contact === "phone" && digits.length < 10) {
    return { ok: false, error: "Add a phone number if we should call." };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      phone,
      practice,
      summary,
      timing,
      contact,
      source,
    },
  };
}

export async function createConsultation(
  input: ConsultationInput,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const reference = makeReference();
    try {
      await sql(
        `insert into consultations
          (id, reference, name, email, phone, practice, summary, timing, contact, source)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          reference,
          reference,
          input.name,
          input.email,
          input.phone,
          input.practice,
          input.summary,
          input.timing,
          input.contact,
          input.source,
        ],
      );
      return reference;
    } catch (error) {
      lastError = error;
      if (!isUniqueViolation(error)) break;
    }
  }
  console.error("consultation insert failed");
  throw lastError instanceof Error ? lastError : new Error("consultation insert failed");
}

function makeReference(): string {
  const bytes = randomBytes(4);
  let code = "CW-";
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
  return code;
}

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function containsSensitive(value: string): boolean {
  return (
    /\b\d{3}-\d{2}-\d{4}\b/.test(value) ||
    /\b(?:\d[ -]?){13,19}\b/.test(value) ||
    /\b(social security|ssn|routing number)\b/i.test(value)
  );
}

function isUniqueViolation(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  ) {
    return true;
  }
  return error instanceof Error && /unique/i.test(error.message);
}
