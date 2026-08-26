export const TRACKS = [
  { key: "main", label: "Main stage", room: "Auditorium" },
  { key: "demos", label: "Demos", room: "Room 2" },
  { key: "open", label: "Open sessions", room: "Room 3" },
] as const;

export type TrackKey = (typeof TRACKS)[number]["key"];

export function isTrackKey(v: string | undefined): v is TrackKey {
  return TRACKS.some((t) => t.key === v);
}

export type Session = {
  id: string;
  track: TrackKey;
  title: string;
  speaker_name: string | null;
  speaker_profile_id: string | null;
  starts_at: string;
  ends_at: string | null;
  room: string | null;
  status: "scheduled" | "cancelled";
  notes: string | null;
};

const TZ = "Europe/Copenhagen";

/** Wall-clock time at the venue, regardless of the viewer's device timezone. */
export function timeAt(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
    hour12: false,
  }).format(new Date(iso));
}

export function timeRange(start: string, end: string | null): string {
  return end ? `${timeAt(start)}–${timeAt(end)}` : timeAt(start);
}

/** A row with no speaker is day structure — registration, breaks, lunch. */
export function isStructural(s: Session): boolean {
  return !s.speaker_name;
}

export type Liveness = "past" | "now" | "next" | "upcoming";

/**
 * Marks what is happening now and what is immediately next, so the program
 * is useful at a glance while standing in a corridor.
 */
export function liveness(sessions: Session[], at: Date = new Date()): Map<string, Liveness> {
  const out = new Map<string, Liveness>();
  const t = at.getTime();
  let nextId: string | null = null;
  let nextStart = Infinity;

  for (const s of sessions) {
    const start = new Date(s.starts_at).getTime();
    const end = s.ends_at ? new Date(s.ends_at).getTime() : start + 25 * 60_000;

    if (t >= start && t < end) {
      out.set(s.id, "now");
    } else if (t >= end) {
      out.set(s.id, "past");
    } else {
      out.set(s.id, "upcoming");
      if (start < nextStart) { nextStart = start; nextId = s.id; }
    }
  }
  if (nextId && !Array.from(out.values()).includes("now")) out.set(nextId, "next");
  return out;
}
