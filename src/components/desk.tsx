"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyIntake,
  openingSuggestions,
  openingText,
  type ChatCard,
  type IntakeDraft,
} from "@/lib/chat";
import { firm } from "@/lib/firm";

type DeskMessage = {
  id: string;
  role: "visitor" | "desk";
  text: string;
  cards?: ChatCard[];
};

const STORAGE_KEY = "calder-wren-desk";

type DeskSession = {
  messages: DeskMessage[];
  intake: IntakeDraft;
  suggestions: string[];
};

const serverSession: DeskSession = {
  messages: [{ id: "m-0", role: "desk", text: openingText }],
  intake: emptyIntake(),
  suggestions: openingSuggestions,
};

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedSession: DeskSession = serverSession;

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSession(): DeskSession {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  cachedSession = raw ? parseSession(raw) : serverSession;
  return cachedSession;
}

function writeSession(next: DeskSession) {
  const raw = JSON.stringify(next);
  sessionStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSession = next;
  for (const listener of listeners) listener();
}

function parseSession(raw: string): DeskSession {
  try {
    const saved = JSON.parse(raw) as {
      messages?: unknown;
      intake?: IntakeDraft;
      suggestions?: unknown;
    };
    const messages = Array.isArray(saved.messages)
      ? saved.messages.filter(isMessage).slice(-30)
      : [];
    if (messages.length === 0) return serverSession;
    return {
      messages,
      intake:
        saved.intake && typeof saved.intake === "object"
          ? { ...emptyIntake(), ...saved.intake }
          : emptyIntake(),
      suggestions: Array.isArray(saved.suggestions)
        ? saved.suggestions.filter((item) => typeof item === "string").slice(0, 4)
        : openingSuggestions,
    };
  } catch {
    return serverSession;
  }
}

export function Desk() {
  const session = useSyncExternalStore(subscribe, getSession, () => serverSession);
  const { messages, intake, suggestions } = session;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const idRef = useRef(1);
  const lockRef = useRef(false);
  const sendRef = useRef<(text: string) => void>(() => {});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sendRef.current = (text: string) => {
      void send(text);
    };
  });

  useEffect(() => {
    function onOpen(event: Event) {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      setOpen(true);
      if (prompt?.trim()) sendRef.current(prompt.trim());
    }
    window.addEventListener("cw-open-desk", onOpen);
    return () => window.removeEventListener("cw-open-desk", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || lockRef.current) return;
    lockRef.current = true;
    setError("");
    setPending(true);
    const previous = getSession();
    const visitorId = `m-${idRef.current++}`;
    const visitor: DeskMessage = { id: visitorId, role: "visitor", text: trimmed };
    const nextMessages = [...previous.messages, visitor];
    writeSession({ ...previous, messages: nextMessages });
    setDraft("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            text: message.text,
          })),
          intake: previous.intake,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        text?: string;
        cards?: ChatCard[];
        suggestions?: string[];
        intake?: IntakeDraft;
        error?: string;
      } | null;
      if (!response.ok || !data?.text || !data.intake) {
        throw new Error(data?.error || "The desk didn't answer.");
      }
      writeSession({
        messages: [
          ...nextMessages,
          {
            id: `m-${idRef.current++}`,
            role: "desk",
            text: data.text,
            cards: Array.isArray(data.cards) ? data.cards : [],
          },
        ],
        intake: data.intake,
        suggestions: Array.isArray(data.suggestions)
          ? data.suggestions.filter((item) => typeof item === "string").slice(0, 4)
          : [],
      });
    } catch (caught) {
      writeSession(previous);
      setDraft(trimmed);
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : `The desk didn't answer. Call ${firm.phone} or try again.`,
      );
    } finally {
      lockRef.current = false;
      setPending(false);
    }
  }

  function startOver() {
    writeSession(serverSession);
    setDraft("");
    setError("");
  }

  return (
    <>
      {!open && (
        <Button
          type="button"
          size="lg"
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 h-12 rounded-full px-5 shadow-[0_12px_40px_-16px_rgba(60,24,28,0.55)]"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          Ask the desk
        </Button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:w-[26rem] data-[side=right]:sm:max-w-[26rem]"
        >
          <SheetHeader className="shrink-0 border-b border-border bg-card pr-12">
            <p className="text-[0.68rem] tracking-[0.18em] text-primary uppercase">
              Calder & Wren
            </p>
            <SheetTitle className="font-heading text-2xl">The desk</SheetTitle>
            <SheetDescription>
              Wren answers from the firm&apos;s own facts. Not legal advice.
            </SheetDescription>
          </SheetHeader>
          <div
            className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            <ol className="space-y-4">
              {messages.map((message) => (
                <li key={message.id}>
                  <MessageView message={message} />
                </li>
              ))}
            </ol>
            {pending && (
              <p className="mt-4 text-sm text-muted-foreground">Wren is writing…</p>
            )}
            <div ref={endRef} />
          </div>
          {suggestions.length > 0 && (
            <div className="flex shrink-0 flex-wrap gap-2 border-t border-border px-4 py-3">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  className="h-8 bg-card"
                  disabled={pending}
                  onClick={() => void send(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
          <form
            className="shrink-0 border-t border-border bg-background p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            {error && (
              <p role="alert" className="mb-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex items-end gap-2">
              <label className="sr-only" htmlFor="desk-message">
                Message to the desk
              </label>
              <Textarea
                ref={inputRef}
                id="desk-message"
                name="desk-message"
                value={draft}
                rows={2}
                maxLength={2000}
                placeholder={placeholderFor(intake.phase)}
                disabled={pending}
                className="max-h-32 min-h-12 flex-1 bg-card"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(draft);
                  }
                }}
              />
              <Button
                type="submit"
                className="h-11 px-4"
                disabled={pending || draft.trim().length === 0}
              >
                Send
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Enter to send. Shift+Enter for a new line.</span>
              <button type="button" className="underline underline-offset-4" onClick={startOver}>
                Start over
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MessageView({ message }: { message: DeskMessage }) {
  const paragraphs = message.text.split("\n\n");
  if (message.role === "visitor") {
    return (
      <div className="ml-10 rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-6 text-primary-foreground">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-wrap">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="mr-6 border-l-2 border-primary pl-3">
      <p className="text-[0.68rem] tracking-[0.16em] text-primary uppercase">Wren</p>
      <div className="mt-1 space-y-2 text-sm leading-6">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-wrap">
            {paragraph}
          </p>
        ))}
      </div>
      {message.cards?.map((card) => (
        <CardView key={cardKey(card)} card={card} />
      ))}
    </div>
  );
}

function CardView({ card }: { card: ChatCard }) {
  if (card.kind === "confirmation") {
    return (
      <div className="mt-3 border border-primary/30 bg-primary/5 px-3 py-3">
        <p className="text-[0.68rem] tracking-[0.16em] text-primary uppercase">
          {card.title}
        </p>
        <p className="font-heading text-3xl tracking-tight">{card.reference}</p>
      </div>
    );
  }

  if (card.kind === "office") {
    return (
      <div className="mt-3 border border-border bg-card px-3 py-3">
        <p className="font-heading text-lg">{card.title}</p>
        {card.lines.map((line) => (
          <p key={line} className="text-sm">
            {line}
          </p>
        ))}
      </div>
    );
  }

  const href = safeHref(card.href);
  if (!href) return null;
  const title = card.kind === "practice" ? card.title : card.name;
  const detail = card.kind === "practice" ? card.blurb : `${card.role} · ${card.focus}`;

  return (
    <Link
      href={href}
      className="mt-3 block border border-border bg-card px-3 py-3 transition-colors hover:border-primary"
    >
      <p className="font-heading text-lg leading-tight">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </Link>
  );
}

function placeholderFor(phase: IntakeDraft["phase"]): string {
  switch (phase) {
    case "name":
      return "First and last name";
    case "email":
      return "Email address";
    case "phone":
      return "Phone number, or skip";
    case "summary":
      return "What happened, in a sentence or two";
    case "timing":
      return "Today, this week, next week…";
    case "contact":
      return "Call or email";
    case "confirm":
      return "Yes, or say what to change";
    default:
      return "Ask about the firm";
  }
}

function safeHref(href: string): string | null {
  if (/^\/(?:practices|attorneys)\/[a-z0-9-]+$/.test(href)) return href;
  return null;
}

function cardKey(card: ChatCard): string {
  if (card.kind === "confirmation") return card.reference;
  if (card.kind === "office") return card.title;
  return `${card.kind}-${card.slug}`;
}

function isMessage(value: unknown): value is DeskMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as DeskMessage;
  return (
    (message.role === "visitor" || message.role === "desk") &&
    typeof message.id === "string" &&
    typeof message.text === "string" &&
    message.text.length > 0 &&
    message.text.length <= 4000
  );
}
