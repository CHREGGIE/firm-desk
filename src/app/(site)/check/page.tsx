import type { Metadata } from "next";
import Link from "next/link";
import { OpenDesk } from "@/components/open-desk";

export const metadata: Metadata = {
  title: "Check the flow",
  description: "The script the legal assistant walks, and what the desk should do at each step.",
  robots: { index: false, follow: false },
};

const contractStory =
  "A customer took the deposit in March and stopped answering. The contract is signed and about $80,000 is unpaid.";

const steps = [
  {
    title: "Open the desk",
    detail:
      "Use Ask the desk. The first line should name Ainsworth Gorkin and say a message is not confidential yet.",
  },
  {
    title: "Give it a broken contract",
    detail:
      "Send the deposit story. It should call this a broken contract, name Shaya Gorkin, and ask for the company. It should not say the firm will win or that the money is recoverable.",
    prompt: contractStory,
  },
  {
    title: "Answer in this order",
    detail:
      "Northwind Supply LLC. Owner. Your own name. An email you can check. skip. Harbor Goods Inc. Brooklyn. None. About $80,000.",
  },
  {
    title: "Add a paper, or say you don't have it",
    detail:
      "It should ask for the contract, an invoice or proof of payment, and the last email or demand. Attach a short PDF, or send “I don't have them.”",
  },
  {
    title: "Read the packet before it files",
    detail:
      "The summary should show Northwind Supply, Harbor Goods, New York, and what you said about the papers. Send “Yes, send it.” Copy the AG- reference.",
  },
  {
    title: "Open the lawyer queue",
    detail:
      "Go to Lawyer review and sign in. The reference should be there, marked Ready, with the company and the file if you attached one. Download the file and confirm it opens.",
  },
];

const spots = [
  {
    send: "I was fired after I reported harassment to HR",
    expect: "It declines. The firm represents businesses and their owners. It gives the New York City Bar referral line, (212) 626-7373, and does not ask for a company.",
  },
  {
    send: "I need a divorce lawyer",
    expect: "It declines and gives the same referral line. It does not start a file.",
  },
  {
    send: "What does a consult cost?",
    expect: "It says the first evaluation is free and that no rate is published. It must not invent a dollar amount.",
  },
  {
    send: "I got a foreclosure notice on a building I own in Brooklyn.",
    expect: "It treats this as a foreclosure, names Shaya Gorkin, and then asks for the company. Start over afterward so it does not mix with the contract file.",
  },
];

export default function CheckPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
      <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">For the assistant</p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight sm:text-5xl">Check the intake.</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
        Walk this once on the Vercel copy. File one contract lead, then run the four short checks.
        The lawyers read what you filed at{" "}
        <Link className="underline underline-offset-4" href="/review">
          Lawyer review
        </Link>
        . A message here does not hire the firm.
      </p>
      <ol className="mt-10 space-y-6">
        {steps.map((step, index) => (
          <li key={step.title} className="border border-border bg-card px-4 py-4">
            <p className="text-[0.68rem] tracking-[0.16em] text-primary uppercase">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-heading text-2xl">{step.title}</h2>
            <p className="mt-2 text-sm leading-6">{step.detail}</p>
            {step.prompt ? (
              <OpenDesk prompt={step.prompt} variant="secondary" className="mt-4">
                Send the deposit story
              </OpenDesk>
            ) : null}
          </li>
        ))}
      </ol>
      <h2 className="mt-14 font-heading text-3xl tracking-tight">Four answers to spot-check</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Start over in the desk before each one. These should not become a filed lead.
      </p>
      <ul className="mt-6 space-y-4">
        {spots.map((spot) => (
          <li key={spot.send} className="border-t border-border pt-4">
            <p className="text-sm leading-6">“{spot.send}”</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{spot.expect}</p>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm leading-6 text-muted-foreground">
        The review password is shared with you separately. On a dev computer it is written on the
        review page. The same password opens{" "}
        <Link className="underline underline-offset-4" href="/admin">
          Desk admin
        </Link>
        , which counts who opened the desk, where they stopped, and how many became a file. If a
        lead is missing, say so before filing another one.
      </p>
    </main>
  );
}
