"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function openDesk(prompt?: string) {
  window.dispatchEvent(
    new CustomEvent("cw-open-desk", { detail: { prompt } }),
  );
}

export function OpenDesk({
  children,
  prompt,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  prompt?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="lg"
      className={cn("h-11 px-4", className)}
      onClick={() => openDesk(prompt)}
    >
      {children}
    </Button>
  );
}
