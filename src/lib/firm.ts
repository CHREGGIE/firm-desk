export type Practice = {
  slug: string;
  title: string;
  blurb: string;
  chatLead: string;
  paragraphs: string[];
  handles: string[];
  declines: string[];
  lawyerSlugs: string[];
};

export type Attorney = {
  slug: string;
  name: string;
  role: string;
  focus: string;
  admissions: string;
  education: string;
  languages: string[];
  paragraphs: string[];
  practiceSlugs: string[];
};

export type Office = {
  name: string;
  lines: string[];
  note: string;
};

export const firm = {
  name: "Calder & Wren",
  city: "Providence",
  tagline: "Counsel for work, property, and what you leave behind.",
  phone: "(401) 555-0148",
  phoneHref: "tel:+14015550148",
  email: "desk@calderandwren.example",
  emailHref: "mailto:desk@calderandwren.example",
  hours: [
    { days: "Monday–Thursday", hours: "9:00 a.m. – 5:30 p.m." },
    { days: "Friday", hours: "9:00 a.m. – 3:00 p.m." },
    { days: "Saturday and Sunday", hours: "Closed" },
  ],
  consult: {
    feeLine:
      "The first conversation about a new matter is 30 minutes, by phone or at Benefit Street, and there is no charge.",
    billingLine:
      "If we agree to take the work, partners bill $425–$525 an hour. Counsel and associates bill $275–$375. A straightforward will, or a Rhode Island home closing, is often a flat fee, quoted after that first conversation.",
    engagementLine:
      "A message to the desk does not hire the firm. We run a conflict check, then both sides have to agree, in writing, before anyone is a client.",
    replyLine:
      "We reply within one business day. Messages marked urgent are read first on the next weekday morning.",
    privilegeLine:
      "Writing here is not confidential yet, and it is not an attorney-client relationship. Don't send Social Security numbers, account numbers, or medical records. Privilege starts only if we send an engagement letter and you sign it.",
  },
  referralLine:
    "For a lawyer who does that work, call the Rhode Island Bar Association's Lawyer Referral Service at (401) 421-7799 on weekdays, or start at https://ribar.com/?pg=lawyerreferralservice.",
} as const;

export const offices: Office[] = [
  {
    name: "Benefit Street",
    lines: ["48 Benefit Street", "Providence, RI 02903"],
    note: "Main office. Street parking on Benefit, and lots toward South Main.",
  },
  {
    name: "Boston, by appointment",
    lines: ["1 Federal Street, Suite 400", "Boston, MA 02110"],
    note: "Tuesday afternoons only. Ask when you book.",
  },
];

export const practices: Practice[] = [
  {
    slug: "employment",
    title: "Employment & workplace",
    blurb: "Firings, discrimination, wages, severance, and noncompetes.",
    chatLead: "That sounds like an employment matter.",
    paragraphs: [
      "We represent employees and small employers in workplace disputes. The first question is always a conflict check: we will not sit down with both sides of the same fight.",
      "Bring the dates, the handbook, and whatever was put in writing. A timeline is more useful than a theory.",
    ],
    handles: [
      "Termination and severance review",
      "Discrimination, harassment, and retaliation",
      "Unpaid wages and overtime",
      "Noncompete and nonsolicit review",
      "Handbooks and executive agreements for small employers",
    ],
    declines: [
      "Union grievances under a collective bargaining agreement",
      "ERISA class actions",
      "Coaching anyone on how to hide a firing",
    ],
    lawyerSlugs: ["helen-calder", "theo-park"],
  },
  {
    slug: "business",
    title: "Business disputes",
    blurb: "Contracts, unpaid bills, and fights inside closely held companies.",
    chatLead: "That sounds like a business dispute.",
    paragraphs: [
      "Most of this work is a broken promise between people who already know each other: a partner, a vendor, a customer who stopped paying.",
      "We read the contract and the emails before we talk about a lawsuit. A lot of these files settle once the numbers are on one page.",
    ],
    handles: [
      "Broken contracts between companies that know each other",
      "Unpaid invoices and disputed bills",
      "Partnership and shareholder fights in closely held companies",
      "Business breakups and buyouts",
    ],
    declines: [
      "Securities, public offerings, and venture financing",
      "Patents and trademarks",
      "Bet-the-company cases for large corporations",
    ],
    lawyerSlugs: ["helen-calder", "amira-solano"],
  },
  {
    slug: "estates",
    title: "Wills, trusts & probate",
    blurb: "Wills, revocable trusts, and estates that need administering.",
    chatLead: "That sounds like an estate matter.",
    paragraphs: [
      "Owen Wren drafts the will and stays on to probate it. Contested estates of modest size stay in the office; we say so early if a file needs a bigger litigation team.",
      "If a house is part of the estate, the closing practice can pick up the sale once the probate questions are clear.",
    ],
    handles: [
      "Wills and revocable trusts",
      "Probate administration",
      "Will contests of modest size",
      "Coordinating the sale of a house that sits inside an estate",
    ],
    declines: [
      "Tax controversy",
      "Medicaid planning as a standalone service",
      "Guardianship fights as a main practice",
    ],
    lawyerSlugs: ["owen-wren"],
  },
  {
    slug: "closings",
    title: "Home closings",
    blurb: "Rhode Island home purchases and sales, and the title questions before you sign.",
    chatLead: "That sounds like a residential closing.",
    paragraphs: [
      "We represent buyers and sellers of homes in Rhode Island, and some nearby Massachusetts closings by arrangement. We do not represent both sides of the same sale.",
      "Send the purchase and sale agreement before the weekend you plan to sign. Title problems are cheaper to find on a Tuesday than at the table.",
    ],
    handles: [
      "Buying or selling a home in Rhode Island",
      "Nearby Massachusetts closings, by arrangement",
      "Title questions before you sign",
      "Review of a purchase and sale agreement",
    ],
    declines: [
      "Commercial development",
      "Evictions and landlord-tenant court",
      "Construction-defect litigation",
    ],
    lawyerSlugs: ["owen-wren", "theo-park"],
  },
];

export const attorneys: Attorney[] = [
  {
    slug: "helen-calder",
    name: "Helen Calder",
    role: "Partner",
    focus: "Employment and closely held business disputes",
    admissions: "Rhode Island and Massachusetts",
    education: "Brown University, 1998. University of Connecticut School of Law, 2003.",
    languages: ["English"],
    paragraphs: [
      "Helen tries cases and reads the contract before she talks about it. She started at a large firm in Boston and left to represent people who needed a lawyer, not a committee.",
      "She handles firings, discrimination claims, and the fights that break out when a small company splits. If the file is an employment matter or a business divorce, she is usually the right first call.",
    ],
    practiceSlugs: ["employment", "business"],
  },
  {
    slug: "owen-wren",
    name: "Owen Wren",
    role: "Partner",
    focus: "Estates and residential real estate",
    admissions: "Rhode Island",
    education: "Bowdoin College, 2001. Boston College Law School, 2006.",
    languages: ["English"],
    paragraphs: [
      "Owen drafts the will, then stays on to probate it. He also sits with buyers the week before a Rhode Island closing when the title looks uneven.",
      "Clients usually meet him with a house, a parent’s estate, or both. He will tell you on the first call if the work is really a tax problem we don’t take.",
    ],
    practiceSlugs: ["estates", "closings"],
  },
  {
    slug: "amira-solano",
    name: "Amira Solano",
    role: "Counsel",
    focus: "Business disputes",
    admissions: "Rhode Island, Massachusetts, and New York",
    education:
      "University of Puerto Rico, 2005. Northeastern University School of Law, 2010.",
    languages: ["English", "Spanish"],
    paragraphs: [
      "Amira handles the fight after a partnership breaks: the unpaid invoice, the operating agreement nobody followed, the buyout that stalled.",
      "She is the person to ask for if you want the consultation in Spanish. Say so when you leave a message and the desk will mark it.",
    ],
    practiceSlugs: ["business"],
  },
  {
    slug: "theo-park",
    name: "Theo Park",
    role: "Associate",
    focus: "Employment, and documents on closings",
    admissions: "Rhode Island",
    education:
      "University of Michigan, 2016. Roger Williams University School of Law, 2021.",
    languages: ["English"],
    paragraphs: [
      "Theo drafts the demand, builds the timeline, and is usually the first person to read what you send in on an employment file.",
      "On closings, he reviews the purchase and sale agreement and the title commitment before Owen Wren talks with you about what they mean.",
    ],
    practiceSlugs: ["employment", "closings"],
  },
];

export function getPractice(slug: string): Practice | undefined {
  return practices.find((practice) => practice.slug === slug);
}

export function getAttorney(slug: string): Attorney | undefined {
  return attorneys.find((attorney) => attorney.slug === slug);
}

export function attorneysFor(practiceSlug: string): Attorney[] {
  return attorneys.filter((attorney) =>
    attorney.practiceSlugs.includes(practiceSlug),
  );
}

export function lawyerNames(slugs: string[]): string {
  const names = slugs
    .map((slug) => getAttorney(slug)?.name)
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) return "the lawyers here";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}
