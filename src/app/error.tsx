"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { firm } from "@/lib/firm";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error.digest ?? "page failed to render");
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
      <h1 className="font-heading text-4xl tracking-tight">This page didn&apos;t load.</h1>
      <p className="mt-4 text-muted-foreground">
        Try it again, or call the office at {firm.phone}. The desk is still available from the button on this page.
      </p>
      <Button type="button" className="mt-6 h-11 px-4" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
