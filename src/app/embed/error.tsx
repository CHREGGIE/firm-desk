"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function EmbedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error.digest ?? "desk failed to render");
  }, [error]);

  return (
    <div className="flex h-dvh flex-col justify-center bg-background px-5">
      <p className="font-heading text-3xl tracking-tight">The desk didn&apos;t load.</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Try again. If it keeps failing, call the office during business hours.
      </p>
      <Button type="button" className="mt-6 h-11 w-fit px-4" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
