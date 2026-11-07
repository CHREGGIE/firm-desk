import { randomBytes } from "node:crypto";
import { createBlobLead, listBlobLeads, readBlobFile, saveBlobFile, usesBlobStore } from "./blob-leads";
import { containsSensitive, isUrgentDeadline } from "./chat";
import { sql } from "./db";
import { getMatter } from "./firm";

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type LeadInput = {
  matter: string;
  company: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  opponent: string;
  place: string;
  deadline: string;
  stake: string;
  summary: string;
  docNote: string;
  draftId: string;
  source: "chat" | "form";
};

export type LeadRow = LeadInput & {
  id: string;
  reference: string;
  status: "urgent" | "ready" | "thin";
  createdAt: string;
  files: { id: string; filename: string; size: number }[];
};

export function leadStatus(input: Pick<LeadInput, "company" | "opponent" | "summary" | "deadline">): "urgent" | "ready" | "thin" {
  const thin =
    input.company.trim().length < 2 ||
    input.opponent.trim().length < 2 ||
    input.opponent === "Unknown" ||
    input.summary.trim().length < 40;
  if (isUrgentDeadline(input.deadline)) return "urgent";
  return thin ? "thin" : "ready";
}

export function validateLead(
  value: unknown,
  source: "chat" | "form",
): { ok: true; value: LeadInput } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "The message was empty." };
  const raw = value as Record<string, unknown>;
  const input: LeadInput = {
    matter: clip(raw.matter, 40),
    company: clip(raw.company, 120),
    role: clip(raw.role, 80),
    name: clip(raw.name, 80),
    email: clip(raw.email, 120).toLowerCase(),
    phone: clip(raw.phone, 30),
    opponent: clip(raw.opponent, 120),
    place: clip(raw.place, 80),
    deadline: clip(raw.deadline, 120),
    stake: clip(raw.stake, 200),
    summary: clip(raw.summary, 1000),
    docNote: clip(raw.docNote, 1000),
    draftId: clip(raw.draftId, 64),
    source,
  };
  if (input.name.length < 3) return { ok: false, error: "Add a first and last name." };
  if (!EMAIL.test(input.email)) return { ok: false, error: "That email doesn't look right." };
  if (input.summary.length < 15) return { ok: false, error: "Add a sentence about what happened." };
  if (input.matter !== "unsure" && !getMatter(input.matter)) {
    return { ok: false, error: "That isn't a matter the firm handles." };
  }
  if ([input.summary, input.name, input.company, input.opponent].some(containsSensitive)) {
    return { ok: false, error: "Remove account numbers and Social Security numbers before sending." };
  }
  const digits = input.phone.replace(/\D/g, "");
  if (input.phone && digits.length < 10) return { ok: false, error: "That phone number looks short." };
  if (input.draftId && !/^[a-f0-9]{24}$/.test(input.draftId)) {
    return { ok: false, error: "Start the file again." };
  }
  return { ok: true, value: input };
}

function durableBlob(): boolean {
  return usesBlobStore() && (process.env.DATABASE_URL?.trim() ?? "") === "";
}

export async function createLead(input: LeadInput): Promise<{ reference: string; status: "urgent" | "ready" | "thin" }> {
  if (durableBlob()) return createBlobLead(input, leadStatus(input));
  const status = leadStatus(input);
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const reference = `AG-${makeCode()}`;
    const id = randomBytes(16).toString("hex");
    try {
      await sql(
        `insert into leads (
          id, reference, status, matter, company, role, name, email, phone,
          opponent, place, deadline, stake, summary, doc_note, source, draft_id
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
        )`,
        [
          id,
          reference,
          status,
          input.matter,
          input.company,
          input.role,
          input.name,
          input.email,
          input.phone,
          input.opponent,
          input.place,
          input.deadline,
          input.stake,
          input.summary,
          input.docNote,
          input.source,
          input.draftId,
        ],
      );
      if (input.draftId) {
        await sql(`update lead_files set lead_id = $1 where draft_id = $2 and lead_id is null`, [
          id,
          input.draftId,
        ]);
      }
      return { reference, status };
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      const code = (error as { code?: string }).code;
      if (code !== "23505" && !/unique/i.test(message)) throw error;
    }
  }
  throw lastError;
}

export async function listLeads(): Promise<LeadRow[]> {
  if (durableBlob()) return listBlobLeads();
  const rows = await sql<{
    id: string;
    reference: string;
    status: "urgent" | "ready" | "thin";
    matter: string;
    company: string;
    role: string;
    name: string;
    email: string;
    phone: string;
    opponent: string;
    place: string;
    deadline: string;
    stake: string;
    summary: string;
    doc_note: string;
    source: "chat" | "form";
    draft_id: string;
    created_at: string | Date;
  }>(
    `select id, reference, status, matter, company, role, name, email, phone, opponent, place,
            deadline, stake, summary, doc_note, source, draft_id, created_at
     from leads
     order by case status when 'urgent' then 0 when 'ready' then 1 else 2 end, created_at desc
     limit 100`,
  );
  const files = await sql<{ id: string; lead_id: string; filename: string; size: number }>(
    `select id, lead_id, filename, octet_length(bytes) as size
     from lead_files
     where lead_id is not null
     order by created_at`,
  );
  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    status: row.status,
    matter: row.matter,
    company: row.company,
    role: row.role,
    name: row.name,
    email: row.email,
    phone: row.phone,
    opponent: row.opponent,
    place: row.place,
    deadline: row.deadline,
    stake: row.stake,
    summary: row.summary,
    docNote: row.doc_note,
    draftId: row.draft_id,
    source: row.source,
    createdAt: new Date(row.created_at).toISOString(),
    files: files
      .filter((file) => file.lead_id === row.id)
      .map((file) => ({ id: file.id, filename: file.filename, size: Number(file.size) })),
  }));
}

export async function saveDraftFile(input: {
  draftId: string;
  filename: string;
  contentType: string;
  bytes: Buffer;
}): Promise<{ id: string; filename: string; size: number }> {
  if (durableBlob()) return saveBlobFile(input);
  const existing = await sql<{ count: string }>(
    `select count(*)::text as count from lead_files where draft_id = $1`,
    [input.draftId],
  );
  if (Number(existing[0]?.count ?? 0) >= 5) {
    throw new Error("Five files is the limit on one lead.");
  }
  const id = randomBytes(16).toString("hex");
  await sql(
    `insert into lead_files (id, lead_id, draft_id, filename, content_type, bytes) values ($1, null, $2, $3, $4, $5)`,
    [id, input.draftId, input.filename, input.contentType, input.bytes],
  );
  return { id, filename: input.filename, size: input.bytes.length };
}

export async function readLeadFile(
  id: string,
): Promise<{ filename: string; contentType: string; bytes: Uint8Array } | null> {
  if (durableBlob()) return readBlobFile(id);
  const rows = await sql<{ filename: string; content_type: string; bytes: Uint8Array }>(
    `select filename, content_type, bytes from lead_files where id = $1 and lead_id is not null`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const bytes = row.bytes instanceof Uint8Array ? row.bytes : Buffer.from(row.bytes);
  return { filename: row.filename, contentType: row.content_type, bytes };
}

function makeCode(): string {
  const bytes = randomBytes(4);
  let code = "";
  for (let index = 0; index < 4; index += 1) code += ALPHABET[bytes[index]! % ALPHABET.length];
  return code;
}

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
