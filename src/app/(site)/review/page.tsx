import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getMatter } from "@/lib/firm";
import { listLeads } from "@/lib/leads";
import { isReviewCookie, localReviewHint } from "@/lib/review-auth";
import { ReviewLogin, ReviewLogout } from "@/components/review-login";

export const metadata: Metadata = {
  title: "Lawyer review",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function ReviewPage() {
  const jar = await cookies();
  if (!isReviewCookie(jar.get("ag_review")?.value)) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
        <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">Review</p>
        <h1 className="mt-3 font-heading text-4xl tracking-tight">The lead queue</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
          Files the desk qualifies, with the papers attached. This page is not on the public site.
        </p>
        <div className="mt-8">
          <ReviewLogin hint={localReviewHint()} />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          The same password opens the{" "}
          <Link className="underline underline-offset-4" href="/admin">
            desk admin
          </Link>
          .
        </p>
      </main>
    );
  }

  const leads = await listLeads();
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">Review</p>
          <h1 className="mt-3 font-heading text-4xl tracking-tight">Leads ready to read</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link className="text-sm underline underline-offset-4" href="/admin">
            Desk admin
          </Link>
          <ReviewLogout />
        </div>
      </div>
      {leads.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No files yet. A qualified chat will show up here.</p>
      ) : (
        <ol className="mt-8 space-y-6">
          {leads.map((lead) => {
            const matter = getMatter(lead.matter);
            return (
              <li key={lead.id} className="border border-border bg-card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-heading text-3xl tracking-tight">{lead.reference}</p>
                  <p className="text-[0.68rem] tracking-[0.16em] text-primary uppercase">{labelFor(lead.status)}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {matter?.title ?? "Unnamed matter"} · {lead.company || "No company"} · {lead.place || "Place not said"}
                </p>
                <dl className="mt-4 space-y-2 text-sm leading-6">
                  <div>
                    <dt className="text-muted-foreground">Who</dt>
                    <dd>
                      {lead.name}
                      {lead.role ? `, ${lead.role}` : ""} · {lead.email}
                      {lead.phone ? ` · ${lead.phone}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Other side</dt>
                    <dd>{lead.opponent || "Not said"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Deadline</dt>
                    <dd>{lead.deadline || "Not said"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">At stake</dt>
                    <dd>{lead.stake || "Not said"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">What happened</dt>
                    <dd className="whitespace-pre-wrap">{lead.summary}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Papers</dt>
                    <dd>{lead.docNote || "Nothing noted."}</dd>
                  </div>
                </dl>
                {lead.files.length > 0 && (
                  <ul className="mt-4 space-y-1 text-sm">
                    {lead.files.map((file) => (
                      <li key={file.id}>
                        <a className="underline underline-offset-4" href={`/api/review/files/${file.id}`}>
                          {file.filename}
                        </a>
                        <span className="text-muted-foreground"> · {Math.max(1, Math.round(file.size / 1024))} KB</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}

function labelFor(status: string): string {
  if (status === "urgent") return "Deadline";
  if (status === "ready") return "Ready";
  return "Thin";
}
