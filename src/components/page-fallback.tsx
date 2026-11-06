export function PageFallback({ label }: { label: string }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <p className="text-[0.68rem] tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-4 h-12 w-2/3 max-w-lg animate-pulse bg-muted" />
      <div className="mt-6 h-4 w-full max-w-xl animate-pulse bg-muted" />
      <p className="mt-6 text-sm text-muted-foreground">Opening the page…</p>
    </main>
  );
}
