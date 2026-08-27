import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import { EVENT } from "@/lib/event";

/**
 * Slim top bar: the event name, an Organiser link for organisers, and the
 * signed-in person's own avatar linking to their profile.
 *
 * The avatar exists because there is no Profile tab, and in testing "where do
 * I edit my own profile?" was not answerable without hunting through the
 * directory for yourself.
 */
export default async function AppHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: organiser }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, photo_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.rpc("is_organiser"),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-sm items-center gap-3 px-4 py-2.5">
        {/* Full name where there's room; the short form on a narrow phone,
            where the full title would crowd out the avatar and Organiser chip. */}
        <Link href="/" className="min-w-0 flex-1 font-bold tracking-tight">
          <span className="hidden truncate text-sm sm:inline">{EVENT.name}</span>
          <span className="truncate text-sm sm:hidden">{EVENT.short}</span>
        </Link>

        {organiser === true && (
          <Link
            href="/admin"
            className="rounded-full border border-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]"
          >
            Organiser
          </Link>
        )}

        <Link href="/me" aria-label="Your profile" className="shrink-0">
          {profile ? (
            <Avatar
              firstName={profile.first_name}
              lastName={profile.last_name}
              photoUrl={profile.photo_url}
              size={32}
            />
          ) : (
            <span className="rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white">
              Add profile
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
