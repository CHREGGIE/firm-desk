import {
  attorneys,
  attorneysFor,
  firm,
  getAttorney,
  getPractice,
  lawyerNames,
  offices,
  practices,
  type Attorney,
  type Practice,
} from "./firm";

export type ChatRole = "visitor" | "desk";

export type ChatTurn = {
  role: ChatRole;
  text: string;
};

export type IntakePhase =
  | "idle"
  | "matter"
  | "name"
  | "email"
  | "phone"
  | "summary"
  | "timing"
  | "contact"
  | "confirm"
  | "saved";

export type IntakeContact = "" | "phone" | "email" | "either";

export type IntakeDraft = {
  name: string;
  email: string;
  phone: string;
  practice: string;
  summary: string;
  timing: string;
  contact: IntakeContact;
  phase: IntakePhase;
};

export type ChatCard =
  | {
      kind: "practice";
      slug: string;
      title: string;
      blurb: string;
      href: string;
    }
  | {
      kind: "attorney";
      slug: string;
      name: string;
      role: string;
      focus: string;
      href: string;
    }
  | { kind: "office"; title: string; lines: string[] }
  | { kind: "confirmation"; reference: string; title: string };

export type ChatResult = {
  text: string;
  cards: ChatCard[];
  suggestions: string[];
  intake: IntakeDraft;
  readyToSave: boolean;
};

export const openingText =
  "I'm Wren, at the desk of Calder & Wren. Ask what the firm handles, who the lawyers are, or how a first conversation works. I can take a message for the lawyers. I don't give legal advice, and a message here is not confidential yet.";

export const openingSuggestions = [
  "I need a lawyer",
  "What does a consult cost?",
  "Who are the lawyers?",
  "Where is the office?",
];

const PHASES = new Set<IntakePhase>([
  "idle",
  "matter",
  "name",
  "email",
  "phone",
  "summary",
  "timing",
  "contact",
  "confirm",
  "saved",
]);

export function emptyIntake(): IntakeDraft {
  return {
    name: "",
    email: "",
    phone: "",
    practice: "",
    summary: "",
    timing: "",
    contact: "",
    phase: "idle",
  };
}

export function savedMessage(reference: string): string {
  return `The desk has it as ${reference}. ${firm.consult.replyLine} If you don't hear back, call ${firm.phone}.`;
}

export function respond(history: ChatTurn[], intake: IntakeDraft): ChatResult {
  const safeIntake = sanitizeIntake(intake);
  const last = [...history].reverse().find((turn) => turn.role === "visitor");
  if (!last) {
    return result(openingText, openingSuggestions, safeIntake);
  }

  const raw = last.text.trim();
  const norm = normalize(raw);

  if (isStartOver(norm)) {
    return result(
      "Started over. What do you need?",
      openingSuggestions,
      emptyIntake(),
    );
  }

  if (isCrisis(norm)) {
    return result(
      "If you're thinking about hurting yourself, call or text 988. That's the Suicide and Crisis Lifeline, and it's free. The firm can't help with that by chat.",
      ["What the firm handles"],
      safeIntake.phase === "saved" ? safeIntake : { ...safeIntake, phase: "idle" },
    );
  }

  if (isDanger(norm)) {
    return result(
      "If you are in danger now, call 911. The National Domestic Violence Hotline is 1-800-799-7233. We don't handle restraining orders or criminal cases. When you are safe, the desk can take a message about a workplace or probate issue.",
      ["What the firm handles"],
      { ...safeIntake, phase: safeIntake.phase === "saved" ? "saved" : "idle" },
    );
  }

  if (containsSensitive(raw)) {
    return result(
      "Don't send Social Security numbers, account numbers, or medical details here. A sentence about the situation is enough. Send it again without those numbers.",
      [],
      safeIntake,
    );
  }

  if (isDeception(norm)) {
    return result(
      "I can't help with hiding money, backdating papers, or threatening anyone. If you have a workplace dispute, a business contract, an estate, or a home closing, tell me what happened — without a plan to deceive someone.",
      openingSuggestions,
      safeIntake.phase === "confirm" ? safeIntake : { ...safeIntake, phase: "idle" },
    );
  }

  if (safeIntake.phase === "saved") {
    return answerFree(norm, raw, history, safeIntake);
  }

  if (isCollecting(safeIntake.phase)) {
    if (isSideQuestion(norm, raw, safeIntake.phase)) {
      const described = describe(norm, raw, history);
      const note = reminder(safeIntake);
      return {
        text: note ? `${described.text}\n\n${note}` : described.text,
        cards: described.cards,
        suggestions: described.suggestions,
        intake: safeIntake,
        readyToSave: false,
      };
    }
    return collect(norm, raw, history, safeIntake);
  }

  return answerFree(norm, raw, history, safeIntake);
}

function answerFree(
  norm: string,
  raw: string,
  history: ChatTurn[],
  intake: IntakeDraft,
): ChatResult {
  if (isGreeting(norm)) {
    return result(openingText, openingSuggestions, intake);
  }
  if (isThanks(norm)) {
    return result(
      "You're welcome. I can still take a message if you want a person to call.",
      ["Take a message", "What are your hours?"],
      intake,
    );
  }
  if (
    intake.phase === "saved" &&
    /\b(who will|when will|how soon|did you (get|send|file)|hear back|reference|my message)\b/.test(
      norm,
    )
  ) {
    return result(
      `${firm.consult.replyLine} A person at the desk reads it, then the lawyer for that kind of work calls or writes. You won't get a legal opinion by chat.`,
      ["Where is the office?", "Start over"],
      intake,
    );
  }
  if (shouldStartIntake(norm, raw)) {
    return startIntake(history, raw, intake, true);
  }
  const described = describe(norm, raw, history);
  return {
    ...described,
    intake,
    readyToSave: false,
  };
}

function startIntake(
  history: ChatTurn[],
  raw: string,
  intake: IntakeDraft,
  withPitch: boolean,
): ChatResult {
  const norm = normalize(raw);
  const fromMessage = bestPractice(norm);
  const fromHistory = bestPractice(visitorText(history));
  const practice =
    fromMessage?.id || intake.practice || fromHistory?.id || "";
  const summary = pickSummary(history, raw) || intake.summary;
  if (!practice || practice === "unsure") {
    if (/\b(not sure|unsure|don'?t know|no idea)\b/.test(norm)) {
      return askName({ ...intake, practice: "unsure", summary }, false);
    }
    return {
      text: "I can set up a 30-minute conversation at no charge. What's it about: employment, a business dispute, an estate, or a home closing?",
      cards: practices.map(practiceCard),
      suggestions: [
        "Employment",
        "A business dispute",
        "An estate",
        "A home closing",
      ],
      intake: { ...intake, practice: "", summary, phase: "matter" },
      readyToSave: false,
    };
  }
  return askName({ ...intake, practice, summary, phase: "name" }, withPitch);
}

function collect(
  norm: string,
  raw: string,
  history: ChatTurn[],
  intake: IntakeDraft,
): ChatResult {
  switch (intake.phase) {
    case "matter":
      return collectMatter(norm, raw, history, intake);
    case "name":
      return collectName(raw, intake);
    case "email":
      return collectEmail(raw, intake);
    case "phone":
      return collectPhone(raw, intake);
    case "summary":
      return collectSummary(norm, raw, intake);
    case "timing":
      return collectTiming(norm, raw, intake);
    case "contact":
      return collectContact(norm, intake);
    case "confirm":
      return collectConfirm(norm, intake);
    default:
      return answerFree(norm, raw, history, intake);
  }
}

function collectMatter(
  norm: string,
  raw: string,
  history: ChatTurn[],
  intake: IntakeDraft,
): ChatResult {
  const out = winningOut(norm);
  const practice = bestPractice(norm);
  if (out && (!practice || out.score >= practice.score)) {
    return {
      text: outReply(out.id, norm),
      cards: [],
      suggestions: ["What do you handle?", "Where is the office?"],
      intake: { ...emptyIntake(), phase: "idle" },
      readyToSave: false,
    };
  }
  if (practice) {
    const summary = pickSummary(history, raw);
    return askName(
      { ...intake, practice: practice.id, summary, phase: "name" },
      true,
    );
  }
  if (/\b(not sure|unsure|don'?t know|no idea|several)\b/.test(norm)) {
    return askName(
      { ...intake, practice: "unsure", summary: pickSummary(history, raw), phase: "name" },
      false,
    );
  }
  return {
    text: "I can send a message about employment, a business dispute, an estate, or a home closing. Which of those is closest? If you don't know, say you're not sure.",
    cards: practices.map(practiceCard),
    suggestions: [
      "Employment",
      "A business dispute",
      "An estate",
      "A home closing",
    ],
    intake,
    readyToSave: false,
  };
}

function collectName(raw: string, intake: IntakeDraft): ChatResult {
  const name = parseName(raw);
  if (!name) {
    return result(
      "I need a first and last name so the lawyer knows who to ask for.",
      [],
      intake,
    );
  }
  return askEmail({ ...intake, name });
}

function collectEmail(raw: string, intake: IntakeDraft): ChatResult {
  const email = parseEmail(raw);
  if (!email) {
    return result(
      "That doesn't look like an email address. What email should we use?",
      [],
      intake,
    );
  }
  return askPhone({ ...intake, email });
}

function collectPhone(raw: string, intake: IntakeDraft): ChatResult {
  const phone = parsePhone(raw);
  if (phone === null) {
    return result(
      "I need a 10-digit phone number, or say skip and we'll use email only.",
      ["Skip"],
      intake,
    );
  }
  return afterPhone({ ...intake, phone: phone === "skip" ? "" : phone });
}

function collectSummary(
  norm: string,
  raw: string,
  intake: IntakeDraft,
): ChatResult {
  if (isAdvice(norm) && raw.trim().length < 90) {
    return result(
      "I can't tell you whether you have a case, or what to sign. Describe what happened in a sentence or two. Dates are enough. A lawyer takes it from there.",
      [],
      intake,
    );
  }
  if (raw.trim().length < 15) {
    return result(
      "A little more detail helps the lawyer prepare. One or two sentences is enough.",
      [],
      intake,
    );
  }
  return askTiming({ ...intake, summary: raw.trim().slice(0, 1000) });
}

function collectTiming(
  norm: string,
  raw: string,
  intake: IntakeDraft,
): ChatResult {
  const timing = parseTiming(norm, raw);
  if (!timing) {
    return result(
      "When should we reach you: today, this week, next week, or whenever it's convenient?",
      ["Today", "This week", "Next week", "No rush"],
      intake,
    );
  }
  return afterTiming({ ...intake, timing });
}

function collectContact(norm: string, intake: IntakeDraft): ChatResult {
  if (/\b(either|both|doesn'?t matter|don't care|dont care|whichever)\b/.test(norm)) {
    return askConfirm({ ...intake, contact: "either" });
  }
  if (/\b(email|e-mail|write)\b/.test(norm)) {
    return askConfirm({ ...intake, contact: "email" });
  }
  if (/\b(phone|call|text)\b/.test(norm)) {
    if (!intake.phone) {
      return result(
        "I don't have a phone number yet. What number should we call? Or say email instead.",
        ["Email me"],
        { ...intake, phase: "phone" },
      );
    }
    return askConfirm({ ...intake, contact: "phone" });
  }
  return result("Should we call or email?", ["Call me", "Email me"], intake);
}

function collectConfirm(norm: string, intake: IntakeDraft): ChatResult {
  if (isYes(norm)) {
    if (!canSave(intake)) {
      return result(
        "A few details are still missing, so I haven't sent it. Let's fill the gap.",
        [],
        nextMissing(intake),
      );
    }
    return {
      text: "Sending that to the desk.",
      cards: [],
      suggestions: [],
      intake,
      readyToSave: true,
    };
  }
  if (
    isNegation(norm) ||
    /\b(change|wrong|fix|edit|update|actually)\b/.test(norm)
  ) {
    return changeField(norm, intake);
  }
  return {
    text: `${readback(intake)}\n\nSend it? Say yes, or tell me what to change.`,
    cards: cardsForPractice(intake.practice),
    suggestions: ["Yes, send it", "Change the email", "Change the summary"],
    intake,
    readyToSave: false,
  };
}

function changeField(norm: string, intake: IntakeDraft): ChatResult {
  if (/\bemail\b/.test(norm)) {
    return result("What's the right email?", [], { ...intake, phase: "email" });
  }
  if (/\bphone\b/.test(norm)) {
    return result("What's the best phone number? Say skip to leave it off.", ["Skip"], {
      ...intake,
      phase: "phone",
    });
  }
  if (/\bname\b/.test(norm)) {
    return result("What name should we use?", [], { ...intake, phase: "name" });
  }
  if (/\b(summary|happened|story|detail)\b/.test(norm)) {
    return result("Tell me again, in a sentence or two, what happened.", [], {
      ...intake,
      summary: "",
      phase: "summary",
    });
  }
  if (/\b(timing|when|week|schedule)\b/.test(norm)) {
    return askTiming({ ...intake, timing: "" });
  }
  if (/\b(call|contact|email)\b/.test(norm) && intake.phone) {
    return askContact(intake);
  }
  return result(
    "I can change the name, email, phone, summary, or timing. Which one?",
    ["Change the name", "Change the email", "Change the summary"],
    intake,
  );
}

function askName(intake: IntakeDraft, withPitch: boolean): ChatResult {
  const practice = getPractice(intake.practice);
  let lead = "";
  if (practice && withPitch) {
    lead = `${practice.chatLead} ${lawyerNames(practice.lawyerSlugs)} handle it. I can't say how it would come out. `;
  } else if (practice) {
    lead = `${practice.title} is work we take. `;
  } else if (intake.practice === "unsure") {
    lead = "You're not sure which area fits, and that's fine. The lawyer can sort it on the call. ";
  }
  const urgent = isUrgent(normalize(intake.summary))
    ? `If a hearing or deadline is already on the calendar, call ${firm.phone} during office hours too. `
    : "";
  return {
    text: `${urgent}${lead}The first conversation is 30 minutes and there's no charge. What name should the desk use?`,
    cards: cardsForPractice(intake.practice),
    suggestions: ["What does it cost?", "Who would I meet?"],
    intake: { ...intake, phase: "name" },
    readyToSave: false,
  };
}

function askEmail(intake: IntakeDraft): ChatResult {
  return result(`Thanks, ${intake.name}. What email should we use?`, [], {
    ...intake,
    phase: "email",
  });
}

function askPhone(intake: IntakeDraft): ChatResult {
  return result(
    "What's the best phone number? Say skip if you'd rather we email only.",
    ["Skip"],
    { ...intake, phase: "phone" },
  );
}

function afterPhone(intake: IntakeDraft): ChatResult {
  if (!intake.summary) return askSummary(intake);
  return askTiming(intake);
}

function askSummary(intake: IntakeDraft): ChatResult {
  return result(
    "In a sentence or two, what happened? Leave out account numbers and medical details.",
    [],
    { ...intake, phase: "summary" },
  );
}

function askTiming(intake: IntakeDraft): ChatResult {
  return result(
    "When should we reach you: today, this week, next week, or whenever it's convenient?",
    ["Today", "This week", "Next week", "No rush"],
    { ...intake, phase: "timing" },
  );
}

function afterTiming(intake: IntakeDraft): ChatResult {
  if (!intake.phone) {
    return askConfirm(
      { ...intake, contact: "email" },
      "There's no phone number on this, so we'll reply by email.",
    );
  }
  return askContact(intake);
}

function askContact(intake: IntakeDraft): ChatResult {
  return result("Should we call or email?", ["Call me", "Email me"], {
    ...intake,
    phase: "contact",
  });
}

function askConfirm(intake: IntakeDraft, preface = ""): ChatResult {
  return {
    text: readback({ ...intake, phase: "confirm" }, preface),
    cards: [],
    suggestions: ["Yes, send it", "Change the email", "Change the summary"],
    intake: { ...intake, phase: "confirm" },
    readyToSave: false,
  };
}

type Described = {
  text: string;
  cards: ChatCard[];
  suggestions: string[];
};

function describe(norm: string, raw: string, history: ChatTurn[]): Described {
  const out = winningOut(norm);
  const practice = bestPractice(norm);
  const context =
    practice ?? bestPractice(visitorText(history)) ?? null;

  if (out && (!practice || out.score >= practice.score)) {
    return {
      text: outReply(out.id, norm),
      cards: [],
      suggestions: ["What do you handle?", "Where is the office?"],
    };
  }

  if (isSpanish(norm) && !practice) {
    return {
      text: "The desk writes in English. Amira Solano can hold the consultation in Spanish. Say so in your message and we'll mark it.",
      cards: attorneyCardList(["amira-solano"]),
      suggestions: ["Take a message", "Who is Amira Solano?"],
    };
  }

  if (isPrivilege(norm)) {
    return {
      text: firm.consult.privilegeLine,
      cards: [],
      suggestions: ["Take a message", "What does a consult cost?"],
    };
  }

  const info = detectInfo(norm);
  const shaped = isInfoShaped(norm);

  if (shaped && info === "fees") {
    return {
      text: joinParts([
        context ? practiceSentence(context.id) : "",
        firm.consult.feeLine,
        firm.consult.billingLine,
        firm.consult.engagementLine,
      ]),
      cards: [],
      suggestions: ["Take a message", "What are your hours?"],
    };
  }

  if (shaped && info === "hours") {
    const lines = firm.hours.map((row) => `${row.days}: ${row.hours}`).join("\n");
    return {
      text: `Benefit Street hours:\n${lines}\n\nIf something is due before we open, call ${firm.phone} and leave a message. We read urgent notes first on the next weekday morning.`,
      cards: [officeCard()],
      suggestions: ["Take a message", "Where is the office?"],
    };
  }

  if (shaped && info === "location") {
    const blocks = offices
      .map((office) => `${office.name}\n${office.lines.join("\n")}\n${office.note}`)
      .join("\n\n");
    return {
      text: `${blocks}\n\nPhone ${firm.phone}. Email ${firm.email}.`,
      cards: [officeCard()],
      suggestions: ["What are your hours?", "Take a message"],
    };
  }

  if (isAdvice(norm) && !practice) {
    const scoped = context
      ? `${practiceSentence(context.id)} I still can't say how it would come out, or what you should sign.`
      : "I can't say whether you have a case, what you should sign, or how a filing would come out. Tell me the situation in plain words — a firing, a contract, a will, a house — and I'll point you to the right person.";
    return {
      text: scoped,
      cards: context ? cardsForPractice(context.id) : practices.map(practiceCard),
      suggestions: context ? ["Take a message", "Who would I meet?"] : ["Employment", "A business dispute", "An estate"],
    };
  }

  const attorney = bestAttorney(norm);
  if (attorney && (!practice || attorney.score >= practice.score || /^who is\b/.test(norm))) {
    return attorneyBlurb(attorney.id);
  }

  if ((shaped && info === "people") || /^who\b/.test(norm)) {
    if (context) {
      const people = attorneysFor(context.id);
      return {
        text: `${practiceTitle(context.id)}: ${lawyerNames(people.map((person) => person.slug))}. ${people[0] ? people[0].focus : ""}`,
        cards: people.map(attorneyCard),
        suggestions: ["Take a message", "What does it cost?"],
      };
    }
    return {
      text: attorneys
        .map((person) => `${person.name}, ${person.role.toLowerCase()} — ${person.focus}.`)
        .join("\n"),
      cards: attorneys.map(attorneyCard),
      suggestions: ["Take a message", "What do you handle?"],
    };
  }

  if (shaped && (info === "practices" || /^what do you (handle|do)\b/.test(norm))) {
    return {
      text: `We take four kinds of work.\n\n${practices
        .map((item) => `${item.title}. ${item.blurb}`)
        .join(
          "\n",
        )}\n\nWe don't take criminal defense, divorce or custody, immigration, personal injury, bankruptcy, or evictions. ${firm.referralLine}`,
      cards: practices.map(practiceCard),
      suggestions: ["I need a lawyer", "What does a consult cost?"],
    };
  }

  if (practice) {
    return {
      text: `${practicePitch(practice.id)} ${firm.consult.feeLine}`,
      cards: cardsForPractice(practice.id),
      suggestions: ["Take a message", "Who would I meet?", "What does it cost?"],
    };
  }

  if (isUrgent(norm)) {
    return {
      text: `If a hearing, a response deadline, or a closing is already set, call ${firm.phone} during office hours instead of waiting on the chat. ${firm.hours[0].days} we're here ${firm.hours[0].hours}. Friday we close at 3.`,
      cards: [officeCard()],
      suggestions: ["Take a message", "What are your hours?"],
    };
  }

  return {
    text: "I can help with the work the firm takes, the lawyers, the cost of a first conversation, and getting a message to the desk. Tell me what happened, or ask one of those.",
    cards: [],
    suggestions: openingSuggestions,
  };
}

function attorneyBlurb(slug: string): Described {
  const attorney = getAttorney(slug);
  if (!attorney) {
    return {
      text: "I don't have that lawyer on the roster.",
      cards: attorneys.map(attorneyCard),
      suggestions: ["Who are the lawyers?"],
    };
  }
  const language =
    attorney.languages.length > 1
      ? ` Consultations in ${attorney.languages.join(" and ")}.`
      : "";
  return {
    text: `${attorney.name} is ${article(attorney.role)} ${attorney.role.toLowerCase()}. ${attorney.paragraphs[0]}${language} Admitted in ${attorney.admissions}.`,
    cards: [attorneyCard(attorney)],
    suggestions: ["Take a message", `What does ${attorney.name.split(" ")[0]} handle?`],
  };
}

function outReply(id: string, norm: string): string {
  const urgent = isUrgent(norm)
    ? "If a date is already on the calendar, don't wait on this chat. "
    : "";
  const bodies: Record<string, string> = {
    family: `We don't handle divorce, custody, support, or restraining orders. If you are in danger, call 911. ${firm.referralLine}`,
    criminal: `We don't practice criminal defense. If you were arrested or have a criminal court date, ask the court about a public defender if you can't afford a lawyer. ${firm.referralLine}`,
    injury: `We don't take injury or accident cases. ${firm.referralLine}`,
    immigration: `We don't handle immigration. ${firm.referralLine}`,
    bankruptcy: `We don't file bankruptcies. ${firm.referralLine}`,
    eviction: `We don't take evictions or landlord-tenant court. Read the hearing date on the notice and call the clerk's number printed there. ${firm.referralLine}`,
    ip: `We don't handle patents, trademarks, or copyright filings. ${firm.referralLine}`,
    tax: `We don't handle tax controversy. ${firm.referralLine}`,
  };
  return `${urgent}${bodies[id] ?? firm.referralLine}`;
}

function practiceSentence(slug: string): string {
  const practice = getPractice(slug);
  if (!practice) return "";
  return `${practice.chatLead} ${lawyerNames(practice.lawyerSlugs)} handle it.`;
}

function practicePitch(slug: string): string {
  return `${practiceSentence(slug)} I can't say how a particular situation would come out.`;
}

function practiceTitle(slug: string): string {
  if (slug === "unsure") return "Not sure yet";
  return getPractice(slug)?.title ?? "General inquiry";
}

function readback(intake: IntakeDraft, preface = ""): string {
  const contact =
    intake.contact === "phone"
      ? "Phone"
      : intake.contact === "either"
        ? "Either phone or email"
        : "Email";
  const body = [
    "Here's what I'll send:",
    "",
    `Name: ${intake.name}`,
    `Email: ${intake.email}`,
    `Phone: ${intake.phone || "None"}`,
    `Matter: ${practiceTitle(intake.practice)}`,
    `What happened: ${intake.summary}`,
    `When: ${intake.timing}`,
    `Reach you by: ${contact}`,
    "",
    "Send it?",
  ].join("\n");
  return preface ? `${preface}\n\n${body}` : body;
}

function canSave(intake: IntakeDraft): boolean {
  return Boolean(
    intake.name &&
      parseEmail(intake.email) &&
      intake.summary.trim().length >= 15 &&
      intake.timing &&
      intake.contact,
  );
}

function nextMissing(intake: IntakeDraft): IntakeDraft {
  if (!intake.name) return { ...intake, phase: "name" };
  if (!parseEmail(intake.email)) return { ...intake, phase: "email" };
  if (!intake.summary) return { ...intake, phase: "summary" };
  if (!intake.timing) return { ...intake, phase: "timing" };
  return { ...intake, phase: "contact" };
}

function reminder(intake: IntakeDraft): string {
  switch (intake.phase) {
    case "matter":
      return "When you're ready: is this employment, a business dispute, an estate, or a home closing?";
    case "name":
      return "When you're ready, what name should the desk use?";
    case "email":
      return "What email should we use?";
    case "phone":
      return "What's the best phone number, or say skip.";
    case "summary":
      return "In a sentence or two, what happened?";
    case "timing":
      return "When should we reach you?";
    case "contact":
      return "Should we call or email?";
    case "confirm":
      return "Should I send the message as it stands?";
    default:
      return "";
  }
}

function shouldStartIntake(norm: string, raw: string): boolean {
  const out = winningOut(norm);
  const practice = bestPractice(norm);
  if (out && (!practice || out.score >= practice.score)) return false;
  if (isInfoShaped(norm) && detectInfo(norm)) return false;
  if (isAdvice(norm) && !practice) return false;
  if (isBook(norm)) return true;
  if (practice && practice.score >= 3 && !isInfoShaped(norm)) return true;
  if (practice && practice.score >= 3 && raw.length > 140) return true;
  return false;
}

function isSideQuestion(norm: string, raw: string, phase: IntakePhase): boolean {
  if (phase === "summary" && raw.trim().length >= 40 && !isInfoShaped(norm)) {
    return false;
  }
  if (phase === "confirm" && (isYes(norm) || isNegation(norm))) return false;
  if (phase === "timing" && parseTiming(norm, raw)) return false;
  if (phase === "phone" && parsePhone(raw) !== null) return false;
  if (phase === "email" && parseEmail(raw)) return false;
  if (phase === "name" && parseName(raw)) return false;
  if (phase === "matter" && (bestPractice(norm) || winningOut(norm))) return false;
  if (phase === "contact" && /\b(call|email|phone|either|skip)\b/.test(norm)) {
    return false;
  }
  const info = detectInfo(norm);
  const practice = bestPractice(norm);
  const asks =
    isInfoShaped(norm) ||
    raw.trim().endsWith("?") ||
    Boolean(info) ||
    Boolean(bestAttorney(norm));
  if (!asks) return false;
  if (phase === "summary" && practice && raw.length >= 40) return false;
  return true;
}

function isCollecting(phase: IntakePhase): boolean {
  return (
    phase === "matter" ||
    phase === "name" ||
    phase === "email" ||
    phase === "phone" ||
    phase === "summary" ||
    phase === "timing" ||
    phase === "contact" ||
    phase === "confirm"
  );
}

type Scored = { id: string; score: number };

const PRACTICE_RULES: { slug: string; terms: [string, number][] }[] = [
  {
    slug: "employment",
    terms: [
      ["let go", 4],
      ["fired", 4],
      ["firing", 4],
      ["terminated", 4],
      ["termination", 4],
      ["laid off", 4],
      ["layoff", 4],
      ["harassment", 4],
      ["discriminat*", 4],
      ["severance", 4],
      ["noncompete", 5],
      ["non compete", 5],
      ["wage", 3],
      ["overtime", 4],
      ["paycheck", 4],
      ["pregnant", 4],
      ["pregnancy", 4],
      ["whistle", 4],
      ["workplace", 3],
      ["hostile work", 5],
      ["wrongful", 3],
      ["human resources", 3],
      ["employment", 3],
      ["my boss", 3],
      ["employee", 3],
      ["employer", 3],
    ],
  },
  {
    slug: "business",
    terms: [
      ["invoice", 4],
      ["unpaid invoice", 5],
      ["partnership", 4],
      ["business partner", 5],
      ["shareholder", 4],
      ["operating agreement", 5],
      ["llc", 3],
      ["breach", 3],
      ["vendor", 3],
      ["contract", 3],
      ["buyout", 4],
      ["business dispute", 5],
      ["dissolve", 3],
    ],
  },
  {
    slug: "estates",
    terms: [
      ["probate", 5],
      ["a will", 4],
      ["my will", 4],
      ["the will", 4],
      ["her will", 4],
      ["his will", 4],
      ["their will", 4],
      ["wills", 4],
      ["revocable", 4],
      ["living trust", 5],
      ["the trust", 4],
      ["inheritance", 4],
      ["executor", 5],
      ["estate", 3],
      ["passed away", 4],
      ["passed on", 3],
      ["beneficiary", 3],
      ["will contest", 5],
    ],
  },
  {
    slug: "closings",
    terms: [
      ["real estate", 5],
      ["home closing", 5],
      ["house closing", 5],
      ["the closing", 4],
      ["my closing", 4],
      ["closing is", 4],
      ["closing on", 4],
      ["home purchase", 5],
      ["buying a house", 5],
      ["selling a house", 5],
      ["selling my house", 5],
      ["title company", 4],
      ["mortgage", 3],
      ["purchase and sale", 5],
      ["condo", 3],
    ],
  },
];

const OUT_RULES: { id: string; terms: [string, number][] }[] = [
  {
    id: "family",
    terms: [
      ["divorce", 6],
      ["custody", 6],
      ["child support", 5],
      ["visitation", 5],
      ["restraining order", 5],
      ["alimony", 5],
      ["family court", 5],
    ],
  },
  {
    id: "criminal",
    terms: [
      ["arrested", 6],
      ["dui", 6],
      ["dwi", 6],
      ["criminal", 5],
      ["felony", 5],
      ["misdemeanor", 5],
      ["probation", 4],
      ["charged with", 5],
    ],
  },
  {
    id: "injury",
    terms: [
      ["car accident", 6],
      ["personal injury", 6],
      ["slip and fall", 6],
      ["malpractice", 5],
      ["rear ended", 5],
      ["whiplash", 5],
    ],
  },
  {
    id: "immigration",
    terms: [
      ["immigration", 6],
      ["green card", 6],
      ["deportation", 6],
      ["asylum", 5],
      ["work visa", 5],
    ],
  },
  {
    id: "bankruptcy",
    terms: [
      ["bankruptcy", 6],
      ["chapter 7", 6],
      ["chapter 13", 6],
    ],
  },
  {
    id: "eviction",
    terms: [
      ["eviction", 6],
      ["evicted", 6],
      ["notice to quit", 6],
      ["landlord", 5],
      ["my tenant", 5],
      ["security deposit", 5],
    ],
  },
  {
    id: "ip",
    terms: [
      ["patent", 5],
      ["trademark", 5],
      ["copyright", 4],
    ],
  },
  {
    id: "tax",
    terms: [
      ["tax audit", 5],
      ["the irs", 5],
      ["back taxes", 4],
    ],
  },
];

const ATTORNEY_RULES: [string, string[], number][] = [
  ["helen-calder", ["helen", "calder"], 5],
  ["owen-wren", ["owen", "wren"], 5],
  ["amira-solano", ["amira", "solano"], 5],
  ["theo-park", ["theo", "theo park"], 5],
];

function bestPractice(text: string): Scored | null {
  const source = text.replace(/real estate/g, " ");
  let best: Scored | null = null;
  for (const rule of PRACTICE_RULES) {
    const haystack = rule.slug === "estates" ? source : text;
    const score = scoreTerms(haystack, rule.terms);
    if (score >= 3 && (!best || score > best.score)) {
      best = { id: rule.slug, score };
    }
  }
  return best ? { id: best.id, score: best.score } : null;
}

function winningOut(text: string): Scored | null {
  let best: Scored | null = null;
  for (const rule of OUT_RULES) {
    const score = scoreTerms(text, rule.terms);
    if (score >= 4 && (!best || score > best.score)) best = { id: rule.id, score };
  }
  return best;
}

function bestAttorney(text: string): Scored | null {
  let best: Scored | null = null;
  for (const [slug, terms, weight] of ATTORNEY_RULES) {
    const score = terms.reduce(
      (total, term) => total + (hasTerm(text, term) ? weight : 0),
      0,
    );
    if (score >= 5 && (!best || score > best.score)) best = { id: slug, score };
  }
  return best;
}

function scoreTerms(text: string, terms: [string, number][]): number {
  return terms.reduce(
    (total, [term, weight]) => total + (hasTerm(text, term) ? weight : 0),
    0,
  );
}

function hasTerm(text: string, term: string): boolean {
  const needle = term.toLowerCase();
  if (needle.endsWith("*")) {
    const stem = needle.slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^a-z])${stem}`, "i").test(text);
  }
  if (needle.includes(" ")) return text.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z])${escaped}(?:$|[^a-z])`, "i").test(text);
}

type InfoTopic = "fees" | "hours" | "location" | "people" | "practices";

function detectInfo(norm: string): InfoTopic | null {
  if (/\b(cost|fee|fees|charge|hourly|rate|expensive|price|how much|free consult)\b/.test(norm)) {
    return "fees";
  }
  if (
    /\b(hours|are you open|when are you open|what time)\b/.test(norm) ||
    (/\b(saturday|sunday|weekend)\b/.test(norm) && !bestPractice(norm))
  ) {
    return "hours";
  }
  if (
    /\b(address|parking|directions|located|benefit street|where (is|are) (the |your )?office)\b/.test(
      norm,
    ) ||
    /^where\b/.test(norm)
  ) {
    return "location";
  }
  if (/\b(who are the lawyers|your lawyers|the attorneys|your team|who works)\b/.test(norm)) {
    return "people";
  }
  if (/\b(practice areas|what do you handle|what kind of law|kinds of work|what work)\b/.test(norm)) {
    return "practices";
  }
  return null;
}

function isInfoShaped(norm: string): boolean {
  return /^(what|when|where|who|how|why|can you|do you|are you|is there|tell me)\b/.test(norm);
}

function isBook(norm: string): boolean {
  return /\b(book|appointment|consult|consultation|schedule|call me|take a message|need a lawyer|need an attorney|speak with a lawyer|talk to a lawyer|talk to someone|hire|retain)\b/.test(
    norm,
  );
}

function isAdvice(norm: string): boolean {
  return /\b(do i have a case|should i (sign|sue|settle|quit|ignore)|what are my chances|will i win|is this illegal|is this legal|can they do that|what should i do|how do i sue|give me advice)\b/.test(
    norm,
  );
}

function isPrivilege(norm: string): boolean {
  return /\b(confidential|privilege|attorney client|attorney-client|is this private|is this confidential)\b/.test(
    norm,
  );
}

function isSpanish(norm: string): boolean {
  return /\b(espanol|spanish|habla|hablan)\b/.test(norm);
}

function isUrgent(norm: string): boolean {
  if (/\b(hearing|deadline|served|court date|asap|right away|emergency)\b/.test(norm)) {
    return true;
  }
  return (
    /\b(tomorrow|this afternoon)\b/.test(norm) &&
    /\b(court|hearing|deadline|closing|response|filed)\b/.test(norm)
  );
}

function isCrisis(norm: string): boolean {
  return /\b(suicid|kill myself|end my life|want to die|self harm|hurt myself)\b/.test(norm);
}

function isDanger(norm: string): boolean {
  return /\b(hit me|beats me|abusing me|domestic violence|afraid to go home|afraid of my|strangl|stalking me|going to kill me)\b/.test(
    norm,
  );
}

function isDeception(norm: string): boolean {
  return /\b(hide (the )?(money|assets|income)|off the books|backdate|forge a|fake document|evade service)\b/.test(
    norm,
  );
}

function containsSensitive(raw: string): boolean {
  return (
    /\b\d{3}-\d{2}-\d{4}\b/.test(raw) ||
    /\b(?:\d[ -]?){13,19}\b/.test(raw) ||
    /\b(social security|ssn|bank account|routing number)\b/i.test(raw)
  );
}

function isGreeting(norm: string): boolean {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|howdy)( there)?$/.test(
    norm,
  );
}

function isThanks(norm: string): boolean {
  return /^(thanks|thank you|thank you so much|thx|appreciate it|appreciated)$/.test(
    norm,
  );
}

function isStartOver(norm: string): boolean {
  return /^(start over|start again|reset|new matter)\b/.test(norm);
}

function isYes(norm: string): boolean {
  return /^(yes|yeah|yep|yup|sure|ok|okay|please|do that|that works|sounds good|correct|right|confirm|send it|go ahead|book it|please do|that'?s right|looks good|all correct|all good)\b/.test(
    norm,
  );
}

function isNegation(norm: string): boolean {
  return /^(no|nope|nah|not now|don'?t|do not|stop|cancel|never mind|nevermind)\b/.test(
    norm,
  );
}

function parseName(raw: string): string | null {
  let text = raw.trim().replace(/\s+/g, " ");
  text = text.replace(/^(my name is|i'm|i am|it's|it is|this is|name:?)\s+/i, "");
  if (text.length < 3 || text.length > 80) return null;
  if (/[0-9@]/.test(text)) return null;
  if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]+$/.test(text)) return null;
  const parts = text
    .split(" ")
    .filter((part) => part.length > 1 && !/^(mr|mrs|ms|dr|prof)\.?$/i.test(part));
  if (parts.length < 2) return null;
  return text;
}

function parseEmail(raw: string): string | null {
  const match = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (!match) return null;
  const email = match[0].toLowerCase();
  if (email.length > 120) return null;
  return email;
}

function parsePhone(raw: string): string | "skip" | null {
  const norm = normalize(raw);
  if (
    /^(skip|no|nope|none|nah|email only|email me|just email|rather not|prefer not|don'?t have|do not have|no phone|no number)\b/.test(
      norm,
    )
  ) {
    return "skip";
  }
  const digits = raw.replace(/\D/g, "");
  const local =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return null;
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

function parseTiming(norm: string, raw: string): string | null {
  if (/\b(today|asap|right away|urgent|immediately|tomorrow|this morning|as soon)\b/.test(norm)) {
    return "As soon as you can";
  }
  if (/\bthis week\b/.test(norm)) return "This week";
  if (/\bnext week\b/.test(norm)) return "Next week";
  if (/\b(no rush|whenever|no hurry|flexible|any time|anytime)\b/.test(norm)) {
    return "No rush";
  }
  const trimmed = raw.trim();
  if (
    trimmed.length >= 3 &&
    trimmed.length <= 80 &&
    !trimmed.includes("@") &&
    !isAdvice(norm) &&
    !isInfoShaped(norm)
  ) {
    return trimmed;
  }
  return null;
}

function pickSummary(history: ChatTurn[], current: string): string {
  if (worthySummary(current)) return current.trim().slice(0, 1000);
  const earlier = history
    .filter((turn) => turn.role === "visitor" && turn.text.trim() !== current.trim())
    .map((turn) => turn.text.trim())
    .filter(worthySummary)
    .sort((a, b) => b.length - a.length);
  return earlier[0]?.slice(0, 1000) ?? "";
}

function worthySummary(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 40) return false;
  if (trimmed.endsWith("?")) return false;
  if (isInfoShaped(normalize(trimmed))) return false;
  if (containsSensitive(trimmed)) return false;
  return true;
}

function visitorText(history: ChatTurn[]): string {
  return normalize(
    history
      .filter((turn) => turn.role === "visitor")
      .map((turn) => turn.text)
      .join(" "),
  );
}

function practiceCard(practice: Practice): ChatCard {
  return {
    kind: "practice",
    slug: practice.slug,
    title: practice.title,
    blurb: practice.blurb,
    href: `/practices/${practice.slug}`,
  };
}

function attorneyCard(attorney: Attorney): ChatCard {
  return {
    kind: "attorney",
    slug: attorney.slug,
    name: attorney.name,
    role: attorney.role,
    focus: attorney.focus,
    href: `/attorneys/${attorney.slug}`,
  };
}

function attorneyCardList(slugs: string[]): ChatCard[] {
  return slugs
    .map((slug) => getAttorney(slug))
    .filter((attorney): attorney is Attorney => Boolean(attorney))
    .map(attorneyCard);
}

function cardsForPractice(slug: string): ChatCard[] {
  const practice = getPractice(slug);
  if (!practice) return [];
  return [
    practiceCard(practice),
    ...attorneysFor(practice.slug).slice(0, 2).map(attorneyCard),
  ];
}

function officeCard(): ChatCard {
  const main = offices[0];
  return {
    kind: "office",
    title: main.name,
    lines: [...main.lines, firm.phone],
  };
}

function result(
  text: string,
  suggestions: string[],
  intake: IntakeDraft,
  cards: ChatCard[] = [],
): ChatResult {
  return {
    text,
    cards,
    suggestions: suggestions.slice(0, 4),
    intake,
    readyToSave: false,
  };
}

function joinParts(parts: string[]): string {
  return parts.filter(Boolean).join(" ");
}

function article(role: string): string {
  return /^[aeiou]/i.test(role) ? "an" : "a";
}

function sanitizeIntake(intake: IntakeDraft): IntakeDraft {
  const phase = PHASES.has(intake.phase) ? intake.phase : "idle";
  const practice =
    intake.practice === "unsure" || getPractice(intake.practice)
      ? intake.practice
      : "";
  const contact: IntakeContact =
    intake.contact === "phone" ||
    intake.contact === "email" ||
    intake.contact === "either"
      ? intake.contact
      : "";
  return {
    name: clip(intake.name, 80),
    email: clip(intake.email, 120),
    phone: clip(intake.phone, 30),
    practice,
    summary: clip(intake.summary, 1000),
    timing: clip(intake.timing, 80),
    contact,
    phase,
  };
}

function clip(value: string, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/['’]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9'+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
