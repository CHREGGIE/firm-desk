import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyIntake,
  respond,
  type ChatTurn,
  type IntakeDraft,
} from "./chat";

function say(history: ChatTurn[], intake: IntakeDraft, text: string) {
  const next = [...history, { role: "visitor" as const, text }];
  const result = respond(next, intake);
  return {
    result,
    history: [...next, { role: "desk" as const, text: result.text }],
    intake: result.intake,
  };
}

describe("desk answers", () => {
  it("greets without offering legal advice", () => {
    const { result } = say([], emptyIntake(), "Hello");
    assert.match(result.text, /Wren/);
    assert.equal(result.intake.phase, "idle");
    assert.equal(result.readyToSave, false);
  });

  it("states hours and the Benefit Street office", () => {
    const hours = say([], emptyIntake(), "What are your hours?").result;
    assert.match(hours.text, /Monday/);
    assert.match(hours.text, /5:30/);
    const where = say([], emptyIntake(), "Where is the office?").result;
    assert.match(where.text, /Benefit Street/);
    assert.match(where.text, /02903/);
  });

  it("explains the consult fee", () => {
    const { result } = say([], emptyIntake(), "What does a consult cost?");
    assert.match(result.text, /no charge/);
    assert.match(result.text, /425/);
    assert.equal(result.readyToSave, false);
  });

  it("routes a firing to employment and refuses a prediction", () => {
    const { result } = say(
      [],
      emptyIntake(),
      "I was fired last week after I reported harassment to HR",
    );
    assert.equal(result.intake.practice, "employment");
    assert.equal(result.intake.phase, "name");
    assert.match(result.text, /Helen Calder/);
    assert.match(result.text, /Theo Park/);
    assert.match(result.text, /can'?t/i);
    assert.doesNotMatch(result.text, /you have a case/i);
    assert.doesNotMatch(result.text, /illegal/);
  });

  it("treats a home closing as real estate, not an estate", () => {
    const { result } = say(
      [],
      emptyIntake(),
      "We have a real estate closing on a house in Providence",
    );
    assert.equal(result.intake.practice, "closings");
    assert.match(result.text, /closing/i);
    assert.doesNotMatch(result.text, /probate/i);
  });

  it("declines divorce and points to the bar referral", () => {
    const { result } = say([], emptyIntake(), "I need a divorce lawyer");
    assert.equal(result.intake.phase, "idle");
    assert.match(result.text, /don't handle divorce/i);
    assert.match(result.text, /421-7799/);
    assert.doesNotMatch(result.text, /Helen/);
  });

  it("refuses outcome advice", () => {
    const { result } = say([], emptyIntake(), "Do I have a case?");
    assert.match(result.text, /can'?t/i);
    assert.equal(result.readyToSave, false);
  });

  it("answers a crisis with 988 and stops the intake", () => {
    const { result } = say([], emptyIntake(), "I want to die");
    assert.match(result.text, /988/);
    assert.doesNotMatch(result.text, /what happened/i);
    assert.equal(result.intake.phase, "idle");
  });

  it("answers danger with 911 and the hotline", () => {
    const { result } = say([], emptyIntake(), "He hit me and I'm afraid to go home");
    assert.match(result.text, /911/);
    assert.match(result.text, /1-800-799-7233/);
  });

  it("rejects a social security number", () => {
    const { result } = say([], emptyIntake(), "My SSN is 123-45-6789");
    assert.match(result.text, /Social Security/);
    assert.equal(result.intake.phase, "idle");
    assert.equal(result.intake.summary, "");
  });

  it("refuses help hiding assets", () => {
    const { result } = say([], emptyIntake(), "How do I hide the money offshore");
    assert.match(result.text, /can'?t help/i);
    assert.equal(result.readyToSave, false);
  });

  it("mentions Amira for Spanish", () => {
    const { result } = say([], emptyIntake(), "Do you speak Spanish?");
    assert.match(result.text, /Amira Solano/);
  });

  it("declines an eviction", () => {
    const { result } = say([], emptyIntake(), "My landlord filed an eviction");
    assert.match(result.text, /eviction/i);
    assert.equal(result.intake.phase, "idle");
  });

  it("keeps the name question when asked a side question", () => {
    const started = say(
      [],
      emptyIntake(),
      "I was fired last week after I reported harassment to HR",
    );
    const side = say(started.history, started.intake, "What are your hours?");
    assert.equal(side.intake.phase, "name");
    assert.match(side.result.text, /Monday/);
    assert.match(side.result.text, /name/i);
  });

  it("walks a consult through to send", () => {
    let history: ChatTurn[] = [];
    let intake = emptyIntake();
    const steps = [
      "I need a lawyer",
      "Employment",
      "Priya Shah",
      "priya@example.com",
      "skip",
      "I was fired after I reported harassment to my manager.",
      "this week",
      "Yes, send it",
    ];
    const phases = [
      "matter",
      "name",
      "email",
      "phone",
      "summary",
      "timing",
      "confirm",
      "confirm",
    ];
    let lastReady = false;
    for (const [index, text] of steps.entries()) {
      const next = say(history, intake, text);
      history = next.history;
      intake = next.intake;
      assert.equal(intake.phase, phases[index], text);
      lastReady = next.result.readyToSave;
    }
    assert.equal(lastReady, true);
    assert.equal(intake.name, "Priya Shah");
    assert.equal(intake.email, "priya@example.com");
    assert.equal(intake.phone, "");
    assert.equal(intake.practice, "employment");
    assert.equal(intake.timing, "This week");
    assert.equal(intake.contact, "email");
    assert.match(intake.summary, /harassment/);
  });

  it("does not send when the visitor says no at the end", () => {
    let history: ChatTurn[] = [];
    let intake = emptyIntake();
    for (const text of [
      "I need a lawyer",
      "An estate",
      "Owen Guest",
      "owen@example.com",
      "4015550199",
      "My sister and I are fighting over our mother's estate and the will.",
      "next week",
      "Call me",
      "No, change the email",
    ]) {
      const next = say(history, intake, text);
      history = next.history;
      intake = next.intake;
      assert.equal(next.result.readyToSave, false);
    }
    assert.equal(intake.phase, "email");
  });

  it("starts over", () => {
    const started = say([], emptyIntake(), "I need a lawyer");
    const reset = say(started.history, started.intake, "Start over");
    assert.equal(reset.intake.phase, "idle");
    assert.equal(reset.intake.practice, "");
  });
});
