import type { ProposedSession } from "./schema";
import { timeAt, timeToIso, type Session } from "@/lib/program";

export type DiffKind = "new" | "changed" | "unchanged" | "removed";

export type DiffRow = {
  kind: DiffKind;
  proposed: ProposedSession | null;
  existing: Session | null;
  /** Field-level changes, for "was X, now Y" display. */
  changes: { field: string; before: string; after: string }[];
};

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Matches a proposed row to an existing session.
 *
 * Time is the anchor, not title: on a handwritten board a title gets rewritten
 * far more often than a slot moves, and two sessions never share a slot on one
 * track. Falling back to title match catches the case where a session was
 * moved to a different time.
 */
function findMatch(p: ProposedSession, pool: Session[]): Session | null {
  const iso = timeToIso(p.start_time);
  const byTime = pool.find((s) => s.starts_at === iso);
  if (byTime) return byTime;

  const byTitle = pool.find((s) => norm(s.title) === norm(p.title));
  return byTitle ?? null;
}

export function buildDiff(
  proposed: ProposedSession[],
  existing: Session[],
): DiffRow[] {
  const rows: DiffRow[] = [];
  const claimed = new Set<string>();

  for (const p of proposed) {
    const pool = existing.filter((s) => !claimed.has(s.id));
    const match = findMatch(p, pool);

    if (!match) {
      rows.push({ kind: "new", proposed: p, existing: null, changes: [] });
      continue;
    }

    claimed.add(match.id);
    const changes: DiffRow["changes"] = [];

    if (norm(match.title) !== norm(p.title)) {
      changes.push({ field: "Title", before: match.title, after: p.title });
    }
    if (norm(match.speaker_name) !== norm(p.speaker_name)) {
      changes.push({
        field: "Speaker",
        before: match.speaker_name ?? "—",
        after: p.speaker_name ?? "—",
      });
    }
    if (timeAt(match.starts_at) !== p.start_time) {
      changes.push({
        field: "Time",
        before: timeAt(match.starts_at),
        after: p.start_time,
      });
    }
    if (norm(match.room) !== norm(p.room) && p.room) {
      changes.push({ field: "Room", before: match.room ?? "—", after: p.room });
    }

    rows.push({
      kind: changes.length ? "changed" : "unchanged",
      proposed: p,
      existing: match,
      changes,
    });
  }

  // Anything left unclaimed was on the board before and is not on it now.
  for (const s of existing) {
    if (!claimed.has(s.id)) {
      rows.push({ kind: "removed", proposed: null, existing: s, changes: [] });
    }
  }

  const order: Record<DiffKind, number> = { new: 0, changed: 1, removed: 2, unchanged: 3 };
  return rows.sort((a, b) => {
    if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
    const at = a.proposed?.start_time ?? (a.existing ? timeAt(a.existing.starts_at) : "");
    const bt = b.proposed?.start_time ?? (b.existing ? timeAt(b.existing.starts_at) : "");
    return at.localeCompare(bt);
  });
}

export function summarise(rows: DiffRow[]) {
  return {
    added: rows.filter((r) => r.kind === "new").length,
    changed: rows.filter((r) => r.kind === "changed").length,
    removed: rows.filter((r) => r.kind === "removed").length,
    unchanged: rows.filter((r) => r.kind === "unchanged").length,
    lowConfidence: rows.filter(
      (r) => r.proposed && r.proposed.confidence !== "high",
    ).length,
  };
}
