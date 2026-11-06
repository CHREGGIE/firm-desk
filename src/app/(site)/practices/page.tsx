import type { Metadata } from "next";
import Link from "next/link";
import { firm, lawyerNames, practices } from "@/lib/firm";

export const metadata: Metadata = {
  title: "Practices",
  description: "Commercial litigation, contracts, finance, and counsel for New York and New Jersey businesses.",
};

export default function PracticesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">Practices</p>
      <h1 className="mt-3 max-w-2xl font-heading text-4xl tracking-tight sm:text-5xl">
        The work we take, and the work we don&apos;t.
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        If your matter isn&apos;t on this list, we&apos;ll say so. {firm.referralLine}
      </p>
      <div className="mt-12 space-y-16">
        {practices.map((practice) => (
          <article key={practice.slug} className="grid gap-6 border-t border-border pt-8 md:grid-cols-[1.4fr_0.8fr]">
            <div>
              <h2 className="font-heading text-3xl tracking-tight">
                <Link href={`/practices/${practice.slug}`} className="hover:text-primary">
                  {practice.title}
                </Link>
              </h2>
              <p className="mt-3 text-muted-foreground">{practice.blurb}</p>
              <ul className="mt-5 space-y-2 text-sm leading-6">
                {practice.handles.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="text-sm leading-6">
              <p className="text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
                Lawyers
              </p>
              <p className="mt-2">{lawyerNames(practice.lawyerSlugs)}</p>
              <p className="mt-4 text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
                We decline
              </p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {practice.declines.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
