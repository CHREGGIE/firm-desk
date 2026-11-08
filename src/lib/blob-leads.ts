import { randomBytes } from "node:crypto";
import { get, list, put } from "@vercel/blob";
import type { LeadInput, LeadRow } from "./leads";
import { FILED_ALREADY, UploadRefused } from "./upload-errors";

const access = "private" as const;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type StoredFile = { id: string; filename: string; size: number };

type FileMeta = {
  id: string;
  draftId: string;
  leadId: string | null;
  filename: string;
  contentType: string;
  size: number;
};

type StoredLead = LeadInput & {
  id: string;
  reference: string;
  status: "urgent" | "ready" | "thin";
  createdAt: string;
  files: StoredFile[];
};

export function usesBlobStore(): boolean {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

export async function createBlobLead(
  input: LeadInput,
  status: "urgent" | "ready" | "thin",
): Promise<{ reference: string; status: "urgent" | "ready" | "thin" }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const reference = `AG-${makeCode()}`;
    const record: StoredLead = {
      ...input,
      id: randomBytes(16).toString("hex"),
      reference,
      status,
      createdAt: new Date().toISOString(),
      files: [],
    };
    try {
      await writeJson(`leads/${reference}.json`, record, false);
    } catch (error) {
      lastError = error;
      if (isConflict(error)) continue;
      throw error;
    }
    if (input.draftId) {
      // Marks the draft as filed, so a later upload to it is refused instead of
      // landing where no lawyer will ever see it.
      await put(`drafts/${input.draftId}/_filed`, reference, {
        access,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "text/plain",
      });
      record.files = await attachDraft(input.draftId, record.id);
    }
    if (record.files.length > 0) await writeJson(`leads/${reference}.json`, record, true);
    return { reference, status };
  }
  throw lastError;
}

export async function listBlobLeads(): Promise<LeadRow[]> {
  const names = (await listPathnames("leads/")).filter((name) => name.endsWith(".json"));
  const leads: StoredLead[] = [];
  for (const name of names) {
    const row = await readJson<StoredLead>(name);
    if (row) leads.push(row);
  }
  const rank = { urgent: 0, ready: 1, thin: 2 };
  leads.sort((a, b) => rank[a.status] - rank[b.status] || b.createdAt.localeCompare(a.createdAt));
  return leads.slice(0, 100);
}

export async function saveBlobFile(input: {
  draftId: string;
  filename: string;
  contentType: string;
  bytes: Buffer;
}): Promise<{ id: string; filename: string; size: number }> {
  const names = await listPathnames(`drafts/${input.draftId}/`);
  if (names.includes(`drafts/${input.draftId}/_filed`)) throw new UploadRefused(FILED_ALREADY);
  const existing = names.filter((name) => name.endsWith(".json"));
  if (existing.length >= 5) throw new UploadRefused("Five files is the limit on one lead.");
  const id = randomBytes(16).toString("hex");
  const meta: FileMeta = {
    id,
    draftId: input.draftId,
    leadId: null,
    filename: input.filename,
    contentType: input.contentType,
    size: input.bytes.length,
  };
  await put(`drafts/${input.draftId}/${id}`, input.bytes, {
    access,
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: input.contentType,
  });
  await writeJson(`drafts/${input.draftId}/${id}.json`, meta, false);
  await writeJson(`files/${id}.json`, meta, false);
  return { id, filename: input.filename, size: input.bytes.length };
}

export async function readBlobFile(
  id: string,
): Promise<{ filename: string; contentType: string; bytes: Uint8Array } | null> {
  const meta = await readJson<FileMeta>(`files/${id}.json`);
  if (!meta?.leadId) return null;
  const result = await get(`drafts/${meta.draftId}/${id}`, { access, useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const bytes = new Uint8Array(await new Response(result.stream).arrayBuffer());
  return { filename: meta.filename, contentType: meta.contentType, bytes };
}

async function attachDraft(draftId: string, leadId: string): Promise<StoredFile[]> {
  const names = (await listPathnames(`drafts/${draftId}/`)).filter((name) => name.endsWith(".json"));
  const files: StoredFile[] = [];
  for (const name of names) {
    const meta = await readJson<FileMeta>(name);
    if (!meta || meta.leadId) continue;
    const attached = { ...meta, leadId };
    await writeJson(name, attached, true);
    await writeJson(`files/${meta.id}.json`, attached, true);
    files.push({ id: meta.id, filename: meta.filename, size: meta.size });
  }
  return files;
}

async function writeJson(pathname: string, value: unknown, overwrite: boolean): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access,
    addRandomSuffix: false,
    allowOverwrite: overwrite,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access, useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return JSON.parse(await new Response(result.stream).text()) as T;
}

async function listPathnames(prefix: string): Promise<string[]> {
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    for (const blob of page.blobs) names.push(blob.pathname);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return names;
}

function makeCode(): string {
  const bytes = randomBytes(4);
  let code = "";
  for (let index = 0; index < 4; index += 1) code += ALPHABET[bytes[index]! % ALPHABET.length];
  return code;
}

function isConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return /already exists|conflict|duplicate/i.test(message);
}
