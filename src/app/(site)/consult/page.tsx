import type { Metadata } from "next";
import { ConsultForm } from "@/components/consult-form";
import { OpenDesk } from "@/components/open-desk";
import { firm } from "@/lib/firm";

export const metadata: Metadata = {
  title: "Request a consultation",
  description: "File a business matter, with the papers, for a free evaluation.",
};

export default function ConsultPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">Consult</p>
        <h1 className="mt-3 font-heading text-4xl tracking-tight sm:text-5xl">
          Tell the desk what happened.
        </h1>
        <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
          <p>{firm.consult.feeLine}</p>
          <p>{firm.consult.billingLine}</p>
          <p>{firm.consult.replyLine}</p>
        </div>
        <p className="mt-6 text-sm">
          Prefer to talk it through? <OpenDesk variant="link" className="h-auto px-0">Ask the desk</OpenDesk> — it asks the same questions.
        </p>
        <p className="mt-6 text-sm">
          If a hearing, a response, or a closing is already set, call{" "}
          <a className="underline underline-offset-4" href={firm.phoneHref}>
            {firm.phone}
          </a>{" "}
          during office hours.
        </p>
      </div>
      <ConsultForm />
    </main>
  );
}
