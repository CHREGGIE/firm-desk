import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let pool: pg.Pool | undefined;

const globalForDb = globalThis as typeof globalThis & {
  __agDesk?: Promise<PGlite>;
};

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await pool.query(text, params)).rows as T[];
  }
  // On Vercel an in-memory database lives in one short-lived function. A lead
  // written there is gone within minutes while the visitor holds a reference.
  // Refuse instead, so the desk tells them to call.
  if (process.env.VERCEL) {
    throw new Error("No lead storage: set DATABASE_URL or connect a private Blob store.");
  }
  globalForDb.__agDesk ??= startLocal().catch((error: unknown) => {
    globalForDb.__agDesk = undefined;
    throw error;
  });
  return (await (await globalForDb.__agDesk).query<T>(text, params)).rows;
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite();
  const files = (await readdir("migrations").catch(() => [])).filter((file) =>
    file.endsWith(".sql"),
  );
  files.sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  return db;
}
