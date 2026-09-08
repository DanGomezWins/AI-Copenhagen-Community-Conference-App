/** Skeleton for the directory. See app/program/loading.tsx for why this is
 *  per-route rather than relying on the root loading file. */
export default function Loading() {
  return (
    <section aria-busy className="animate-pulse">
      <div className="h-7 w-40 rounded bg-[var(--color-raised)]" />
      <div className="mt-4 h-11 rounded-xl bg-[var(--color-raised)]" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] p-3.5"
          >
            <div className="size-11 shrink-0 rounded-full bg-[var(--color-raised)]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-[var(--color-raised)]" />
              <div className="h-3 w-3/4 rounded bg-[var(--color-raised)]" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading the directory…</span>
    </section>
  );
}
