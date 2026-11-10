import { clientIp, forbidden, mintDraftId, overLimit, sameOrigin, signedDraftId, slowDown } from "@/lib/guard";
import { saveDraftFile } from "@/lib/leads";
import { UploadRefused } from "@/lib/upload-errors";
import { inspectUpload } from "@/lib/uploads";
import { markDocuments, validVisitId } from "@/lib/visits";

const UPLOAD_LIMIT = 25;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  if (overLimit(`upload:${clientIp(request)}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS)) return slowDown();
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "The desk couldn't read that file." }, { status: 400 });
  }
  const given = form.get("draftId");
  const file = form.get("file");
  // The consult form has no draft until its first file, so it sends "new" and
  // keeps the id that comes back. Any other id has to be one the server minted.
  let draftId: string;
  if (given === "new") {
    try {
      draftId = mintDraftId();
    } catch {
      return Response.json({ error: "The desk isn't taking files right now." }, { status: 503 });
    }
  } else if (signedDraftId(given)) {
    draftId = given;
  } else {
    return Response.json({ error: "Start the conversation again, then attach the file." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose a file to attach." }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const inspected = inspectUpload(file.name, bytes);
  if (!inspected.ok) return Response.json({ error: inspected.error }, { status: 400 });
  try {
    const saved = await saveDraftFile({
      draftId,
      filename: inspected.filename,
      contentType: inspected.contentType,
      bytes,
    });
    const visitId = form.get("visitId");
    if (validVisitId(visitId)) {
      try {
        await markDocuments(visitId);
      } catch {
        console.error("visit update failed");
      }
    }
    return Response.json({ ...saved, draftId });
  } catch (error) {
    if (error instanceof UploadRefused) return Response.json({ error: error.message }, { status: 409 });
    console.error("file insert failed");
    return Response.json({ error: "The file didn't save. Try it again." }, { status: 500 });
  }
}
