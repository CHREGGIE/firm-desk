import { get, list, put } from "@vercel/blob";
import type { Visit } from "./metrics";

const access = "private" as const;

export async function readBlobVisit(id: string): Promise<Visit | null> {
  return readJson<Visit>(`visits/${id}.json`);
}

export async function writeBlobVisit(visit: Visit): Promise<void> {
  await put(`visits/${visit.id}.json`, JSON.stringify(visit), {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function listBlobVisits(): Promise<Visit[]> {
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "visits/", cursor, limit: 1000 });
    for (const blob of page.blobs) {
      if (blob.pathname.endsWith(".json")) names.push(blob.pathname);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const visits: Visit[] = [];
  for (const name of names) {
    const visit = await readJson<Visit>(name);
    if (visit?.id) visits.push({ ...visit, tracked: true });
  }
  return visits;
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access, useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return JSON.parse(await new Response(result.stream).text()) as T;
}
