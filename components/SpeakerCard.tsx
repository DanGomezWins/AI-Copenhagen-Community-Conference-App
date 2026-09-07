import Link from "next/link";
import Avatar from "@/components/Avatar";

export type SpeakerProfile = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  role: string | null;
  company: string | null;
};

/**
 * One person on stage, linking to their profile.
 *
 * Pulled out of the session page because the closing keynote has three
 * speakers, and a session with two names on it should not have to choose which
 * one gets a card.
 */
export default function SpeakerCard({
  speaker,
  sessionId,
}: {
  speaker: SpeakerProfile;
  sessionId: string;
}) {
  return (
    <Link
      // Carry where we are, so Back on their profile returns to this session
      // rather than dumping you in the directory.
      href={`/people/${speaker.id}?from=session&session=${sessionId}`}
      className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] p-3.5"
    >
      <Avatar
        firstName={speaker.first_name}
        lastName={speaker.last_name}
        photoUrl={speaker.photo_url}
        size={52}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">
          {speaker.first_name} {speaker.last_name}
        </span>
        <span className="block truncate text-sm text-[var(--color-muted)]">
          {[speaker.role, speaker.company].filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className="shrink-0 text-sm text-[var(--color-accent)]">View ↗</span>
    </Link>
  );
}
