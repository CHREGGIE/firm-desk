export function Monogram({ name }: { name: string }) {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      aria-hidden
      className="flex size-14 shrink-0 items-center justify-center border border-border bg-card font-heading text-xl text-primary"
    >
      {letters}
    </span>
  );
}
