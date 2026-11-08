import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getMatter } from "@/lib/firm";
import { listLeads } from "@/lib/leads";
import { papersAttached, percent, summarize, type MetricsReport, type Visit } from "@/lib/metrics";
import { localReviewHint, isReviewCookie } from "@/lib/review-auth";
import { listTrackedVisits } from "@/lib/visits";
import { ReviewLogin, ReviewLogout } from "@/components/review-login";

export const metadata: Metadata = {
  title: "Desk admin",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminPage() {
  const jar = await cookies();
  if (!isReviewCookie(jar.get("ag_review")?.value)) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
        <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">Admin</p>
        <h1 className="mt-3 font-heading text-4xl tracking-tight">How the desk is doing</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
          Opens, drop-off, and how many conversations became a file. Same password as the lawyer queue.
        </p>
        <div className="mt-8">
          <ReviewLogin hint={localReviewHint()} label="Admin password" button="Open the admin" />
        </div>
      </main>
    );
  }

  let report: MetricsReport | null = null;
  try {
    const [visits, leads] = await Promise.all([listTrackedVisits(), listLeads()]);
    report = summarize(
      visits,
      leads.map((lead) => ({
        id: lead.id,
        reference: lead.reference,
        status: lead.status,
        matter: lead.matter,
        company: lead.company,
        place: lead.place,
        source: lead.source,
        createdAt: lead.createdAt,
        documents: papersAttached(lead.docNote, lead.files.length),
      })),
    );
  } catch {
    report = null;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">Admin</p>
          <h1 className="mt-3 font-heading text-4xl tracking-tight">How the desk is doing</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link className="text-sm underline underline-offset-4" href="/review">
            Lawyer queue
          </Link>
          <ReviewLogout label="Lock" />
        </div>
      </div>
      {report ? <Report report={report} /> : <p className="mt-8 text-sm text-destructive">The counts did not load. Refresh the page.</p>}
    </main>
  );
}

function Report({ report }: { report: MetricsReport }) {
  const { desk } = report;
  const maxDay = Math.max(1, ...report.days.flatMap((day) => [day.opened, day.filed]));

  return (
    <>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
        {conversionSentence(desk.messaged, desk.filed, desk.conversion)} {qualitySentence(desk.filed, desk.ready, desk.urgent, desk.thin)}{" "}
        {paperSentence(desk.filed, desk.withPapers)} Files already in the queue before this page started counting opens are listed, and they are not part of the rate.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Opened the desk" value={String(desk.opened)} detail={`${desk.site} on the site, ${desk.embed} in the embed`} />
        <Stat label="Sent a message" value={String(desk.messaged)} detail={desk.opened === 0 ? "No opens yet" : `${percent(desk.opened === 0 ? null : desk.messaged / desk.opened)} of opens`} />
        <Stat label="Filed" value={String(desk.filed)} detail={percent(desk.conversion) + " of messages"} />
        <Stat label="Ready or deadline" value={String(desk.ready + desk.urgent)} detail={`${desk.thin} thin · ${report.formFiled} from the form`} />
      </dl>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">From open to file</h2>
        <ol className="mt-4 space-y-3">
          {report.funnel.map((step) => (
            <li key={step.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>{step.label}</span>
                <span className="text-muted-foreground">
                  {step.count}
                  {desk.opened > 0 ? ` · ${percent(step.share)}` : ""}
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-muted">
                <div className="h-1.5 bg-primary" style={{ width: `${Math.round(step.share * 100)}%` }} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">Last 7 days</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This week: {report.week.opened} opens, {report.week.messaged} messages, {report.week.filed} files from those conversations
          {report.week.conversion === null ? "." : `, ${percent(report.week.conversion)} conversion.`} Pale bars are opens. Dark bars are files, including the consult form and older files.
        </p>
        <div className="mt-4 flex h-36 items-end gap-1 sm:gap-2">
          {report.days.map((day) => (
            <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end justify-center gap-0.5">
                <div className="w-2 bg-foreground/20 sm:w-3" style={{ height: `${(day.opened / maxDay) * 100}%` }} title={`${day.opened} opens`} />
                <div className="w-2 bg-primary sm:w-3" style={{ height: `${(day.filed / maxDay) * 100}%` }} title={`${day.filed} files`} />
              </div>
              <span className="text-[0.62rem] text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <CountList title="What they came about" rows={report.matters.map((row) => ({ label: matterTitle(row.slug), count: row.count }))} empty="No matter named yet." />
        <CountList title="Where a conversation stopped" rows={report.stops.map((row) => ({ label: row.slug, count: row.count }))} empty="Nobody has left in the middle yet." />
        <CountList title="Turned away" rows={report.declines.map((row) => ({ label: row.slug, count: row.count }))} empty="No out-of-scope matter yet." />
        <CountList title="Where the business is" rows={report.places.map((row) => ({ label: row.slug, count: row.count }))} empty="Nobody has said a place yet." />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">What people did</h2>
        <p className="mt-2 text-sm text-muted-foreground">Times are Eastern. The queue has the full packet. This list does not repeat the story.</p>
        {report.recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing yet. The first open of the desk shows up here.</p>
        ) : (
          <ol className="mt-4 divide-y divide-border border-y border-border">
            {report.recent.map((visit) => (
              <li key={visit.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <p className="text-sm leading-6">{lineFor(visit)}</p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {when(visit.updatedAt)} ET · {sourceLabel(visit.source)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
      <p className="mt-8 text-sm text-muted-foreground">
        {report.queue} {report.queue === 1 ? "file is" : "files are"} in the{" "}
        <Link className="underline underline-offset-4" href="/review">
          lawyer queue
        </Link>
        . {report.formFiled} came from the consult form.
      </p>
    </>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border border-border bg-card px-4 py-4">
      <dt className="text-[0.68rem] tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-2 font-heading text-4xl tracking-tight">{value}</dd>
      <dd className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</dd>
    </div>
  );
}

function CountList({ title, rows, empty }: { title: string; rows: { label: string; count: number }[]; empty: string }) {
  return (
    <section>
      <h2 className="font-heading text-2xl">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-baseline justify-between gap-3 border-b border-border pb-2 text-sm">
              <span>{row.label}</span>
              <span className="text-muted-foreground">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function conversionSentence(messaged: number, filed: number, conversion: number | null): string {
  if (messaged === 0) return "Nobody has sent a message since counting started.";
  const people = messaged === 1 ? "person" : "people";
  const files = filed === 1 ? "file" : "files";
  return `${filed} ${files} from ${messaged} ${people} who sent a message. ${percent(conversion)} became a packet a lawyer can read.`;
}

function qualitySentence(filed: number, ready: number, urgent: number, thin: number): string {
  if (filed === 0) return "No tracked packet is ready for a lawyer yet.";
  const usable = ready + urgent;
  return `${usable} of ${filed} tracked ${filed === 1 ? "packet is" : "packets are"} ready or on a deadline. ${thin} ${thin === 1 ? "is" : "are"} thin.`;
}

function paperSentence(filed: number, withPapers: number): string {
  if (filed === 0) return "";
  return `${withPapers} of ${filed} include a paper.`;
}

function matterTitle(slug: string): string {
  return getMatter(slug)?.title ?? slug;
}

function sourceLabel(source: Visit["source"]): string {
  if (source === "embed") return "Embed";
  if (source === "form") return "Consult form";
  return "Site";
}

function lineFor(visit: Visit): string {
  const matter = visit.matter ? matterTitle(visit.matter) : "";
  if (visit.kind === "filed") {
    const mark = visit.status === "urgent" ? "Deadline" : visit.status === "ready" ? "Ready" : visit.status === "thin" ? "Thin" : "Filed";
    const company = visit.company ? ` ${visit.company}.` : "";
    return `${visit.reference || "Filed"}. ${mark}${matter ? `. ${matter}` : ""}.${company} ${visit.tracked ? "" : "Counted from the queue, not from an open."}`.replace(/\s+/g, " ").trim();
  }
  if (visit.company && visit.kind === "qualifying") return `${visit.note}. ${visit.company}.`;
  return visit.note || "Opened the desk";
}

function when(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
