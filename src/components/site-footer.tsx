import Link from "next/link";
import { firm, offices } from "@/lib/firm";

export function SiteFooter() {
  const office = offices[0];

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-heading text-2xl">Ainsworth Gorkin</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
            {firm.tagline}
          </p>
        </div>
        <div>
          <p className="text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
            Visit
          </p>
          <p className="mt-2 text-sm leading-6">
            {office.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <p className="mt-3 text-sm">
            <a className="underline decoration-border underline-offset-4" href={firm.phoneHref}>
              {firm.phone}
            </a>
          </p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {firm.hours.map((row) => (
              <li key={row.days}>
                {row.days}: {row.hours}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
            On this site
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <Link className="underline decoration-border underline-offset-4" href="/practices">
                Practices
              </Link>
            </li>
            <li>
              <Link className="underline decoration-border underline-offset-4" href="/attorneys">
                Attorneys
              </Link>
            </li>
            <li>
              <Link className="underline decoration-border underline-offset-4" href="/consult">
                Request a consultation
              </Link>
            </li>
            <li>
              <Link className="underline decoration-border underline-offset-4" href="/squarespace">
                Add the desk to Squarespace
              </Link>
            </li>
            <li>
              <Link className="underline decoration-border underline-offset-4" href="/review">
                Lawyer review
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-6xl px-5 pt-4 pb-20 text-xs leading-5 text-muted-foreground sm:px-8 md:pb-4">
          This is a test of the intake desk for Ainsworth Gorkin PLLC, built to
          sit on their Squarespace site. It is not the firm&apos;s website.
          Nothing here is legal advice. Sending a message does not create an
          attorney-client relationship, and it is not confidential until an
          engagement letter is signed.
        </p>
      </div>
    </footer>
  );
}
