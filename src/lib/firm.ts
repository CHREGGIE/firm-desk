export type Practice = {
  slug: string;
  title: string;
  blurb: string;
  chatLead: string;
  paragraphs: string[];
  handles: string[];
  declines: string[];
  documents: string[];
  keywords: string[];
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

const declines = [
  "Personal injury and medical malpractice",
  "Criminal defense",
  "Divorce, custody, and other family matters",
  "Immigration",
  "An individual employee's claim against their employer",
];

export const firm = {
  name: "Ainsworth Gorkin",
  legalName: "Ainsworth Gorkin PLLC",
  city: "Brooklyn",
  site: "https://ainsworthgorkin.com",
  tagline: "Commercial litigation and counsel for New York and New Jersey businesses.",
  phone: "(212) 913-0217",
  phoneHref: "tel:+12129130217",
  email: "info@ainsworthgorkin.com",
  emailHref: "mailto:info@ainsworthgorkin.com",
  hours: [
    {
      days: "By phone",
      hours: "Hours aren't published. Call, and a lawyer answers.",
    },
  ],
  consult: {
    feeLine:
      "Every new matter starts with a free evaluation. You describe what happened. The firm says what it thinks it is, whether it's worth pursuing, and whether this is the right office.",
    billingLine:
      "Fees are hourly, a flat fee, or a hybrid. The firm explains the number before work starts. No rate is published on the site, so this desk will not invent one.",
    engagementLine:
      "A message to the desk does not hire the firm. The firm runs a conflict check, then both sides agree in writing before anyone is a client.",
    replyLine:
      "If something is due this week, say so. Restraining orders, injunctions, and answer deadlines move in days.",
    privilegeLine:
      "Writing here is not confidential yet, and it is not an attorney-client relationship. Don't send Social Security numbers, account numbers, or medical records.",
  },
  referralLine:
    "For a New York lawyer who does that work, call the New York City Bar Legal Referral Service at (212) 626-7373 (Spanish: (212) 626-7374), or start at https://www.nycbar.org/get-legal-help/.",
} as const;

export const offices: Office[] = [
  {
    name: "President Street",
    lines: ["1188 President Street, Suite 203", "Brooklyn, NY 11225"],
    note: "The office listed on ainsworthgorkin.com. Licensed in New York and New Jersey.",
  },
];

export const practices: Practice[] = [
  {
    slug: "contract",
    title: "Breach of contract",
    blurb: "A customer, vendor, or partner took the money, or stopped doing what they promised.",
    chatLead: "That sounds like a broken contract.",
    paragraphs: [
      "The firm sues and defends when a business promise breaks: vendors, customers, partners, and the people who signed for them.",
      "The useful first packet is the agreement, the money, and the last thing anybody put in writing.",
    ],
    handles: [
      "Unpaid invoices and deposits",
      "A vendor or customer who stopped performing",
      "A signed deal nobody is honoring",
    ],
    declines,
    documents: [
      "The contract, proposal, or terms they accepted",
      "Invoices, or proof of what was paid",
      "The last email, text, or demand",
    ],
    keywords: [
      "contract",
      "invoice",
      "deposit",
      "stopped paying",
      "didn't pay",
      "did not pay",
      "vendor",
      "customer",
      "owes",
      "breach",
      "unpaid",
    ],
    lawyerSlugs: ["shaya-gorkin", "yehuda-morgenstern"],
  },
  {
    slug: "partnership",
    title: "Partnership disputes",
    blurb: "A partner is cutting you out, or you want out and cannot agree what the share is worth.",
    chatLead: "That sounds like a fight inside the company.",
    paragraphs: [
      "Dissolution, forced buyouts, and fiduciary fights when owners stop trusting each other.",
      "The operating agreement and the ownership split are the papers the lawyers read first.",
    ],
    handles: [
      "Being shut out of decisions or the books",
      "A buyout nobody can price",
      "Dissolution of an LLC or a close corporation",
    ],
    declines,
    documents: [
      "The operating agreement, shareholder agreement, or partnership agreement",
      "Anything that shows who owns what",
      "Emails about being shut out of decisions or the books",
    ],
    keywords: [
      "partner",
      "partnership",
      "cutting me out",
      "shut out",
      "buyout",
      "buy out",
      "operating agreement",
      "shareholder",
      "my share",
      "the books",
    ],
    lawyerSlugs: ["shaya-gorkin", "levi-ainsworth"],
  },
  {
    slug: "real-estate",
    title: "Real estate disputes",
    blurb: "A deal, a commercial lease, or a construction claim came apart.",
    chatLead: "That sounds like a real estate dispute.",
    paragraphs: [
      "Failed transactions, lease fights, and construction claims for owners and investors.",
      "A residential tenant being evicted from an apartment is not this practice. A business lease or a deal that died is.",
    ],
    handles: [
      "A buyer, seller, landlord, or commercial tenant who walked away",
      "Construction claims on a property the business owns",
      "A deal that closed on numbers that were wrong",
    ],
    declines: [...declines, "Eviction of a residential tenant from their apartment"],
    documents: [
      "The contract, lease, or deal email",
      "The notice, or the message where they walked away",
    ],
    keywords: [
      "lease",
      "landlord",
      "commercial tenant",
      "my tenant",
      "real estate",
      "the property",
      "walked away",
      "construction",
      "closing",
    ],
    lawyerSlugs: ["shaya-gorkin"],
  },
  {
    slug: "foreclosure",
    title: "Foreclosure defense",
    blurb: "A lender started a foreclosure on property you own.",
    chatLead: "That sounds like a foreclosure.",
    paragraphs: [
      "The firm defends foreclosures, including challenges to the papers the lender filed.",
      "The notice or the summons is the document that tells the lawyers how fast this moves.",
    ],
    handles: [
      "A foreclosure notice or summons",
      "A sale date that is already on the calendar",
      "A challenge to the way the case was filed",
    ],
    declines,
    documents: [
      "The foreclosure notice, summons, or complaint",
      "The mortgage or note, if you have it",
    ],
    keywords: ["foreclosure", "mortgage", "lis pendens", "bank is taking", "sale date"],
    lawyerSlugs: ["shaya-gorkin"],
  },
  {
    slug: "commercial",
    title: "Corporate and commercial disputes",
    blurb: "Shareholder fights, a deal that was misdescribed, or a former employee who took the clients.",
    chatLead: "That sounds like a commercial dispute.",
    paragraphs: [
      "Shareholder and executive fights, and commercial claims in state and federal court.",
      "The firm represents the business. It does not represent an employee suing their employer.",
    ],
    handles: [
      "Shareholder and executive conflicts",
      "A deal whose numbers turned out to be wrong",
      "A former employee who left with clients or information",
    ],
    declines,
    documents: [
      "The agreement that was broken",
      "The emails or figures that turned out to be wrong",
    ],
    keywords: [
      "former employee",
      "our employee",
      "took our clients",
      "clients went",
      "shareholder",
      "executive",
      "misrepresented",
      "the numbers were wrong",
      "noncompete",
      "stolen",
    ],
    lawyerSlugs: ["shaya-gorkin", "yehuda-morgenstern"],
  },
  {
    slug: "finance",
    title: "Alternative finance",
    blurb: "Loans, MCA agreements, guaranties, and confessions of judgment.",
    chatLead: "That sounds like a finance dispute.",
    paragraphs: [
      "The firm represents lenders and funders on the paper and in the fight: notes, MCA agreements, guaranties, UCC filings, and judgment enforcement.",
      "A personal bankruptcy is not this practice.",
    ],
    handles: [
      "Enforcing or defending a business loan or MCA",
      "A guaranty or a confession of judgment",
      "Security agreements and UCC filings",
    ],
    declines: [...declines, "Personal bankruptcy"],
    documents: [
      "The loan, MCA agreement, note, or guaranty",
      "The demand, confession of judgment, or UCC filing",
    ],
    keywords: [
      "mca",
      "merchant cash",
      "factoring",
      "factor",
      "promissory",
      "guaranty",
      "guarantee",
      "confession of judgment",
      "ucc",
      "lender",
      "funder",
    ],
    lawyerSlugs: ["shaya-gorkin", "levi-ainsworth"],
  },
  {
    slug: "technology",
    title: "Technology and SaaS",
    blurb: "Software agreements, and the fight when a vendor keeps the data or the code.",
    chatLead: "That sounds like a technology contract.",
    paragraphs: [
      "SaaS agreements, terms of service, data protection, and IP assignment, plus the dispute when the implementation fails.",
    ],
    handles: [
      "A software vendor who stopped delivering",
      "A developer who now claims to own the work",
      "Terms of service and data terms",
    ],
    declines,
    documents: [
      "The agreement or statement of work",
      "What was not delivered, or the claim that they own the work",
    ],
    keywords: [
      "saas",
      "software",
      "developer",
      "source code",
      "our data",
      "terms of service",
      "the app",
    ],
    lawyerSlugs: ["levi-ainsworth", "shaya-gorkin"],
  },
  {
    slug: "acquisitions",
    title: "Mergers and acquisitions",
    blurb: "Buying or selling a company.",
    chatLead: "That sounds like a purchase or sale of a business.",
    paragraphs: [
      "Levi Ainsworth handles buyers and sellers through the transaction, from the letter of intent through the papers.",
    ],
    handles: [
      "Buying a business",
      "Selling a business",
      "A letter of intent that needs a read before anyone signs",
    ],
    declines,
    documents: ["The letter of intent or the offer", "The financials you were shown, if those are the dispute"],
    keywords: [
      "buying a business",
      "buying the business",
      "selling the business",
      "sell my business",
      "acquisition",
      "letter of intent",
      "merger",
    ],
    lawyerSlugs: ["levi-ainsworth"],
  },
  {
    slug: "startup",
    title: "Startup and venture counsel",
    blurb: "Formation, co-founder terms, and a venture term sheet.",
    chatLead: "That sounds like company formation or a venture deal.",
    paragraphs: [
      "Entity formation, co-founder agreements, and venture term sheets for businesses that want the paper right before there is a fight.",
    ],
    handles: ["Forming the company", "A co-founder agreement", "A venture term sheet"],
    declines,
    documents: ["The term sheet, co-founder email, or draft agreement"],
    keywords: ["startup", "co-founder", "cofounder", "term sheet", "venture", "incorporate", "form the company"],
    lawyerSlugs: ["levi-ainsworth"],
  },
  {
    slug: "agreements",
    title: "Contracts and transactions",
    blurb: "Someone sent a stack of pages and you need to know what you would be signing.",
    chatLead: "That sounds like a contract to review before anyone signs.",
    paragraphs: [
      "Drafting and review of the agreements the business actually lives on. The firm describes the transactional work as the cheaper path, before a dispute exists.",
    ],
    handles: [
      "Review of a contract you were asked to sign",
      "An operating agreement or buy-sell before it is needed",
      "A deal that should be written down",
    ],
    declines,
    documents: ["The draft you were asked to sign"],
    keywords: ["review this", "forty pages", "the draft", "asked to sign", "buy-sell", "buy sell"],
    lawyerSlugs: ["levi-ainsworth"],
  },
  {
    slug: "counsel",
    title: "Outside general counsel",
    blurb: "Legal questions keep coming up and the company has nobody to call.",
    chatLead: "That sounds like ongoing counsel, not one lawsuit.",
    paragraphs: [
      "Ongoing advice for a business that does not have an in-house lawyer. Most of the firm's clients are between two and a hundred people.",
    ],
    handles: [
      "A company that needs a lawyer on call",
      "Employment paperwork for the business, as the employer",
      "Questions that are not a lawsuit yet",
    ],
    declines,
    documents: ["The contract or question in front of you, if there is one"],
    keywords: ["outside counsel", "general counsel", "on call", "nobody to call", "monthly counsel"],
    lawyerSlugs: ["levi-ainsworth"],
  },
  {
    slug: "arbitration",
    title: "Arbitration and mediation",
    blurb: "The contract sends the fight to arbitration, or both sides are willing to mediate.",
    chatLead: "That sounds like arbitration or mediation.",
    paragraphs: [
      "The firm represents clients in binding arbitration and in mediation when a courtroom is the wrong first step.",
    ],
    handles: ["A demand for arbitration", "A mediation the contract requires", "A clause that keeps the case out of court"],
    declines,
    documents: ["The clause that requires arbitration or mediation", "The demand, if one was filed"],
    keywords: ["arbitration", "arbitrator", "mediation", "mediator"],
    lawyerSlugs: ["shaya-gorkin", "levi-ainsworth"],
  },
  {
    slug: "emergency",
    title: "Emergency relief",
    blurb: "Money is moving, or a paper has to be answered in days.",
    chatLead: "That sounds time-sensitive.",
    paragraphs: [
      "Restraining orders, injunctions, and answer deadlines. The firm asks you to say so on the first contact, and will say if the timeline is realistic.",
    ],
    handles: [
      "A temporary restraining order or an injunction",
      "An answer that is due this week",
      "Money that has to be stopped from moving",
    ],
    declines,
    documents: ["The papers that were served", "The date a response is due"],
    keywords: [
      "injunction",
      "restraining order",
      "temporary restraining",
      "money is moving",
      "freeze the account",
      "answer is due",
      "answer due",
      "served yesterday",
    ],
    lawyerSlugs: ["shaya-gorkin"],
  },
];

export const unsureMatter: Practice = {
  slug: "unsure",
  title: "Not sure what to call it",
  blurb: "Describe what happened. The lawyers will say what it is, or that it is nothing.",
  chatLead: "The lawyers can name this on the free evaluation. I won't guess the claim.",
  paragraphs: [],
  handles: [],
  declines,
  documents: ["Whatever you were served, or the draft you were asked to sign"],
  keywords: [],
  lawyerSlugs: ["shaya-gorkin", "levi-ainsworth"],
};

export const attorneys: Attorney[] = [
  {
    slug: "levi-ainsworth",
    name: "Levi Ainsworth",
    role: "Founding partner",
    focus: "Transactions, outside counsel, startups, and acquisitions",
    admissions: "New York. U.S. District Court for the Southern District of New York.",
    education:
      "Bachelor of Laws, Victoria University Law School, 2015. Certificate in mediation and dispute resolution, Humboldt University, Berlin.",
    languages: ["English"],
    paragraphs: [
      "Levi heads the corporate and commercial transactions work: day-to-day counsel, partnerships, formation, finance documents, and buying or selling a company.",
      "The firm says he is the lawyer to ask when the question is the paper, not a lawsuit that has already been filed.",
    ],
    practiceSlugs: ["partnership", "finance", "technology", "acquisitions", "startup", "agreements", "counsel", "arbitration"],
  },
  {
    slug: "shaya-gorkin",
    name: "Shaya Gorkin",
    role: "Founding partner",
    focus: "Commercial litigation, property disputes, and finance fights",
    admissions:
      "New York and New Jersey. Southern District of New York and Eastern District of New York.",
    education: "J.D., Benjamin N. Cardozo School of Law, 2017. B.A., Rabbinical College of America, 2010.",
    languages: ["English"],
    paragraphs: [
      "Shaya heads the litigation practice: breach of contract, property disputes, partnership breakups, alternative finance, factoring, and judgment enforcement.",
      "If a complaint has been filed, or someone has to be sued, his name is the one the desk puts on the file.",
    ],
    practiceSlugs: ["contract", "partnership", "real-estate", "foreclosure", "commercial", "finance", "technology", "arbitration", "emergency"],
  },
  {
    slug: "yehuda-morgenstern",
    name: "Yehuda C. Morgenstern",
    role: "Associate",
    focus: "Complex commercial litigation",
    admissions: "New York. Eastern District of New York. U.S. Court of Appeals for the Second Circuit.",
    education:
      "J.D., Fordham University School of Law, 2012. Talmudic Law, Beth Midrash Govoah, 2005.",
    languages: ["English"],
    paragraphs: [
      "Yehuda is an associate in the litigation department. Before this firm he worked at commercial litigation boutiques, in state and federal court and before the Securities and Exchange Commission.",
      "He was an editor of the Fordham Comparative Law Journal and interned for a judge of the Supreme Court of Kings County. Before law school he was a chaplain in New York State correctional facilities.",
    ],
    practiceSlugs: ["contract", "commercial"],
  },
];

export function getPractice(slug: string): Practice | undefined {
  return practices.find((practice) => practice.slug === slug);
}

export function getMatter(slug: string): Practice | undefined {
  if (slug === unsureMatter.slug) return unsureMatter;
  return getPractice(slug);
}

export function getAttorney(slug: string): Attorney | undefined {
  return attorneys.find((attorney) => attorney.slug === slug);
}

export function attorneysFor(practiceSlug: string): Attorney[] {
  return attorneys.filter((attorney) => attorney.practiceSlugs.includes(practiceSlug));
}

export function lawyerNames(slugs: string[]): string {
  const names = slugs
    .map((slug) => getAttorney(slug)?.name)
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) return "the lawyers";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}
