import type { TrackKey } from "./program";

/** Keeps the feed scannable on a phone. Long enough for a real message. */
export const POST_MAX = 500;

export type PostKind = "info" | "alert" | "schedule_change" | "auto";

export type Post = {
  id: string;
  body: string;
  kind: PostKind;
  track: TrackKey | null;
  author_id: string | null;
  session_id: string | null;
  edited: boolean;
  image_url: string | null;
  link_url: string | null;
  created_at: string;
  updated_at: string | null;
};

export type PostWithAuthor = Post & {
  author: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
};

const TZ = "Europe/Copenhagen";

export function postTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ, hour12: false,
  }).format(new Date(iso));
}

/** Short relative age — the feed is read at a glance, mid-corridor. */
export function relativeAge(iso: string, now: Date = new Date()): string {
  const secs = Math.floor((now.getTime() - new Date(iso).getTime()) / 1000);
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return postTime(iso);
}

export const KIND_STYLE: Record<PostKind, { label: string | null; className: string }> = {
  info: { label: null, className: "border-[var(--color-line)]" },
  alert: {
    label: "Alert",
    className: "border-amber-500/50 bg-amber-500/5",
  },
  schedule_change: {
    label: "Schedule change",
    className: "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/5",
  },
  auto: { label: "Automatic", className: "border-[var(--color-line)]" },
};
