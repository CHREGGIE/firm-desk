import Link from "next/link";
import { OpenDesk } from "@/components/open-desk";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
      <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">Missing page</p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight sm:text-5xl">
        That page isn&apos;t on the site.
      </h1>
      <p className="mt-4 text-muted-foreground">
        The desk can still tell you what the firm handles, or you can go back to the front.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <OpenDesk>Ask the desk</OpenDesk>
        <Link href="/" className="inline-flex h-11 items-center text-sm underline underline-offset-4">
          Back to the front
        </Link>
      </div>
    </main>
  );
}
