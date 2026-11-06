"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { practices } from "@/lib/firm";

type Errors = Partial<Record<"company" | "name" | "email" | "opponent" | "summary" | "matter", string>>;

function draftId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function ConsultForm() {
  const [id] = useState(draftId);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("Owner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [matter, setMatter] = useState("contract");
  const [opponent, setOpponent] = useState("");
  const [place, setPlace] = useState("New York");
  const [deadline, setDeadline] = useState("None");
  const [stake, setStake] = useState("");
  const [summary, setSummary] = useState("");
  const [fax, setFax] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState("");

  function validate(): Errors {
    const next: Errors = {};
    if (company.trim().length < 2) next.company = "Add the company, or say it's in your name.";
    if (name.trim().length < 3) next.name = "Add a first and last name.";
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email.trim())) next.email = "That email doesn't look right.";
    if (opponent.trim().length < 2) next.opponent = "Name the other side, for the conflict check.";
    if (summary.trim().length < 40) next.summary = "A few sentences, so a lawyer can see the dispute.";
    if (!matter) next.matter = "Pick the closest kind of work.";
    return next;
  }

  async function onPick(list: FileList | null) {
    if (!list) return;
    setFormError("");
    for (const file of Array.from(list)) {
      const body = new FormData();
      body.set("draftId", id);
      body.set("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const data = (await response.json().catch(() => null)) as { filename?: string; error?: string } | null;
      if (!response.ok || !data?.filename) {
        setFormError(data?.error || "That file didn't save.");
        return;
      }
      setFiles((current) => [...current, data.filename!]);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0) return;
    setPending(true);
    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          name,
          email,
          phone,
          matter,
          opponent,
          place,
          deadline,
          stake,
          summary,
          docNote: files.length ? `Attached: ${files.join(", ")}` : "No papers attached on the form.",
          draftId: id,
          fax,
        }),
      });
      const data = (await response.json().catch(() => null)) as { reference?: string; status?: string; error?: string } | null;
      if (!response.ok || !data?.reference) throw new Error(data?.error || "The file didn't save.");
      setReference(data.reference);
      setStatus(data.status ?? "");
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "The file didn't save.");
    } finally {
      setPending(false);
    }
  }

  if (reference) {
    return (
      <div className="border border-primary/30 bg-primary/5 px-5 py-6">
        <p className="text-[0.68rem] tracking-[0.16em] text-primary uppercase">Filed</p>
        <p className="mt-2 font-heading text-4xl tracking-tight">{reference}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {status === "urgent"
            ? "Marked as a deadline."
            : status === "ready"
              ? "Marked ready for a lawyer to review."
              : "Marked thin. A name or a fact is still missing, and the lawyers can see that."}{" "}
          This does not hire the firm.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" noValidate onSubmit={(event) => void onSubmit(event)}>
      <Field label="Company" error={errors.company} htmlFor="company">
        <Input id="company" value={company} onChange={(event) => setCompany(event.target.value)} />
      </Field>
      <Field label="Your role" htmlFor="role">
        <Input id="role" value={role} onChange={(event) => setRole(event.target.value)} />
      </Field>
      <Field label="Your name" error={errors.name} htmlFor="name">
        <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Email" error={errors.email} htmlFor="email">
        <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Field label="Phone, if you want a call" htmlFor="phone">
        <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </Field>
      <Field label="What kind of work" error={errors.matter} htmlFor="matter">
        <select
          id="matter"
          className="h-11 w-full border border-input bg-card px-3 text-sm"
          value={matter}
          onChange={(event) => setMatter(event.target.value)}
        >
          {practices.map((practice) => (
            <option key={practice.slug} value={practice.slug}>
              {practice.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="The other side" error={errors.opponent} htmlFor="opponent">
        <Input id="opponent" value={opponent} onChange={(event) => setOpponent(event.target.value)} />
      </Field>
      <Field label="Where" htmlFor="place">
        <select
          id="place"
          className="h-11 w-full border border-input bg-card px-3 text-sm"
          value={place}
          onChange={(event) => setPlace(event.target.value)}
        >
          <option>New York</option>
          <option>New Jersey</option>
          <option>Somewhere else</option>
        </select>
      </Field>
      <Field label="Deadline" htmlFor="deadline">
        <Input id="deadline" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
      </Field>
      <Field label="What's at stake" htmlFor="stake">
        <Input id="stake" value={stake} onChange={(event) => setStake(event.target.value)} />
      </Field>
      <Field label="What happened" error={errors.summary} htmlFor="summary">
        <Textarea id="summary" value={summary} rows={5} onChange={(event) => setSummary(event.target.value)} />
      </Field>
      <Field label="Papers" htmlFor="papers">
        <input
          id="papers"
          className="block w-full text-sm file:mr-3 file:border file:border-border file:bg-card file:px-3 file:py-2"
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,application/pdf,image/*"
          onChange={(event) => void onPick(event.target.files)}
        />
        {files.length > 0 && <p className="mt-2 text-sm">{files.join(", ")}</p>}
      </Field>
      <input className="absolute -left-[9999px]" tabIndex={-1} autoComplete="off" aria-hidden="true" value={fax} onChange={(event) => setFax(event.target.value)} name="fax" />
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" className="h-11 px-4" disabled={pending}>
        {pending ? "Filing…" : "File it for review"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm" htmlFor={htmlFor}>
      {label}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </label>
  );
}
