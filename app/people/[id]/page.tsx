import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import { TRACKS, timeRange, type Session } from "@/lib/program";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!profile) notFound();

  const fullName = `${profile.first_name} ${profile.last_name}`;

  // Sessions are linked by profile id where known, and otherwise matched on the
  // speaker's name — the real programme will be imported as free text long
  // before those people ever sign in.
  const { data: sessionRows } = await supabase
    .from("sessions")
    .select("*")
    .or(`speaker_profile_id.eq.${id},speaker_name.eq.${fullName}`)
    .order("starts_at", { ascending: true });

  const sessions = (sessionRows ?? []) as Session[];
  const isMe = user?.id === profile.id;

  return (
    <section>
      <Link href="/people" className="text-sm text-[var(--color-muted)]">
        ← Networking
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <Avatar
          firstName={profile.first_name}
          lastName={profile.last_name}
          photoUrl={profile.photo_url}
          size={72}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight">{fullName}</h1>
          {(profile.role || profile.company) && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {[profile.role, profile.company].filter(Boolean).join(" · ")}
            </p>
          )}
          {profile.is_speaker && (
            <span className="mt-2 inline-block rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              Speaker
            </span>
          )}
        </div>
      </div>

      {(profile.linkedin_url || profile.public_email) && (
        <div className="mt-6 space-y-2">
          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-[var(--color-line)] p-3.5"
            >
              <span className="text-sm font-medium">LinkedIn</span>
              <span className="text-sm text-[var(--color-accent)]">Open ↗</span>
            </a>
          )}
          {profile.public_email && (
            <a
              href={`mailto:${profile.public_email}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-3.5"
            >
              <span className="shrink-0 text-sm font-medium">Email</span>
              <span className="truncate text-sm text-[var(--color-accent)]">
                {profile.public_email}
              </span>
            </a>
          )}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {sessions.length === 1 ? "Session" : "Sessions"}
          </h2>
          <ul className="mt-2 space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="rounded-xl border border-[var(--color-line)] p-3.5">
                <p className="font-mono text-xs tabular-nums text-[var(--color-muted)]">
                  {timeRange(s.starts_at, s.ends_at)}
                </p>
                <p
                  className={`mt-1 font-medium leading-snug ${
                    s.status === "cancelled" ? "line-through opacity-60" : ""
                  }`}
                >
                  {s.title}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {TRACKS.find((t) => t.key === s.track)?.label}
                  {s.room ? ` · ${s.room}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isMe && (
        <Link
          href="/me"
          className="mt-8 inline-block text-sm font-medium text-[var(--color-accent)]"
        >
          Edit my profile
        </Link>
      )}
    </section>
  );
}
