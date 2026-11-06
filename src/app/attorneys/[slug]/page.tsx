import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OpenDesk } from "@/components/open-desk";
import { Monogram } from "@/components/monogram";
import { attorneys, getAttorney, getPractice } from "@/lib/firm";
import { PageFallback } from "@/components/page-fallback";

export function generateStaticParams() {
  return attorneys.map((attorney) => ({ slug: attorney.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const attorney = getAttorney(slug);
  if (!attorney) return { title: "Attorney" };
  return {
    title: attorney.name,
    description: `${attorney.role}. ${attorney.focus}.`,
  };
}

export default function AttorneyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Attorney" />}>
      <AttorneyBody params={params} />
    </Suspense>
  );
}

async function AttorneyBody({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const attorney = getAttorney(slug);
  if (!attorney) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/attorneys" className="underline decoration-border underline-offset-4">
          Attorneys
        </Link>
      </p>
      <div className="mt-6 flex items-start gap-5">
        <Monogram name={attorney.name} />
        <div>
          <h1 className="font-heading text-4xl tracking-tight sm:text-6xl">{attorney.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {attorney.role} · {attorney.focus}
          </p>
        </div>
      </div>
      <div className="mt-8">
        <OpenDesk prompt={`I'd like to speak with ${attorney.name}.`}>
          Ask to speak with {attorney.name.split(" ")[0]}
        </OpenDesk>
      </div>
      <div className="mt-12 grid gap-12 md:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4 text-base leading-7">
          {attorney.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <aside className="h-fit space-y-4 border border-border bg-card p-5 text-sm leading-6">
          <p>
            <span className="block text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
              Admitted
            </span>
            {attorney.admissions}
          </p>
          <p>
            <span className="block text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
              Education
            </span>
            {attorney.education}
          </p>
          <p>
            <span className="block text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
              Languages
            </span>
            {attorney.languages.join(", ")}
          </p>
          <p>
            <span className="block text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
              Practices
            </span>
          </p>
          <ul>
            {attorney.practiceSlugs.map((slug) => {
              const practice = getPractice(slug);
              if (!practice) return null;
              return (
                <li key={slug}>
                  <Link
                    href={`/practices/${slug}`}
                    className="underline decoration-border underline-offset-4"
                  >
                    {practice.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </main>
  );
}
