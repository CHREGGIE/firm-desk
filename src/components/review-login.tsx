"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewLogin({
  hint,
  label = "Review password",
  button = "Open the queue",
}: {
  hint: string;
  label?: string;
  button?: string;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/review/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setPending(false);
    if (!response.ok) {
      setError(response.status === 503 ? "The review password isn't set on this app yet." : "That password didn't work.");
      return;
    }
    window.location.reload();
  }

  return (
    <form className="max-w-sm" onSubmit={(event) => void onSubmit(event)}>
      <label className="block text-sm" htmlFor="review-password">
        {label}
        <Input
          id="review-password"
          className="mt-2"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {hint && (
        <p className="mt-3 text-sm text-muted-foreground">
          On this dev server the password is <span className="text-foreground">{hint}</span>.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-4 h-11 px-4" disabled={pending || password.length === 0}>
        {button}
      </Button>
    </form>
  );
}

export function ReviewLogout({ label = "Lock the queue" }: { label?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="text-sm underline underline-offset-4"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void fetch("/api/review/logout", { method: "POST" }).then(() => window.location.reload());
      }}
    >
      {label}
    </button>
  );
}
