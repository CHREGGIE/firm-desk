import { cookies } from "next/headers";
import { readLeadFile } from "@/lib/leads";
import { isReviewCookie } from "@/lib/review-auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!isReviewCookie(jar.get("ag_review")?.value)) {
    return new Response("Sign in to the review queue.", { status: 401 });
  }
  const { id } = await context.params;
  if (!/^[a-f0-9]{32}$/.test(id)) return new Response("Not found.", { status: 404 });
  const file = await readLeadFile(id);
  if (!file) return new Response("Not found.", { status: 404 });
  const filename = file.filename.replace(/["\r\n]/g, "");
  return new Response(Buffer.from(file.bytes), {
    headers: {
      "content-type": file.contentType,
      "content-disposition": `attachment; filename="${filename}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
