import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyIntake,
  respond,
  type ChatTurn,
  type IntakeDraft,
} from "./chat";
import { leadStatus } from "./leads";
import { inspectUpload } from "./uploads";

function say(history: ChatTurn[], intake: IntakeDraft, text: string) {
  const next = [...history, { role: "visitor" as const, text }];
  const result = respond(next, intake);
  return {
    result,
    history: [...next, { role: "desk" as const, text: result.text }],
    intake: result.intake,
  };
}

const story =
  "A customer took the deposit in March and stopped answering. The contract is signed and about $80,000 is unpaid.";

describe("Ainsworth Gorkin desk", () => {
  it("greets without legal advice", () => {
    const { result } = say([], emptyIntake(), "Hello");
    assert.match(result.text, /Ainsworth Gorkin/);
    assert.match(result.text, /not confidential/i);
    assert.equal(result.intake.phase, "idle");
    assert.equal(result.readyToSave, false);
    assert.doesNotMatch(result.text, /you have a case/i);
  });

  it("gives the President Street office and does not invent hours", () => {
    const where = say([], emptyIntake(), "Where is the office?").result;
    assert.match(where.text, /1188 President Street/);
    assert.match(where.text, /11225/);
    assert.match(where.text, /212/);
    const hours = say([], emptyIntake(), "What are your hours?").result;
    assert.match(hours.text, /doesn't publish/i);
    assert.doesNotMatch(hours.text, /5:30/);
  });

  it("describes a free evaluation and does not invent a rate", () => {
    const { result } = say([], emptyIntake(), "What does a consult cost?");
    assert.match(result.text, /free evaluation/i);
    assert.match(result.text, /will not invent|No rate is published/i);
    assert.doesNotMatch(result.text, /\$\d/);
    assert.equal(result.readyToSave, false);
  });

  it("routes an unpaid customer to contract and Shaya", () => {
    const { result } = say([], emptyIntake(), story);
    assert.equal(result.intake.matter, "contract");
    assert.equal(result.intake.phase, "company");
    assert.match(result.text, /Shaya Gorkin/);
    assert.match(result.text, /can'?t say how it comes out/i);
    assert.equal(result.intake.summary, story);
  });

  it("routes a partner fight to partnership, not a contract", () => {
    const { result } = say(
      [],
      emptyIntake(),
      "My business partner is cutting me out of the books and I want to know what my share is worth.",
    );
    assert.equal(result.intake.matter, "partnership");
  });

  it("routes a foreclosure notice to foreclosure", () => {
    const { result } = say([], emptyIntake(), "I got a foreclosure notice on a building I own in Brooklyn.");
    assert.equal(result.intake.matter, "foreclosure");
  });

  it("keeps a former employee who took clients, and declines a person who was fired", () => {
    const business = say(
      [],
      emptyIntake(),
      "A former employee left last month and our clients went with them.",
    ).result;
    assert.equal(business.intake.matter, "commercial");
    assert.equal(business.intake.phase, "company");
    const employee = say([], emptyIntake(), "I was fired after I reported harassment to HR").result;
    assert.equal(employee.intake.phase, "idle");
    assert.match(employee.text, /626-7373/);
    assert.doesNotMatch(employee.text, /Shaya/);
  });

  it("declines divorce", () => {
    const { result } = say([], emptyIntake(), "I need a divorce lawyer");
    assert.equal(result.intake.phase, "idle");
    assert.match(result.text, /626-7373/);
  });

  it("refuses outcome advice, a social security number, and hiding money", () => {
    assert.match(say([], emptyIntake(), "Do I have a case?").result.text, /can'?t/i);
    assert.match(say([], emptyIntake(), "My SSN is 123-45-6789").result.text, /Social Security/i);
    assert.match(say([], emptyIntake(), "Can you help me hide the money?").result.text, /can't help hide/i);
  });

  it("answers a side question without losing the company step", () => {
    const started = say([], emptyIntake(), story);
    const side = say(started.history, started.intake, "What does a consult cost?");
    assert.equal(side.intake.phase, "company");
    assert.equal(side.intake.matter, "contract");
    assert.match(side.result.text, /free evaluation/i);
    assert.match(side.result.text, /company name/i);
  });

  it("walks a file to send, and keeps a deadline urgent", () => {
    let step = say([], emptyIntake(), story);
    step = say(step.history, step.intake, "Northwind Supply LLC");
    assert.equal(step.intake.phase, "role");
    step = say(step.history, step.intake, "Owner");
    step = say(step.history, step.intake, "Leah Rosen");
    step = say(step.history, step.intake, "leah@northwind.example");
    step = say(step.history, step.intake, "skip");
    step = say(step.history, step.intake, "Harbor Goods Inc");
    step = say(step.history, step.intake, "Brooklyn");
    assert.equal(step.intake.place, "New York");
    step = say(step.history, step.intake, "The answer is due this week");
    step = say(step.history, step.intake, "About $80,000");
    assert.equal(step.intake.phase, "documents");
    assert.match(step.result.text, /contract/i);
    step = say(step.history, step.intake, "I don't have them");
    assert.equal(step.intake.phase, "confirm");
    assert.match(step.result.text, /Northwind Supply/);
    assert.match(step.result.text, /Harbor Goods/);
    assert.match(step.result.text, /Send it\?/);
    const held = say(step.history, step.intake, "No, change the email");
    assert.equal(held.intake.phase, "email");
    assert.equal(held.result.readyToSave, false);
    const back = say(held.history, held.intake, "leah@northwind.example");
    let rest = back;
    const order = ["skip", "Harbor Goods Inc", "Brooklyn", "The answer is due this week", "About $80,000", "I don't have them"];
    for (const line of order) rest = say(rest.history, rest.intake, line);
    const sent = say(rest.history, rest.intake, "Yes, send it");
    assert.equal(sent.result.readyToSave, true);
    assert.equal(leadStatus(sent.intake), "urgent");
  });

  it("marks a complete file with no deadline ready, and an unknown opponent thin", () => {
    assert.equal(
      leadStatus({
        company: "Northwind",
        opponent: "Harbor Goods",
        summary: story,
        deadline: "None",
      }),
      "ready",
    );
    assert.equal(
      leadStatus({
        company: "Northwind",
        opponent: "Unknown",
        summary: story,
        deadline: "None",
      }),
      "thin",
    );
  });

  it("rejects a file that is not really a pdf", () => {
    const bad = inspectUpload("contract.pdf", Buffer.from("hello"));
    assert.equal(bad.ok, false);
    const good = inspectUpload("note.txt", Buffer.from("The contract is attached in spirit."));
    assert.equal(good.ok, true);
  });
});
