import type { EngagementKind } from "./chat";

export type VisitSource = "site" | "embed" | "form";

export type Visit = {
  id: string;
  source: VisitSource;
  openedAt: string;
  updatedAt: string;
  messages: number;
  phase: string;
  matter: string;
  kind: EngagementKind;
  note: string;
  company: string;
  place: string;
  reference: string;
  status: "" | "urgent" | "ready" | "thin";
  hasEmail: boolean;
  reachedPapers: boolean;
  documents: boolean;
  tracked: boolean;
};

export type MetricLead = {
  id: string;
  reference: string;
  status: "urgent" | "ready" | "thin";
  matter: string;
  company: string;
  place: string;
  source: "chat" | "form";
  createdAt: string;
  documents: boolean;
};

export type DayCount = { key: string; label: string; opened: number; filed: number };

export type DeskMetrics = {
  opened: number;
  messaged: number;
  started: number;
  contact: number;
  papers: number;
  filed: number;
  ready: number;
  urgent: number;
  thin: number;
  withPapers: number;
  site: number;
  embed: number;
  conversion: number | null;
  quality: number | null;
};

export type MetricsReport = {
  desk: DeskMetrics;
  formFiled: number;
  queue: number;
  funnel: { label: string; count: number; share: number }[];
  matters: { slug: string; count: number }[];
  stops: { slug: string; count: number }[];
  declines: { slug: string; count: number }[];
  places: { slug: string; count: number }[];
  days: DayCount[];
  week: { opened: number; messaged: number; filed: number; conversion: number | null };
  recent: Visit[];
};

const KIND_RANK: Record<EngagementKind, number> = {
  opened: 0,
  asked: 1,
  qualifying: 2,
  declined: 2,
  refused: 2,
  filed: 3,
};

const PAPERS = new Set(["documents", "confirm", "saved"]);

export function papersAttached(note: string, fileCount = 0): boolean {
  if (fileCount > 0) return true;
  return /papers are attached|^attached:/i.test(note);
}

export function mergeVisit(existing: Visit | null, incoming: Visit): Visit {
  if (!existing) return incoming;
  const keep = KIND_RANK[incoming.kind] >= KIND_RANK[existing.kind] ? incoming : existing;
  const other = keep === incoming ? existing : incoming;
  return {
    ...keep,
    openedAt: existing.openedAt < incoming.openedAt ? existing.openedAt : incoming.openedAt,
    updatedAt: existing.updatedAt > incoming.updatedAt ? existing.updatedAt : incoming.updatedAt,
    messages: Math.max(existing.messages, incoming.messages),
    matter: keep.matter || other.matter,
    company: keep.company || other.company,
    place: keep.place || other.place,
    reference: keep.reference || other.reference,
    status: keep.status || other.status,
    note: keep.note || other.note,
    hasEmail: existing.hasEmail || incoming.hasEmail,
    reachedPapers: existing.reachedPapers || incoming.reachedPapers,
    documents: existing.documents || incoming.documents,
    source: existing.source,
    tracked: true,
  };
}

export function visitFromLead(lead: MetricLead): Visit {
  return {
    id: `lead-${lead.id}`,
    source: lead.source === "form" ? "form" : "site",
    openedAt: lead.createdAt,
    updatedAt: lead.createdAt,
    messages: 1,
    phase: "saved",
    matter: lead.matter,
    kind: "filed",
    note: "Filed before opens were counted",
    company: lead.company,
    place: lead.place,
    reference: lead.reference,
    status: lead.status,
    hasEmail: true,
    reachedPapers: true,
    documents: lead.documents,
    tracked: false,
  };
}

export function summarize(visits: Visit[], leads: MetricLead[], now = new Date()): MetricsReport {
  const seen = new Set(visits.map((visit) => visit.reference).filter(Boolean));
  const combined = [
    ...visits,
    ...leads.filter((lead) => !seen.has(lead.reference)).map(visitFromLead),
  ];
  const desk = combined.filter((visit) => visit.source !== "form" && visit.tracked);
  const deskAll = countDesk(desk);
  const days = lastDays(now, 7);
  const dayKeys = new Set(days.map((day) => day.key));
  for (const visit of combined) {
    if (visit.source !== "form" && visit.tracked && dayKeys.has(dayKey(visit.openedAt))) {
      const day = days.find((item) => item.key === dayKey(visit.openedAt));
      if (day) day.opened += 1;
    }
    if (visit.kind === "filed" && dayKeys.has(dayKey(visit.updatedAt))) {
      const day = days.find((item) => item.key === dayKey(visit.updatedAt));
      if (day) day.filed += 1;
    }
  }
  const weekVisits = desk.filter((visit) => dayKeys.has(dayKey(visit.openedAt)));
  const week = countDesk(weekVisits);
  return {
    desk: deskAll,
    formFiled: combined.filter((visit) => visit.source === "form" && visit.kind === "filed").length,
    queue: combined.filter((visit) => visit.kind === "filed").length,
    funnel: funnelFor(deskAll),
    matters: tally(desk.filter((visit) => visit.matter).map((visit) => visit.matter)),
    stops: tally(
      desk
        .filter((visit) => visit.kind !== "filed")
        .map((visit) => visit.note || "Left"),
    ),
    declines: tally(
      desk.filter((visit) => visit.kind === "declined").map((visit) => visit.note),
    ),
    places: tally(desk.map((visit) => placeBucket(visit.place)).filter(Boolean)),
    days,
    week: {
      opened: week.opened,
      messaged: week.messaged,
      filed: week.filed,
      conversion: week.conversion,
    },
    recent: [...combined].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 20),
  };
}

export function countDesk(visits: Visit[]): DeskMetrics {
  const opened = visits.length;
  const messaged = visits.filter((visit) => visit.messages > 0).length;
  const started = visits.filter((visit) => visit.kind === "qualifying" || visit.kind === "filed" || Boolean(visit.matter)).length;
  const contact = visits.filter((visit) => visit.hasEmail).length;
  const papers = visits.filter((visit) => visit.reachedPapers).length;
  const filedVisits = visits.filter((visit) => visit.kind === "filed");
  const filed = filedVisits.length;
  const ready = filedVisits.filter((visit) => visit.status === "ready").length;
  const urgent = filedVisits.filter((visit) => visit.status === "urgent").length;
  const thin = filedVisits.filter((visit) => visit.status === "thin").length;
  const withPapers = filedVisits.filter((visit) => visit.documents).length;
  return {
    opened,
    messaged,
    started,
    contact,
    papers,
    filed,
    ready,
    urgent,
    thin,
    withPapers,
    site: visits.filter((visit) => visit.source === "site").length,
    embed: visits.filter((visit) => visit.source === "embed").length,
    conversion: messaged === 0 ? null : filed / messaged,
    quality: filed === 0 ? null : (ready + urgent) / filed,
  };
}

export function reachedPapers(phase: string): boolean {
  return PAPERS.has(phase);
}

function funnelFor(desk: DeskMetrics): { label: string; count: number; share: number }[] {
  const steps = [
    ["Opened the desk", desk.opened],
    ["Sent a message", desk.messaged],
    ["Started a matter", desk.started],
    ["Left an email", desk.contact],
    ["Reached the papers", desk.papers],
    ["Filed for a lawyer", desk.filed],
  ] as const;
  return steps.map(([label, count]) => ({
    label,
    count,
    share: desk.opened === 0 ? 0 : count / desk.opened,
  }));
}

function tally(values: string[]): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

function placeBucket(place: string): string {
  if (!place) return "";
  if (place === "New York") return "New York";
  if (place === "New Jersey") return "New Jersey";
  return "Somewhere else";
}

function lastDays(now: Date, count: number): DayCount[] {
  const today = dayKey(now.toISOString());
  const days: DayCount[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const key = shiftDay(today, -offset);
    days.push({
      key,
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
        new Date(`${key}T12:00:00Z`),
      ),
      opened: 0,
      filed: 0,
    });
  }
  return days;
}

export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function shiftDay(key: string, delta: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  return date.toISOString().slice(0, 10);
}

export function percent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}
