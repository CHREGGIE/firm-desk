import Link from "next/link";
import { OpenDesk } from "@/components/open-desk";
import { Monogram } from "@/components/monogram";
import { buttonVariants } from "@/components/ui/button";
import { attorneys, firm, practices } from "@/lib/firm";
import { cn } from "@/lib/utils";

const samplePrompt =
  "I was let go after I told my manager I was pregnant.";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-7">
          <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">
            Providence · Benefit Street
          </p>
          <h1 className="mt-4 max-w-xl font-heading text-[2.7rem] leading-[1.02] tracking-tight sm:text-6xl">
            A direct answer, then a lawyer who{" "}
            <span className="italic">stays with the file.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
            Calder & Wren is a small firm for employment disputes, fights
            inside closely held companies, estates, and Rhode Island home
            closings. The desk can match the work and take a message. It will
            not guess how a case comes out.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <OpenDesk>Ask the desk</OpenDesk>
            <Link
              href="/consult"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-4")}
            >
              Request a consultation
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">First call</dt>
              <dd className="mt-1 font-heading text-2xl">30 min</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">For a new matter</dt>
              <dd className="mt-1 font-heading text-2xl">No charge</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Office</dt>
              <dd className="mt-1 font-heading text-2xl">Benefit St.</dd>
            </div>
          </dl>
        </div>
        <aside className="lg:col-span-5">
          <div className="border border-border bg-card p-5 shadow-[0_24px_60px_-36px_rgba(60,24,28,0.45)] sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[0.68rem] tracking-[0.18em] text-primary uppercase">
                At the desk
              </p>
              <p className="font-heading text-sm text-muted-foreground">File 048</p>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-6">
              <p className="border-l-2 border-border pl-3 text-muted-foreground">
                {samplePrompt}
              </p>
              <p>
                That is employment work, which Helen Calder and Theo Park
                handle. I can&apos;t say whether the firing was lawful. The
                first conversation is 30 minutes and there is no charge.
              </p>
            </div>
            <OpenDesk prompt={samplePrompt} variant="secondary" className="mt-6 w-full">
              Ask this at the desk
            </OpenDesk>
          </div>
        </aside>
      </section>

      <section className="border-y border-border bg-card/70">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
              Four kinds of work
            </h2>
            <Link
              href="/practices"
              className="text-sm underline decoration-border underline-offset-4"
            >
              All practices
            </Link>
          </div>
          <ol className="mt-8 divide-y divide-border border-y border-border">
            {practices.map((practice, index) => (
              <li key={practice.slug}>
                <Link
                  href={`/practices/${practice.slug}`}
                  className="group grid gap-2 py-5 sm:grid-cols-[4rem_1fr_auto] sm:items-baseline"
                >
                  <span className="font-heading text-xl text-primary">
                    0{index + 1}
                  </span>
                  <span>
                    <span className="font-heading text-2xl tracking-tight">
                      {practice.title}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {practice.blurb}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground">
                    Read
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-2">
        <div>
          <h2 className="font-heading text-3xl tracking-tight">What the desk will do</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6">
            <li>Match a situation to the lawyer who actually does that work.</li>
            <li>Explain the 30-minute conversation, the hourly ranges, and what happens before anyone is a client.</li>
            <li>Take your name, a way to reach you, and a short account of what happened.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-heading text-3xl tracking-tight">What it will not do</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6">
            <li>Tell you whether you have a case, or whether to sign.</li>
            <li>Pretend a chat is privileged. {firm.consult.privilegeLine}</li>
            <li>Take criminal, family, immigration, injury, bankruptcy, or eviction matters.</li>
          </ul>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">The lawyers</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {attorneys.map((attorney) => (
              <li key={attorney.slug}>
                <Link
                  href={`/attorneys/${attorney.slug}`}
                  className="flex gap-4 border border-border bg-card p-4 transition-colors hover:border-primary"
                >
                  <Monogram name={attorney.name} />
                  <span>
                    <span className="block font-heading text-2xl leading-tight">
                      {attorney.name}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {attorney.role} · {attorney.focus}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="max-w-xl font-heading text-4xl leading-tight tracking-tight">
              Thirty minutes. No charge. No engagement until both sides say so.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-primary-foreground/80">
              {firm.consult.replyLine} Call {firm.phone} if a hearing or a closing is already on the calendar.
            </p>
          </div>
          <OpenDesk
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            Talk to the desk
          </OpenDesk>
        </div>
      </section>
    </main>
  );
}
