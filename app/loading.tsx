/**
 * Shown while a route segment streams in. The PWA previously showed a bare
 * white screen on cold launch, which reads as "broken" rather than "loading".
 */
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="size-8 animate-spin rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-accent)]" />
      <p className="mt-4 text-sm text-[var(--color-muted)]">Loading…</p>
    </div>
  );
}
