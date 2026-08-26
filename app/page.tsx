export default function FeedPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Feed</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Live updates from the organisers.
      </p>
      <Placeholder phase="3–5" what="Realtime feed and organiser posting" />
    </section>
  );
}

function Placeholder({ phase, what }: { phase: string; what: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-[var(--color-line)] p-6">
      <p className="text-sm text-[var(--color-muted)]">
        {what} lands in days {phase}.
      </p>
    </div>
  );
}
