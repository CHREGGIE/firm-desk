import { saveDraftFile } from "@/lib/leads";
import { inspectUpload } from "@/lib/uploads";
import { markDocuments, validVisitId } from "@/lib/visits";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "The desk couldn't read that file." }, { status: 400 });
  }
  const draftId = form.get("draftId");
  const file = form.get("file");
  if (typeof draftId !== "string" || !/^[a-f0-9]{24}$/.test(draftId)) {
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
    return Response.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("file insert failed");
    return Response.json(
      { error: message.includes("limit") ? message : "The file didn't save. Try it again." },
      { status: 500 },
    );
  }
}
