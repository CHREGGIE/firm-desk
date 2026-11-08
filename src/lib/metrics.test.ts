import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyIntake, engagementOf } from "./chat";
import { mergeVisit, summarize, type MetricLead, type Visit } from "./metrics";

function visit(patch: Partial<Visit> & Pick<Visit, "id" | "kind">): Visit {
  return {
    source: "site",
    openedAt: "2026-11-07T15:00:00.000Z",
    updatedAt: "2026-11-07T15:10:00.000Z",
    messages: 0,
    phase: "idle",
    matter: "",
    note: "",
    company: "",
    place: "",
    reference: "",
    status: "",
    hasEmail: false,
    reachedPapers: false,
    documents: false,
    tracked: true,
    ...patch,
  };
}

describe("desk metrics", () => {
  it("names a decline and a question without storing the message", () => {
    assert.equal(
      engagementOf({
        visitorText: "I need a divorce lawyer",
        intake: emptyIntake(),
        visitorMessages: 1,
        filed: false,
      }).note,
      "Divorce or custody",
    );
    const asking = engagementOf({
      visitorText: "What does a consult cost?",
      intake: emptyIntake(),
      visitorMessages: 1,
      filed: false,
    });
    assert.equal(asking.kind, "asked");
    const mid = engagementOf({
      visitorText: "Northwind",
      intake: { ...emptyIntake(), phase: "role", matter: "contract", company: "Northwind" },
      visitorMessages: 2,
      filed: false,
    });
    assert.equal(mid.kind, "qualifying");
    assert.equal(mid.note, "Stopped at their role");
  });

  it("keeps a filed visit when a later open arrives", () => {
    const filed = visit({
      id: "a",
      kind: "filed",
      messages: 8,
      phase: "saved",
      matter: "contract",
      reference: "AG-KGNP",
      status: "urgent",
      hasEmail: true,
      reachedPapers: true,
      openedAt: "2026-11-07T15:00:00.000Z",
      updatedAt: "2026-11-07T15:20:00.000Z",
    });
    const opened = visit({
      id: "a",
      kind: "opened",
      note: "Opened the desk",
      openedAt: "2026-11-07T14:59:00.000Z",
      updatedAt: "2026-11-07T14:59:00.000Z",
    });
    const merged = mergeVisit(filed, opened);
    assert.equal(merged.kind, "filed");
    assert.equal(merged.reference, "AG-KGNP");
    assert.equal(merged.openedAt, "2026-11-07T14:59:00.000Z");
  });

  it("counts conversion from messages, and leaves older files out of the rate", () => {
    const now = new Date("2026-11-07T22:00:00.000Z");
    const visits = [
      visit({ id: "1", kind: "opened", note: "Opened the desk" }),
      visit({ id: "2", kind: "asked", messages: 1, note: "Asked a question" }),
      visit({
        id: "3",
        kind: "declined",
        messages: 1,
        note: "Divorce or custody",
      }),
      visit({
        id: "4",
        kind: "filed",
        messages: 8,
        phase: "saved",
        matter: "contract",
        company: "Northwind",
        place: "New York",
        reference: "AG-NEW1",
        status: "ready",
        hasEmail: true,
        reachedPapers: true,
        documents: true,
      }),
    ];
    const older: MetricLead = {
      id: "old",
      reference: "AG-KGNP",
      status: "urgent",
      matter: "contract",
      company: "Northwind Supply LLC",
      place: "New York",
      source: "chat",
      createdAt: "2026-11-07T23:00:00.000Z",
      documents: false,
    };
    const report = summarize(visits, [older], now);
    assert.equal(report.desk.opened, 4);
    assert.equal(report.desk.messaged, 3);
    assert.equal(report.desk.filed, 1);
    assert.equal(report.desk.conversion, 1 / 3);
    assert.equal(report.queue, 2);
    assert.equal(report.funnel[0].count, 4);
    assert.equal(report.funnel.at(-1)?.count, 1);
    assert.equal(report.declines[0]?.slug, "Divorce or custody");
    assert.equal(report.places[0]?.slug, "New York");
    assert.equal(report.recent[0]?.reference, "AG-KGNP");
    assert.equal(report.recent[0]?.tracked, false);
    const today = report.days.at(-1);
    assert.equal(today?.opened, 4);
    assert.equal(today?.filed, 2);
  });
});
