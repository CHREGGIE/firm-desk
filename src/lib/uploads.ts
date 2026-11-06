const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const MAX_BYTES = 8_000_000;

export function inspectUpload(
  filename: string,
  bytes: Buffer,
): { ok: true; filename: string; contentType: string } | { ok: false; error: string } {
  if (bytes.length === 0) return { ok: false, error: "That file is empty." };
  if (bytes.length > MAX_BYTES) return { ok: false, error: "Each file has to be under 8 MB." };
  const clean = filename.split(/[/\\]/).pop()?.replace(/[^\w.\- ()]/g, "") ?? "";
  const extension = clean.split(".").pop()?.toLowerCase() ?? "";
  const contentType = TYPES[extension];
  if (!contentType || !clean.includes(".")) {
    return { ok: false, error: "Send a PDF, Word document, text file, or a photo." };
  }
  if (!signatureOk(extension, bytes)) {
    return { ok: false, error: `${clean} doesn't look like a ${extension.toUpperCase()} file.` };
  }
  return { ok: true, filename: clean.slice(0, 120), contentType };
}

function signatureOk(extension: string, bytes: Buffer): boolean {
  if (extension === "pdf") return bytes.subarray(0, 4).toString() === "%PDF";
  if (extension === "png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === "jpg" || extension === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (extension === "webp") return bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (extension === "docx") return bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (extension === "doc") return bytes.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
  if (extension === "txt") return !bytes.includes(0);
  return false;
}
