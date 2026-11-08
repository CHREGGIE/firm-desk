import { randomBytes } from "node:crypto";
import { listBlobVisits, readBlobVisit, writeBlobVisit } from "./blob-visits";
import { engagementOf, type IntakeDraft } from "./chat";
import { sql } from "./db";
import {
  mergeVisit,
  papersAttached,
  reachedPapers,
  type Visit,
  type VisitSource,
} from "./metrics";
import { usesBlobStore } from "./blob-leads";

const VISIT_ID = /^[a-f0-9]{24}$/;

type VisitRow = {
  id: string;
  source: VisitSource;
  opened_at: string | Date;
  updated_at: string | Date;
  messages: number;
  phase: string;
  matter: string;
  kind: Visit["kind"];
  note: string;
  company: string;
  place: string;
  reference: string;
  status: Visit["status"];
  has_email: number;
  reached_papers: number;
  documents: number;
};

export function validVisitId(value: unknown): value is string {
  return typeof value === "string" && VISIT_ID.test(value);
}

export async function recordOpen(id: string, source: VisitSource): Promise<void> {
  if (!validVisitId(id) || (source !== "site" && source !== "embed")) return;
  const now = new Date().toISOString();
  await remember({
    id,
    source,
    openedAt: now,
    updatedAt: now,
    messages: 0,
    phase: "idle",
    matter: "",
    kind: "opened",
    note: "Opened the desk",
    company: "",
    place: "",
    reference: "",
    status: "",
    hasEmail: false,
    reachedPapers: false,
    documents: false,
    tracked: true,
  });
}

export async function recordChat(input: {
  visitId: string;
  source: VisitSource;
  visitorMessages: number;
  intake: IntakeDraft;
  lastVisitorText: string;
  reference?: string;
  status?: Visit["status"];
}): Promise<void> {
  if (!validVisitId(input.visitId)) return;
  const source = input.source === "embed" ? "embed" : "site";
  const filed = Boolean(input.reference);
  const intake = filed ? { ...input.intake, phase: "saved" as const } : input.intake;
  const engagement = engagementOf({
    visitorText: input.lastVisitorText,
    intake,
    visitorMessages: input.visitorMessages,
    filed,
  });
  const now = new Date().toISOString();
  await remember({
    id: input.visitId,
    source,
    openedAt: now,
    updatedAt: now,
    messages: Math.min(40, Math.max(0, input.visitorMessages)),
    phase: intake.phase,
    matter: intake.matter,
    kind: engagement.kind,
    note: engagement.note,
    company: intake.company,
    place: intake.place,
    reference: input.reference ?? "",
    status: input.status ?? "",
    hasEmail: intake.email.includes("@"),
    reachedPapers: reachedPapers(intake.phase),
    documents: papersAttached(intake.docNote),
    tracked: true,
  });
}

export async function markDocuments(id: string): Promise<void> {
  if (!validVisitId(id)) return;
  const existing = await readVisit(id);
  if (!existing || existing.documents) return;
  await writeVisit({ ...existing, documents: true, updatedAt: new Date().toISOString() });
}

export async function recordFormFile(input: {
  matter: string;
  company: string;
  place: string;
  reference: string;
  status: Visit["status"];
  documents: boolean;
}): Promise<void> {
  const now = new Date().toISOString();
  await remember({
    id: randomBytes(12).toString("hex"),
    source: "form",
    openedAt: now,
    updatedAt: now,
    messages: 1,
    phase: "saved",
    matter: input.matter,
    kind: "filed",
    note: "Filed from the consult form",
    company: input.company,
    place: input.place,
    reference: input.reference,
    status: input.status,
    hasEmail: true,
    reachedPapers: true,
    documents: input.documents,
    tracked: true,
  });
}

export async function listTrackedVisits(): Promise<Visit[]> {
  if (durableBlob()) return listBlobVisits();
  const rows = await sql<VisitRow>(
    `select id, source, opened_at, updated_at, messages, phase, matter, kind, note, company, place,
            reference, status, has_email, reached_papers, documents
     from visits
     order by updated_at desc
     limit 1000`,
  );
  return rows.map(fromRow);
}

async function remember(incoming: Visit): Promise<void> {
  const existing = await readVisit(incoming.id);
  await writeVisit(mergeVisit(existing, incoming));
}

async function readVisit(id: string): Promise<Visit | null> {
  if (durableBlob()) return readBlobVisit(id);
  const rows = await sql<VisitRow>(
    `select id, source, opened_at, updated_at, messages, phase, matter, kind, note, company, place,
            reference, status, has_email, reached_papers, documents
     from visits where id = $1`,
    [id],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

async function writeVisit(visit: Visit): Promise<void> {
  if (durableBlob()) {
    await writeBlobVisit(visit);
    return;
  }
  await sql(
    `insert into visits (
       id, source, opened_at, updated_at, messages, phase, matter, kind, note, company, place,
       reference, status, has_email, reached_papers, documents
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     on conflict (id) do update set
       updated_at = excluded.updated_at,
       messages = excluded.messages,
       phase = excluded.phase,
       matter = excluded.matter,
       kind = excluded.kind,
       note = excluded.note,
       company = excluded.company,
       place = excluded.place,
       reference = excluded.reference,
       status = excluded.status,
       has_email = excluded.has_email,
       reached_papers = excluded.reached_papers,
       documents = excluded.documents`,
    [
      visit.id,
      visit.source,
      visit.openedAt,
      visit.updatedAt,
      visit.messages,
      visit.phase,
      visit.matter,
      visit.kind,
      visit.note,
      visit.company,
      visit.place,
      visit.reference,
      visit.status,
      visit.hasEmail ? 1 : 0,
      visit.reachedPapers ? 1 : 0,
      visit.documents ? 1 : 0,
    ],
  );
}

function fromRow(row: VisitRow): Visit {
  return {
    id: row.id,
    source: row.source,
    openedAt: new Date(row.opened_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    messages: Number(row.messages),
    phase: row.phase,
    matter: row.matter,
    kind: row.kind,
    note: row.note,
    company: row.company,
    place: row.place,
    reference: row.reference,
    status: row.status,
    hasEmail: Number(row.has_email) === 1,
    reachedPapers: Number(row.reached_papers) === 1,
    documents: Number(row.documents) === 1,
    tracked: true,
  };
}

function durableBlob(): boolean {
  return usesBlobStore() && (process.env.DATABASE_URL?.trim() ?? "") === "";
}
