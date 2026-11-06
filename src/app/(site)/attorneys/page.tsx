import type { Metadata } from "next";
import Link from "next/link";
import { Monogram } from "@/components/monogram";
import { attorneys } from "@/lib/firm";

export const metadata: Metadata = {
  title: "Attorneys",
  description: "Levi Ainsworth, Shaya Gorkin, and Yehuda C. Morgenstern.",
};

export default function AttorneysPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">Attorneys</p>
      <h1 className="mt-3 max-w-2xl font-heading text-4xl tracking-tight sm:text-5xl">
        The lawyers on the file.
      </h1>
      <ul className="mt-12 grid gap-6 md:grid-cols-2">
        {attorneys.map((attorney) => (
          <li key={attorney.slug}>
            <Link
              href={`/attorneys/${attorney.slug}`}
              className="flex h-full gap-4 border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <Monogram name={attorney.name} />
              <span>
                <span className="block font-heading text-3xl leading-none">{attorney.name}</span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {attorney.role} · {attorney.focus}
                </span>
                <span className="mt-3 block text-sm leading-6">{attorney.paragraphs[0]}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
