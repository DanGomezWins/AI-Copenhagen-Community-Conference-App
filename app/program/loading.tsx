/**
 * Skeleton for the Program while its data loads.
 *
 * A route-level loading file is what lets Next show something the instant a
 * tab is tapped. The root loading.tsx cannot: at the root segment the router
 * does not yet know which child is rendering, so it waits for the server
 * before it can show anything — measured at 0.6-1.1s of a completely
 * unchanged screen, which reads as a tap that did not register.
 */
export default function Loading() {
  return (
    <section aria-busy className="animate-pulse">
      <div className="h-7 w-32 rounded bg-[var(--color-raised)]" />
      <div className="mt-4 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 flex-1 rounded-full bg-[var(--color-raised)]" />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[4.5rem] rounded-xl border border-[var(--color-line)] bg-[var(--color-raised)]"
          />
        ))}
      </div>
      <span className="sr-only">Loading the programme…</span>
    </section>
  );
}
