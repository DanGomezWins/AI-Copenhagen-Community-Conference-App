import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  subject: "app" | "session";
  stars: number;
  comment: string | null;
  session_id: string | null;
  created_at: string;
};

function Stars({ n }: { n: number }) {
  return (
    <span className="whitespace-nowrap text-[var(--color-accent)]" aria-label={`${n} out of 5`}>
      {"★".repeat(n)}
      <span className="text-[var(--color-line)]">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function average(rows: { stars: number }[]): string {
  if (!rows.length) return "—";
  return (rows.reduce((a, r) => a + r.stars, 0) / rows.length).toFixed(1);
}

export default async function FeedbackPage() {
  const admin = createAdminClient();

  const [{ data: ratings }, { data: sessions }] = await Promise.all([
    admin.from("ratings").select("id, subject, stars, comment, session_id, created_at")
      .order("created_at", { ascending: false }),
    admin.from("sessions").select("id, title, speaker_name"),
  ]);

  const rows = (ratings ?? []) as Row[];
  const titles = new Map((sessions ?? []).map((s) => [s.id, s]));

  const app = rows.filter((r) => r.subject === "app");
  const sessionRows = rows.filter((r) => r.subject === "session");

  // Per-session summary, busiest first.
  const bySession = new Map<string, Row[]>();
  for (const r of sessionRows) {
    if (!r.session_id) continue;
    bySession.set(r.session_id, [...(bySession.get(r.session_id) ?? []), r]);
  }
  const summary = [...bySession.entries()]
    .map(([id, rs]) => ({ id, rs, avg: average(rs) }))
    .sort((a, b) => b.rs.length - a.rs.length);

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Ratings are anonymous. Who left them is not recorded here and cannot be
        looked up — people were told it was anonymous, so it is.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--color-line)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            The app
          </p>
          <p className="mt-1 text-2xl font-bold">{average(app)}</p>
          <p className="text-xs text-[var(--color-muted)]">{app.length} rating(s)</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Sessions
          </p>
          <p className="mt-1 text-2xl font-bold">{average(sessionRows)}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {sessionRows.length} rating(s) across {bySession.size}
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        The app
      </h2>
      <Table rows={app} />

      {summary.length > 0 && (
        <>
          <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            By session
          </h2>
          {summary.map(({ id, rs, avg }) => {
            const s = titles.get(id);
            return (
              <div key={id} className="mt-4">
                <p className="text-sm font-medium">
                  {s?.title ?? "Unknown session"}{" "}
                  <span className="font-normal text-[var(--color-muted)]">
                    {avg} · {rs.length} rating(s)
                  </span>
                </p>
                {s?.speaker_name && (
                  <p className="text-xs text-[var(--color-muted)]">{s.speaker_name}</p>
                )}
                <Table rows={rs} />
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}

function Table({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="mt-2 rounded-lg border border-dashed border-[var(--color-line)] p-4 text-sm text-[var(--color-muted)]">
        Nothing yet.
      </p>
    );
  }
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-line)] text-left">
            <th className="w-24 py-2 pr-3 font-medium text-[var(--color-muted)]">Rating</th>
            <th className="py-2 font-medium text-[var(--color-muted)]">Feedback</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[var(--color-line)] align-top">
              <td className="py-2.5 pr-3"><Stars n={r.stars} /></td>
              <td className="py-2.5 whitespace-pre-wrap">
                {r.comment || <span className="text-[var(--color-muted)]">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
