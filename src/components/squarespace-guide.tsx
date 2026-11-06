"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

function useOrigin() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

function isLocalOrigin(origin: string) {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export function SquarespaceGuide() {
  const origin = useOrigin();
  const local = isLocalOrigin(origin);
  const scriptSnippet = origin
    ? `<!-- Ainsworth Gorkin desk. Paste once, into the footer. -->\n<script src="${origin}/widget.js?v=1" defer></script>`
    : "";
  const frameSnippet = origin
    ? `<div style="position:relative;height:640px;">\n  <iframe\n    src="${origin}/embed"\n    title="Ask the desk"\n    style="position:absolute;inset:0;width:100%;height:100%;border:0;"\n  ></iframe>\n</div>`
    : "";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
      <p className="text-[0.68rem] tracking-[0.2em] text-primary uppercase">Squarespace</p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight sm:text-5xl">
        Your pages stay on Squarespace.
      </h1>
      <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          Squarespace cannot run this app. It can show the desk. Paste one snippet and a
          button sits on every page of the firm site. The conversation opens in a frame
          that this app draws, so a Squarespace template cannot restyle the chat or block
          the reply.
        </p>
        <p>
          A message filed from that button is stored here, the same way as a message filed
          on this demo. Squarespace never receives the text.
        </p>
      </div>

      {local && (
        <p className="mt-6 border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-6" role="status">
          This page is on your computer. Squarespace cannot load it. Publish the app, open
          this same page on the published address, and copy the snippet from there.
        </p>
      )}

      <section className="mt-12">
        <h2 className="font-heading text-3xl tracking-tight">On every page</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          This is the one to use. Footer code injection needs a Core, Plus, or Advanced
          plan, or an older plan that still includes it. Basic will not run the snippet.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>In Squarespace, open the Pages panel.</li>
          <li>
            Scroll to the bottom, past Not linked, and open Custom Code, then Code
            Injection. If that menu is missing, use Settings, then Advanced, then Code
            Injection. On some accounts it is under Website Tools.
          </li>
          <li>Paste the snippet into Footer. Leave Header empty.</li>
          <li>Save.</li>
          <li>
            Open the live site in a private window. The editor, and a browser where you
            are logged into Squarespace, often hide injected code.
          </li>
        </ol>
        <Snippet label="Copy the footer snippet" code={scriptSnippet} ready={Boolean(origin)} />
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          To change the button words, add{" "}
          <code className="text-foreground">data-label=&quot;Message the firm&quot;</code> on
          the script tag. Forty characters at most. Paste the tag once.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-3xl tracking-tight">On one page</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Use this when the desk should sit in a section, not in the corner. Same plan
          requirement. Use a Code block. An Embed block only accepts services Squarespace
          already knows, and it will not take this frame.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Edit the page and add a Code block where the desk should sit.</li>
          <li>Paste the frame below. Do not also paste the footer snippet on that page, or visitors get two desks.</li>
          <li>Save, then open the page in a private window.</li>
          <li>
            If the page lives inside an index, Squarespace may skip the block. Move the
            page out of the index and check again.
          </li>
        </ol>
        <Snippet label="Copy the page frame" code={frameSnippet} ready={Boolean(origin)} />
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          640 is the height in pixels. You can lower it, but leave at least 560 so the
          typing box stays on screen.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-3xl tracking-tight">If the button is missing</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>Check a private window, logged out of Squarespace.</li>
          <li>
            If the button vanishes when someone clicks to another page, Ajax loading is
            stripping it. The script puts the button back. If it stays gone, turn Ajax
            loading off. On version 7.0 that switch is under Design, then Site Styles.
          </li>
          <li>
            Names of practices and lawyers open in a new tab on this app, so the chat on
            Squarespace stays put.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-3xl tracking-tight">The panel</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This is the frame a Code block shows. On the rest of the site it opens from the
          corner button.
        </p>
        <iframe
          title="Preview of the desk"
          src="/embed"
          className="mt-4 h-[36rem] w-full border border-border bg-card"
        />
      </section>
    </main>
  );
}

function Snippet({
  label,
  code,
  ready,
}: {
  label: string;
  code: string;
  ready: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const area = document.createElement("textarea");
      area.value = code;
      area.setAttribute("readonly", "");
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <p className="text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
        <Button type="button" variant="outline" className="h-8 bg-background" disabled={!ready} onClick={() => void copy()}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-xs leading-5 whitespace-pre-wrap">
        <code>{ready ? code : "Loading the address…"}</code>
      </pre>
    </div>
  );
}
