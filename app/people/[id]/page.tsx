import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import { TRACKS, timeRange, type Session } from "@/lib/program";
import { nameKey } from "@/lib/names";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; track?: string }>;
}) {
  const { id } = await params;
  const { from, track } = await searchParams;
  const supabase = await createClient();

  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!profile) notFound();

  const fullName = `${profile.first_name} ${profile.last_name}`;

  // Sessions link by profile id where known; otherwise they are matched on the
  // speaker's name, since the programme and the open-sessions board both store
  // speakers as free text.
  const { data: allSessions } = await supabase
    .from("sessions")
    .select("*")
    .order("starts_at", { ascending: true });

  const key = nameKey(fullName);
  const sessions = ((allSessions ?? []) as Session[]).filter(
    (s) =>
      s.speaker_profile_id === id ||
      (s.speaker_name ? nameKey(s.speaker_name) === key : false),
  );

  const isMe = user?.id === profile.id;

  // Come back to where you actually were, rather than always to Networking.
  const back =
    from === "program"
      ? { href: `/program${track ? `?track=${track}` : ""}`, label: "Program" }
      : { href: "/people", label: "Networking" };

  return (
    <section>
      <Link href={back.href} className="text-sm text-[var(--color-muted)]">
        ← {back.label}
      </Link>

      <div className="mt-6 flex flex-col items-center text-center">
        <Avatar
          firstName={profile.first_name}
          lastName={profile.last_name}
          photoUrl={profile.photo_url}
          size={168}
        />
        <h1 className="mt-4 text-2xl font-bold leading-tight">{fullName}</h1>
        {(profile.role || profile.company) && (
          <p className="mt-1 text-[var(--color-muted)]">
            {[profile.role, profile.company].filter(Boolean).join(" · ")}
          </p>
        )}
        {profile.is_speaker && (
          <span className="mt-3 rounded-full bg-[var(--color-accent)]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
            Speaker
          </span>
        )}
      </div>

      {(profile.linkedin_url || profile.public_email) && (
        <div className="mt-8 space-y-2">
          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-[var(--color-line)] p-3.5"
            >
              <span className="text-sm font-medium text-[var(--color-accent)] underline underline-offset-2">
                LinkedIn
              </span>
              <span className="text-sm text-[var(--color-accent)]">Open ↗</span>
            </a>
          )}
          {profile.public_email && (
            <a
              href={`mailto:${profile.public_email}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-3.5"
            >
              <span className="shrink-0 text-sm font-medium text-[var(--color-accent)] underline underline-offset-2">
                Email
              </span>
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
              <li key={s.id}>
                <Link
                  href={`/program?track=${s.track}`}
                  className="block rounded-xl border border-[var(--color-line)] p-3.5"
                >
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
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isMe && (
        <Link
          href="/me"
          className="mt-8 block rounded-lg border border-[var(--color-line)] px-4 py-3 text-center text-sm font-medium"
        >
          Edit my profile
        </Link>
      )}
    </section>
  );
}
