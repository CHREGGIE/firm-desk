import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OpenDesk } from "@/components/open-desk";
import { Monogram } from "@/components/monogram";
import { attorneysFor, getPractice, lawyerNames, practices } from "@/lib/firm";
import { PageFallback } from "@/components/page-fallback";

export function generateStaticParams() {
  return practices.map((practice) => ({ slug: practice.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const practice = getPractice(slug);
  if (!practice) return { title: "Practice" };
  return { title: practice.title, description: practice.blurb };
}

export default function PracticePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Practice" />}>
      <PracticeBody params={params} />
    </Suspense>
  );
}

async function PracticeBody({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const practice = getPractice(slug);
  if (!practice) notFound();
  const lawyers = attorneysFor(practice.slug);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/practices" className="underline decoration-border underline-offset-4">
          Practices
        </Link>
      </p>
      <h1 className="mt-3 max-w-3xl font-heading text-4xl tracking-tight sm:text-6xl">
        {practice.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{practice.blurb}</p>
      <div className="mt-8">
        <OpenDesk prompt={`I'd like to talk about ${practice.title.toLowerCase()}.`}>
          Ask the desk about this
        </OpenDesk>
      </div>
      <div className="mt-12 grid gap-12 md:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4 text-base leading-7">
          {practice.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <h2 className="pt-4 font-heading text-2xl">What we handle</h2>
          <ul className="space-y-2 text-sm leading-6">
            {practice.handles.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h2 className="pt-4 font-heading text-2xl">What we don&apos;t</h2>
          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            {practice.declines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <aside className="h-fit border border-border bg-card p-5">
          <p className="text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
            Talk with
          </p>
          <p className="mt-2 text-sm">{lawyerNames(practice.lawyerSlugs)}</p>
          <ul className="mt-5 space-y-4">
            {lawyers.map((attorney) => (
              <li key={attorney.slug}>
                <Link href={`/attorneys/${attorney.slug}`} className="flex items-center gap-3">
                  <Monogram name={attorney.name} />
                  <span>
                    <span className="block font-heading text-xl">{attorney.name}</span>
                    <span className="text-sm text-muted-foreground">{attorney.role}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
