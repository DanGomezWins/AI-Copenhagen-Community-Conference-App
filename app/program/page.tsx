const TRACKS = ["Main stage", "Demos", "Open sessions"] as const;

export default function ProgramPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Program</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Thursday 10 September · twoday København
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TRACKS.map((track, i) => (
          <span
            key={track}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
              i === 0
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-[var(--color-line)] text-[var(--color-muted)]"
            }`}
          >
            {track}
          </span>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-[var(--color-line)] p-6">
        <p className="text-sm text-[var(--color-muted)]">
          Three-track schedule lands in days 3–5.
        </p>
      </div>
    </section>
  );
}
