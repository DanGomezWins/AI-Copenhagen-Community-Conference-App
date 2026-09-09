import Link from "next/link";
import AnnouncerToggle from "./AnnouncerToggle";
import RatingNudgeToggle from "./RatingNudgeToggle";
import AppRatingNudgeToggle from "./AppRatingNudgeToggle";
import { SCAN_ENABLED } from "@/lib/scan/enabled";

type Item = {
  href: string;
  title: string;
  desc: string;
  soon?: boolean;
  /** Leaves the app, so it opens in a new tab and says so. */
  external?: boolean;
};

const ITEMS: Item[] = [
  { href: "/post", title: "Post an update", desc: "Goes to every attendee's feed instantly, badged as official." },
  { href: "/admin/schedule", title: "Edit the schedule", desc: "Change a time, room or speaker. Posts the notice for you." },
  // Retired with Open Sessions moving off-app — see lib/scan/enabled.ts.
  ...(SCAN_ENABLED
    ? [{ href: "/scan", title: "Scan the board", desc: "Photograph the open sessions board. Attendees can do this too." }]
    : []),
  { href: "/admin/organisers", title: "Who can post", desc: "Add or remove organisers." },
  { href: "/admin/feedback", title: "Ratings & feedback", desc: "What people said about the app and each session." },
  { href: "/admin/test", title: "Testing tools", desc: "Rehearse the announcer and notifications before the day." },
  {
    href: "https://docs.google.com/spreadsheets/d/1Ue1NwcqE1K3hnlv3El-tDxI7ShLAvTZYoAPH9b-ldmc/edit?gid=0#gid=0",
    title: "AIMC CC speaker overview",
    desc: "The working sheet: who is speaking, their title, company and talk.",
    external: true,
  },
];

export default async function AdminHub() {
  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Organiser</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Everything here is visible to attendees the moment you save it.
      </p>

      <AnnouncerToggle />
      <RatingNudgeToggle />
      <AppRatingNudgeToggle />

      <ul className="mt-6 space-y-3">
        {ITEMS.map((i) => (
          <li key={i.href}>
            {i.soon ? (
              <div className="rounded-xl border border-dashed border-[var(--color-line)] p-4 opacity-55">
                <p className="font-semibold">{i.title}</p>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">{i.desc}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">Not built yet</p>
              </div>
            ) : i.external ? (
              <a
                href={i.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-[var(--color-line)] p-4"
              >
                <p className="font-semibold text-[var(--color-accent)]">
                  {i.title} ↗
                </p>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">{i.desc}</p>
              </a>
            ) : (
              <Link
                href={i.href}
                className="block rounded-xl border border-[var(--color-line)] p-4"
              >
                <p className="font-semibold">{i.title}</p>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">{i.desc}</p>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
