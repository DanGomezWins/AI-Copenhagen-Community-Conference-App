/**
 * The three tracks ARE the three rooms — there are no separate room numbers.
 * `room` is kept equal to the label so the stored value stays human-readable,
 * but it is always derived from the track and is never entered by hand.
 */
export const TRACKS = [
  { key: "main", label: "Main stage", room: "Main stage" },
  { key: "demos", label: "Demos", room: "Demos" },
  { key: "open", label: "Open sessions", room: "Open sessions" },
] as const;

export function roomForTrack(track: TrackKey): string {
  return TRACKS.find((t) => t.key === track)!.room;
}

export type TrackKey = (typeof TRACKS)[number]["key"];

export function isTrackKey(v: string | undefined): v is TrackKey {
  return TRACKS.some((t) => t.key === v);
}

/**
 * The Program's fourth view. Not a track: it draws from every room and is
 * personal to the viewer, so it lives beside the tracks rather than among them.
 */
export const MY_SCHEDULE = "mine" as const;
export type ProgramView = TrackKey | typeof MY_SCHEDULE;

export function isProgramView(v: string | undefined): v is ProgramView {
  return v === MY_SCHEDULE || isTrackKey(v);
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
  description: string | null;
  slides_url: string | null;
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

// ---------------------------------------------------------------------------
// Editing helpers. The event is a single fixed day, so the admin UI collects
// a time only — a date picker on a phone for a date that cannot change is
// friction and an error source.
// ---------------------------------------------------------------------------

export const EVENT_DATE = "2026-09-10";
export const EVENT_UTC_OFFSET = "+02:00"; // CEST on 10 Sep 2026

/** "14:20" → full ISO timestamp at the venue. */
export function timeToIso(hhmm: string): string {
  return `${EVENT_DATE}T${hhmm}:00${EVENT_UTC_OFFSET}`;
}

/** ISO timestamp → "14:20" as an <input type="time"> value, in venue time. */
export function isoToTime(iso: string | null): string {
  if (!iso) return "";
  return timeAt(iso);
}

/** Human summary of what changed, for the feed notice. Null when nothing did. */
export function describeChange(
  before: Pick<Session, "title" | "starts_at" | "room" | "status">,
  after: Pick<Session, "title" | "starts_at" | "room" | "status">,
): string | null {
  if (before.status !== "cancelled" && after.status === "cancelled") {
    return `Cancelled: ${before.title} (${timeAt(before.starts_at)}${
      before.room ? `, ${before.room}` : ""
    })`;
  }

  const parts: string[] = [];
  const movedTime = before.starts_at !== after.starts_at;
  const movedRoom = before.room !== after.room;

  if (movedTime) parts.push(`now at ${timeAt(after.starts_at)} (was ${timeAt(before.starts_at)})`);
  if (movedRoom) parts.push(`now in ${after.room ?? "TBA"} (was ${before.room ?? "TBA"})`);

  if (parts.length === 0) return null; // title-only edits are not worth a broadcast
  return `Schedule change: ${after.title} is ${parts.join(", ")}.`;
}
