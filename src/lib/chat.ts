import { firm, getMatter, lawyerNames, practices, unsureMatter, type Practice } from "./firm";

export type ChatTurn = {
  role: "visitor" | "desk";
  text: string;
};

export type IntakePhase =
  | "idle"
  | "company"
  | "role"
  | "name"
  | "email"
  | "phone"
  | "opponent"
  | "place"
  | "deadline"
  | "stake"
  | "summary"
  | "documents"
  | "confirm"
  | "saved";

export type IntakeDraft = {
  phase: IntakePhase;
  matter: string;
  company: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  opponent: string;
  place: string;
  deadline: string;
  stake: string;
  summary: string;
  docNote: string;
  draftId: string;
};

export type ChatCard =
  | { kind: "practice"; slug: string; title: string; blurb: string; href: string }
  | { kind: "attorney"; slug: string; name: string; role: string; focus: string; href: string }
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
  "I'm the desk at Ainsworth Gorkin. Tell me what happened at the business, in plain words. I'll ask for the names and the papers the lawyers need, and leave them a file to review. I don't give legal advice, and a message here is not confidential yet.";

export const openingSuggestions = [
  "A customer stopped paying",
  "My partner is cutting me out",
  "I got a foreclosure notice",
  "I need a contract reviewed",
];

export function emptyIntake(): IntakeDraft {
  return {
    phase: "idle",
    matter: "",
    company: "",
    role: "",
    name: "",
    email: "",
    phone: "",
    opponent: "",
    place: "",
    deadline: "",
    stake: "",
    summary: "",
    docNote: "",
    draftId: "",
  };
}

export function savedMessage(reference: string, status: "urgent" | "ready" | "thin"): string {
  const mark =
    status === "urgent"
      ? "It's marked as a deadline, so it sits at the front of the review queue."
      : status === "ready"
        ? "It's marked ready for a lawyer to review."
        : "It's filed, and marked thin, because a name or a fact the lawyers need is still missing. They can see the gap.";
  return `Filed as ${reference}. ${mark} The first look is free. This does not hire the firm, and it is not confidential yet. If a date is already on the calendar, call ${firm.phone}.`;
}

export function respond(history: ChatTurn[], intake: IntakeDraft): ChatResult {
  const current = lastVisitor(history);
  const norm = normalize(current);
  if (isStartOver(norm)) return say(openingText, openingSuggestions, emptyIntake());
  if (isCrisis(norm)) return say(crisisText(), [], intake);
  if (isDanger(norm)) return say(dangerText(), [], intake);
  if (containsSensitive(current)) return say(sensitiveText(), [], intake);
  if (isDeception(norm)) return say(deceptionText(), [], intake);

  if (intake.phase === "saved") {
    const info = answerInfo(norm);
    if (info) return { ...info, intake };
    return say(
      `That's already filed. If you need to add a date or a name, call ${firm.phone} and give them the reference. Start over if this is a different matter.`,
      ["Start over", "Where is the office?"],
      intake,
    );
  }

  if (intake.phase !== "idle") {
    if (isSideQuestion(norm, intake.phase)) {
      const info = answerInfo(norm) ?? adviceRefusal();
      return {
        ...info,
        intake,
        suggestions: [promptFor(intake.phase), ...info.suggestions].slice(0, 4),
        text: `${info.text}\n\n${promptFor(intake.phase)}`,
      };
    }
    return collect(history, intake, current, norm);
  }

  return answerFree(history, current, norm);
}

function collect(history: ChatTurn[], intake: IntakeDraft, current: string, norm: string): ChatResult {
  const next = { ...intake };
  if (next.phase === "company") {
    next.company = companyAnswer(current, norm);
    next.phase = "role";
    return ask(next, "What's your role there? Owner, partner, lender, manager, or something else.");
  }
  if (next.phase === "role") {
    next.role = clip(current, 80);
    next.phase = "name";
    return ask(next, "What's your first and last name?");
  }
  if (next.phase === "name") {
    if (current.trim().length < 3) return ask(next, "I need a first and last name.");
    next.name = clip(current, 80);
    next.phase = "email";
    return ask(next, "What's the best email for the lawyers to use?");
  }
  if (next.phase === "email") {
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(current.trim())) {
      return ask(next, "That email doesn't look right. Try it again.");
    }
    next.email = current.trim().toLowerCase();
    next.phase = "phone";
    return ask(next, "A phone number, or say skip.");
  }
  if (next.phase === "phone") {
    if (!/^skip\b|^no\b|^none\b/.test(norm)) {
      const digits = current.replace(/\D/g, "");
      if (digits.length < 10) return ask(next, "That phone number looks short. Send 10 digits, or say skip.");
      next.phone = clip(current, 30);
    }
    next.phase = "opponent";
    return ask(next, "Who is on the other side? A person or a company. The lawyers need the name before they can check conflicts.");
  }
  if (next.phase === "opponent") {
    next.opponent = /don'?t know|not sure|unknown/.test(norm) ? "Unknown" : clip(current, 120);
    next.phase = "place";
    return ask(next, "Is this in New York, New Jersey, or somewhere else?");
  }
  if (next.phase === "place") {
    next.place = placeAnswer(norm, current);
    next.phase = "deadline";
    return ask(next, "Is there a court date, a closing, or a deadline? If something is due this week, say when. If not, say none.");
  }
  if (next.phase === "deadline") {
    next.deadline = /^none\b|^no deadline|^no\b|^nothing\b/.test(norm) ? "None" : clip(current, 120);
    next.phase = "stake";
    return ask(next, "What's at stake, in one sentence? Money, a property, or the company.");
  }
  if (next.phase === "stake") {
    next.stake = clip(current, 200);
    const earlier = pickSummary(history, current);
    if (earlier) {
      next.summary = earlier;
      next.phase = "documents";
      return ask(next, documentPrompt(next.matter));
    }
    next.phase = "summary";
    return ask(next, "In a few sentences, what happened?");
  }
  if (next.phase === "summary") {
    if (current.trim().length < 15) return ask(next, "Add a little more. A few sentences is enough.");
    next.summary = clip(current, 1000);
    next.phase = "documents";
    return ask(next, documentPrompt(next.matter));
  }
  if (next.phase === "documents") {
    next.docNote = documentNote(norm, next.matter);
    next.phase = "confirm";
    return ask(next, packet(next), ["Yes, send it", "No, change the email"]);
  }
  if (next.phase === "confirm") {
    if (isYes(norm)) {
      return {
        text: packet(next),
        cards: [],
        suggestions: [],
        intake: next,
        readyToSave: true,
      };
    }
    const back = fieldToChange(norm);
    if (back) {
      next.phase = back;
      return ask(next, promptFor(back));
    }
    return ask(next, `I haven't sent it. Say yes to file it, or name what to change.\n\n${packet(next)}`, [
      "Yes, send it",
      "No, change the email",
    ]);
  }
  return answerFree(history, current, norm);
}

function answerFree(history: ChatTurn[], current: string, norm: string): ChatResult {
  if (isOut(norm)) return say(declineText(norm), ["Where is the office?"], emptyIntake());
  const info = answerInfo(norm);
  if (info && !shouldQualify(norm)) return info;
  if (isAdvice(norm) && !bestMatter(norm)) return adviceRefusal();

  const matter = bestMatter(norm) ?? (worthySummary(current) ? unsureMatter : undefined);
  if (!matter) {
    return say(
      `${openingText}\n\nThe firm represents businesses and their owners, in New York and New Jersey. Personal injury, criminal defense, divorce, and immigration are a no.`,
      openingSuggestions,
      emptyIntake(),
    );
  }

  const intake = withDraft({ ...emptyIntake(), matter: matter.slug, phase: "company" });
  const summary = worthySummary(current) ? clip(current, 1000) : "";
  if (summary) intake.summary = summary;
  const names = lawyerNames(matter.lawyerSlugs);
  return ask(
    intake,
    `${matter.chatLead} ${names} ${matter.lawyerSlugs.length > 1 ? "review" : "reviews"} this kind of file. I can't say how it comes out.\n\nWhat's the company name? If the property or the deal is in your own name, say so.`,
  );
}

function answerInfo(norm: string): ChatResult | null {
  if (/\b(cost|fee|fees|charge|hourly|rate|price|how much|free)\b/.test(norm)) {
    return say(
      `${firm.consult.feeLine}\n\n${firm.consult.billingLine}`,
      ["I need a lawyer", "Where is the office?"],
      emptyIntake(),
    );
  }
  if (/\b(hours|are you open|when are you open|what time)\b/.test(norm)) {
    return say(
      `The site doesn't publish office hours. Call ${firm.phone}. The firm says you speak with a lawyer, not a junior.`,
      ["Where is the office?"],
      emptyIntake(),
    );
  }
  if (/\b(address|where|office|located|directions|president street)\b/.test(norm)) {
    return {
      text: `The office on the site is 1188 President Street, Suite 203, Brooklyn, NY 11225. Call ${firm.phone} or write ${firm.email}. The firm is licensed in New York and New Jersey. For a matter governed by another state's law, they bring in local counsel.`,
      cards: [{ kind: "office", title: "President Street", lines: ["1188 President Street, Suite 203", "Brooklyn, NY 11225"] }],
      suggestions: ["What does the first call cost?"],
      intake: emptyIntake(),
      readyToSave: false,
    };
  }
  if (/\b(who are the lawyers|your lawyers|the attorneys|who works|your team)\b/.test(norm)) {
    return {
      text: "Levi Ainsworth, founding partner, handles the transactions: contracts, startups, acquisitions, and outside counsel. Shaya Gorkin, founding partner, handles the litigation. Yehuda C. Morgenstern is a litigation associate.",
      cards: [],
      suggestions: ["A customer stopped paying", "I need a contract reviewed"],
      intake: emptyIntake(),
      readyToSave: false,
    };
  }
  if (/\b(spanish|español|espanol|habla)\b/.test(norm)) {
    return say(
      `The site doesn't list a Spanish-speaking lawyer. This desk takes the facts in English. You can also call ${firm.phone}.`,
      openingSuggestions,
      emptyIntake(),
    );
  }
  if (isAdvice(norm)) return adviceRefusal();
  return null;
}

function adviceRefusal(): ChatResult {
  return say(
    "I can't tell you whether you have a case, what a paper means, or what to sign. Describe what happened and I'll put it in a file for the lawyers. The first look is free.",
    openingSuggestions,
    emptyIntake(),
  );
}

function packet(intake: IntakeDraft): string {
  const matter = getMatter(intake.matter);
  const title = matter?.title ?? "Not named yet";
  const lawyers = matter ? lawyerNames(matter.lawyerSlugs) : "the lawyers";
  const papers = matter?.documents.join("; ") ?? "the papers you were served";
  const docs = intake.docNote || `None yet. The lawyers will ask for: ${papers}.`;
  const other =
    intake.place && !/^New York$|^New Jersey$/.test(intake.place)
      ? `${intake.place}. The firm is licensed in New York and New Jersey, and brings in local counsel when another state's law governs.`
      : intake.place || "Not said";
  return [
    "Here's the file the lawyers will see.",
    "",
    `Matter: ${title}. ${lawyers} ${matter && matter.lawyerSlugs.length > 1 ? "are the names on this kind of work" : "is the name on this kind of work"}.`,
    `Company: ${intake.company || "Not said"}`,
    `You: ${intake.name || "Not said"}${intake.role ? `, ${intake.role}` : ""}`,
    `Reach: ${intake.email || "no email"}${intake.phone ? `, ${intake.phone}` : ""}`,
    `Other side: ${intake.opponent || "Not said"}`,
    `Where: ${other}`,
    `Deadline: ${intake.deadline || "Not said"}`,
    `At stake: ${intake.stake || "Not said"}`,
    `What happened: ${intake.summary || "Not said"}`,
    `Documents: ${docs}`,
    "",
    "The first look is free. Sending this does not hire the firm, and it is not confidential yet. Send it?",
  ].join("\n");
}

function documentPrompt(slug: string): string {
  const matter = getMatter(slug);
  const list = (matter?.documents ?? unsureMatter.documents).map((item, index) => `${index + 1}. ${item}`).join("\n");
  return `The lawyers will want:\n${list}\n\nAttach them with the button under this message, then say they're attached. Or say you don't have them. The file will show the gap either way.`;
}

function documentNote(norm: string, slug: string): string {
  const list = (getMatter(slug)?.documents ?? unsureMatter.documents).join("; ");
  if (/\b(don'?t have|do not have|no papers|none|later|can'?t find|cannot find)\b/.test(norm)) {
    return `Not attached. The lawyers still need: ${list}.`;
  }
  if (/\b(attached|uploaded|on here|sent them|here they are)\b/.test(norm)) {
    return `Visitor says the papers are attached. Asked for: ${list}.`;
  }
  return `Visitor said: ${clip(norm, 240)}. Asked for: ${list}.`;
}

function companyAnswer(current: string, norm: string): string {
  if (/^(no|none|n\/a)\b/.test(norm) || /no company|in my name|my own name|just me|i own/.test(norm)) {
    return "In the owner's name";
  }
  return clip(current, 120);
}

function placeAnswer(norm: string, current: string): string {
  if (/\b(new jersey|nj)\b/.test(norm)) return "New Jersey";
  if (/\b(new york|nyc|brooklyn|manhattan|queens|bronx|staten island)\b/.test(norm)) return "New York";
  return clip(current, 80);
}

function fieldToChange(norm: string): IntakePhase | null {
  if (/\bemail\b/.test(norm)) return "email";
  if (/\bphone\b/.test(norm)) return "phone";
  if (/\bcompany\b/.test(norm)) return "company";
  if (/\b(other side|opponent|against)\b/.test(norm)) return "opponent";
  if (/\bdeadline|date|hearing\b/.test(norm)) return "deadline";
  if (/\bsummary|what happened|facts\b/.test(norm)) return "summary";
  return null;
}

function promptFor(phase: IntakePhase): string {
  switch (phase) {
    case "company":
      return "What's the company name?";
    case "role":
      return "What's your role there?";
    case "name":
      return "What's your first and last name?";
    case "email":
      return "What's the best email?";
    case "phone":
      return "A phone number, or say skip.";
    case "opponent":
      return "Who is on the other side?";
    case "place":
      return "Is this in New York, New Jersey, or somewhere else?";
    case "deadline":
      return "Is there a court date or a deadline? Say none if there isn't.";
    case "stake":
      return "What's at stake, in one sentence?";
    case "summary":
      return "In a few sentences, what happened?";
    case "documents":
      return "Attach the papers, or say you don't have them.";
    case "confirm":
      return "Yes to send it, or name what to change.";
    default:
      return "Tell me what happened at the business.";
  }
}

function ask(intake: IntakeDraft, text: string, suggestions = ["Where is the office?"]): ChatResult {
  return { text, cards: [], suggestions, intake, readyToSave: false };
}

function say(text: string, suggestions: string[], intake: IntakeDraft): ChatResult {
  return { text, cards: [], suggestions, intake, readyToSave: false };
}

function withDraft(intake: IntakeDraft): IntakeDraft {
  if (intake.draftId) return intake;
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const draftId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { ...intake, draftId };
}

function keywordHit(norm: string, keyword: string): boolean {
  if (keyword.includes(" ")) return norm.includes(keyword);
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(norm);
}

function bestMatter(norm: string): Practice | undefined {
  const ranked = practices
    .map((practice, index) => ({
      practice,
      score: practice.keywords.reduce((total, keyword) => total + (keywordHit(norm, keyword) ? keyword.length : 0), 0),
      index,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return ranked[0]?.practice;
}

function shouldQualify(norm: string): boolean {
  if (isOut(norm) || isAdvice(norm)) return false;
  if (isInfoShaped(norm) && !bestMatter(norm)) return false;
  return Boolean(bestMatter(norm));
}

function isSideQuestion(norm: string, phase: IntakePhase): boolean {
  if (phase === "confirm" || phase === "documents") return false;
  if (!isInfoShaped(norm) && !isAdvice(norm)) return false;
  if (bestMatter(norm) && phase === "company") return false;
  return Boolean(answerInfo(norm) || isAdvice(norm));
}

function isOut(norm: string): boolean {
  if (/\b(former employee|our employee|my tenant|commercial lease)\b/.test(norm)) return false;
  return (
    /\b(divorce|custody|child support)\b/.test(norm) ||
    /\b(criminal|arrested|dui|felony|probation)\b/.test(norm) ||
    /\b(personal injury|car accident|slip and fall|malpractice|workers comp)\b/.test(norm) ||
    /\b(immigration|visa|asylum|deport)\b/.test(norm) ||
    /\b(chapter 7|personal bankruptcy)\b/.test(norm) ||
    /\b(i was fired|fired me|wrongful termination|my employer)\b/.test(norm) ||
    /\b(evicted from my apartment|evicting me from my apartment)\b/.test(norm)
  );
}

export type EngagementKind = "opened" | "asked" | "qualifying" | "declined" | "refused" | "filed";

export function engagementOf(input: {
  visitorText: string;
  intake: IntakeDraft;
  visitorMessages: number;
  filed: boolean;
}): { kind: EngagementKind; note: string } {
  if (input.filed || input.intake.phase === "saved") return { kind: "filed", note: "Filed" };
  if (input.intake.phase !== "idle") return { kind: "qualifying", note: stopFor(input.intake.phase) };
  const decline = declineTopic(normalize(input.visitorText));
  if (decline) return { kind: "declined", note: decline };
  const norm = normalize(input.visitorText);
  if (isCrisis(norm) || isDanger(norm)) return { kind: "refused", note: "Safety reply" };
  if (containsSensitive(input.visitorText)) return { kind: "refused", note: "Account or Social Security number" };
  if (isDeception(norm)) return { kind: "refused", note: "Asked to hide, backdate, or forge" };
  if (input.visitorMessages > 0) return { kind: "asked", note: "Asked a question" };
  return { kind: "opened", note: "Opened the desk" };
}

function declineTopic(norm: string): string {
  if (!isOut(norm)) return "";
  if (/\b(i was fired|fired me|wrongful termination|my employer)\b/.test(norm)) return "An employee against an employer";
  if (/\b(divorce|custody|child support)\b/.test(norm)) return "Divorce or custody";
  if (/\b(criminal|arrested|dui|felony|probation)\b/.test(norm)) return "Criminal defense";
  if (/\b(personal injury|car accident|slip and fall|malpractice|workers comp)\b/.test(norm)) return "Personal injury";
  if (/\b(immigration|visa|asylum|deport)\b/.test(norm)) return "Immigration";
  if (/\b(chapter 7|personal bankruptcy)\b/.test(norm)) return "Personal bankruptcy";
  if (/\b(evicted from my apartment|evicting me from my apartment)\b/.test(norm)) return "Apartment eviction";
  return "Outside the practice";
}

function stopFor(phase: IntakePhase): string {
  switch (phase) {
    case "company":
      return "Stopped at the company";
    case "role":
      return "Stopped at their role";
    case "name":
      return "Stopped at their name";
    case "email":
      return "Stopped at the email";
    case "phone":
      return "Stopped at the phone";
    case "opponent":
      return "Stopped at the other side";
    case "place":
      return "Stopped at the place";
    case "deadline":
      return "Stopped at the deadline";
    case "stake":
      return "Stopped at what's at stake";
    case "summary":
      return "Stopped at what happened";
    case "documents":
      return "Stopped at the papers";
    case "confirm":
      return "Read the packet and didn't send it";
    default:
      return "In the questions";
  }
}

function declineText(norm: string): string {
  const why = /\b(i was fired|fired me|wrongful termination|my employer)\b/.test(norm)
    ? "The firm represents businesses and their owners, not an employee suing an employer."
    : "The firm doesn't take that work. The site says no personal injury and no criminal defense, and the practice is business law in New York and New Jersey.";
  return `${why}\n\n${firm.referralLine}`;
}

function isAdvice(norm: string): boolean {
  return /\b(do i have a case|should i (sign|sue|settle)|what are my chances|will i win|is this illegal|what should i do|give me advice)\b/.test(norm);
}

function isInfoShaped(norm: string): boolean {
  return /^(what|when|where|who|how|why|can you|do you|are you|is there)\b/.test(norm) || norm.endsWith("?");
}

function isYes(norm: string): boolean {
  return /^(yes|yep|yeah|send|send it|file it|go ahead)\b/.test(norm);
}

function isStartOver(norm: string): boolean {
  return /^(start over|start again|reset|new matter)\b/.test(norm);
}

function isCrisis(norm: string): boolean {
  return /\b(kill myself|suicide|want to die|end my life)\b/.test(norm);
}

function isDanger(norm: string): boolean {
  return /\b(he('s| is) going to kill|she('s| is) going to kill|hitting me|beats me|domestic violence)\b/.test(norm);
}

function isDeception(norm: string): boolean {
  return /\b(hide the money|backdat|forge|fake (a |the )?(signature|document|invoice))\b/.test(norm);
}

function crisisText(): string {
  return "If you're in crisis, call or text 988. They answer. I can't help with that here.";
}

function dangerText(): string {
  return "If you're in danger, call 911. The National Domestic Violence Hotline is 1-800-799-7233. I can't help with that here.";
}

function sensitiveText(): string {
  return "Don't send a Social Security number or an account number here. Take those out and send the rest.";
}

function deceptionText(): string {
  return "I can't help hide money, backdate a paper, or forge a document. If the dispute is real, describe it plainly and the lawyers can review it.";
}

export function containsSensitive(text: string): boolean {
  const digits = text.replace(/\D/g, "");
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) return true;
  if (digits.length >= 13 && digits.length <= 19) return true;
  return false;
}

function pickSummary(history: ChatTurn[], current: string): string {
  const earlier = history
    .filter((turn) => turn.role === "visitor" && turn.text.trim() !== current.trim())
    .map((turn) => turn.text.trim())
    .filter(worthySummary)
    .sort((a, b) => b.length - a.length);
  return earlier[0] ? clip(earlier[0], 1000) : "";
}

function worthySummary(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 40) return false;
  if (trimmed.endsWith("?")) return false;
  const norm = normalize(trimmed);
  if (isInfoShaped(norm) || isOut(norm) || containsSensitive(trimmed)) return false;
  return true;
}

function lastVisitor(history: ChatTurn[]): string {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index]?.role === "visitor") return history[index].text;
  }
  return "";
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/['’]/g, "'").replace(/\s+/g, " ").trim();
}

function clip(text: string, max: number): string {
  return text.trim().slice(0, max);
}

export function isUrgentDeadline(deadline: string): boolean {
  const norm = normalize(deadline);
  if (!norm || norm === "none") return false;
  return /\b(today|tomorrow|this week|asap|urgent|injunction|restraining|monday|tuesday|wednesday|thursday|friday)\b/.test(
    norm,
  );
}
