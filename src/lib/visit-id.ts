const SITE_KEY = "ag-visit";
const EMBED_KEY = "ag-visit-embed";

export function visitIdFor(embed: boolean): string {
  const key = embed ? EMBED_KEY : SITE_KEY;
  const existing = sessionStorage.getItem(key);
  if (existing && /^[a-f0-9]{24}$/.test(existing)) return existing;
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem(key, id);
  return id;
}

export function rotateVisitId(embed: boolean): string {
  sessionStorage.removeItem(embed ? EMBED_KEY : SITE_KEY);
  return visitIdFor(embed);
}
