"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { firm, practices } from "@/lib/firm";

type FieldErrors = Partial<Record<"name" | "email" | "phone" | "practice" | "summary" | "timing" | "contact", string>>;

const timings = ["As soon as you can", "This week", "Next week", "No rush"];

export function ConsultForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [practice, setPractice] = useState("");
  const [summary, setSummary] = useState("");
  const [timing, setTiming] = useState("This week");
  const [contact, setContact] = useState("email");
  const [fax, setFax] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [reference, setReference] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          practice,
          summary,
          timing,
          contact,
          fax,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        reference?: string;
        error?: string;
      } | null;
      if (!response.ok || !data?.reference) {
        throw new Error(data?.error || `We couldn't file that. Call ${firm.phone}.`);
      }
      setReference(data.reference);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : `We couldn't file that. Call ${firm.phone}.`,
      );
    } finally {
      setPending(false);
    }
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (name.trim().length < 3) next.name = "Add a first and last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "That email doesn't look right.";
    }
    const digits = phone.replace(/\D/g, "");
    if (phone.trim() && digits.length < 10) {
      next.phone = "Use a 10-digit phone number, or leave it blank.";
    }
    if (contact === "phone" && digits.length < 10) {
      next.phone = "Add a phone number if we should call.";
    }
    if (!practice) next.practice = "Choose the closest kind of matter.";
    if (summary.trim().length < 15) next.summary = "A sentence is enough, but we need one.";
    if (!timing) next.timing = "Choose a time.";
    if (!contact) next.contact = "Choose how we should reply.";
    return next;
  }

  if (reference) {
    return (
      <div className="border border-primary/30 bg-card px-5 py-8 sm:px-8">
        <p className="text-[0.68rem] tracking-[0.18em] text-primary uppercase">
          Message filed
        </p>
        <h2 className="mt-2 font-heading text-4xl tracking-tight">{reference}</h2>
        <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          {firm.consult.replyLine} We&apos;ll use {email.trim()}. This is not an
          engagement, and it is not confidential yet.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6 h-11 bg-background px-4"
          onClick={() => {
            setReference("");
            setSummary("");
          }}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative border border-border bg-card px-5 py-6 sm:px-8" noValidate>
      <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
        <label>
          Fax
          <input
            tabIndex={-1}
            autoComplete="off"
            value={fax}
            onChange={(event) => setFax(event.target.value)}
          />
        </label>
      </div>
      {formError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name} htmlFor="consult-name">
          <Input
            id="consult-name"
            name="name"
            autoComplete="name"
            value={name}
            aria-invalid={Boolean(errors.name)}
            className="h-11 bg-background"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Email" error={errors.email} htmlFor="consult-email">
          <Input
            id="consult-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={Boolean(errors.email)}
            className="h-11 bg-background"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Phone, if you want a call" error={errors.phone} htmlFor="consult-phone">
          <Input
            id="consult-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            aria-invalid={Boolean(errors.phone)}
            className="h-11 bg-background"
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
        <Field label="Matter" error={errors.practice} htmlFor="consult-practice">
          <select
            id="consult-practice"
            name="practice"
            value={practice}
            aria-invalid={Boolean(errors.practice)}
            className="h-11 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            onChange={(event) => setPractice(event.target.value)}
          >
            <option value="">Choose one</option>
            {practices.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
            <option value="unsure">I&apos;m not sure</option>
          </select>
        </Field>
      </div>
      <div className="mt-4">
        <Field label="What happened" error={errors.summary} htmlFor="consult-summary">
          <Textarea
            id="consult-summary"
            name="summary"
            value={summary}
            maxLength={1000}
            aria-invalid={Boolean(errors.summary)}
            placeholder="A few sentences. Leave out account numbers and medical details."
            className="min-h-28 bg-background"
            onChange={(event) => setSummary(event.target.value)}
          />
        </Field>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm">When should we reach you?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {timings.map((option) => (
            <label
              key={option}
              className={`cursor-pointer border px-3 py-2 text-sm ${
                timing === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background"
              }`}
            >
              <input
                type="radio"
                name="timing"
                value={option}
                checked={timing === option}
                className="sr-only"
                onChange={() => setTiming(option)}
              />
              {option}
            </label>
          ))}
        </div>
        {errors.timing && <p className="mt-1 text-sm text-destructive">{errors.timing}</p>}
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-sm">Reply by</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            ["email", "Email"],
            ["phone", "Phone"],
            ["either", "Either"],
          ].map(([value, label]) => (
            <label
              key={value}
              className={`cursor-pointer border px-3 py-2 text-sm ${
                contact === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background"
              }`}
            >
              <input
                type="radio"
                name="contact"
                value={value}
                checked={contact === value}
                className="sr-only"
                onChange={() => setContact(value)}
              />
              {label}
            </label>
          ))}
        </div>
        {errors.contact && <p className="mt-1 text-sm text-destructive">{errors.contact}</p>}
      </fieldset>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        {firm.consult.engagementLine} {firm.consult.privilegeLine}
      </p>
      <Button type="submit" className="mt-5 h-11 px-4" disabled={pending}>
        {pending ? "Sending…" : "Send to the desk"}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
