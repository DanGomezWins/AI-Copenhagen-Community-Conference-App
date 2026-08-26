import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Directory, { type DirectoryPerson } from "./Directory";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const supabase = await createClient();

  const [{ data: people }, { data: { user } }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, is_speaker, company, role, photo_url")
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const list = (people ?? []) as DirectoryPerson[];
  const hasProfile = list.some((p) => p.id === user?.id);

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Networking</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Speakers and attendees who’ve added a profile.
      </p>

      {!hasProfile && (
        <div className="mt-4 rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 p-4">
          <p className="text-sm font-medium">You’re not listed yet</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Add a profile so other attendees can find you.
          </p>
          <Link
            href="/me"
            className="mt-3 inline-block rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-white"
          >
            Add my profile
          </Link>
        </div>
      )}

      <Directory people={list} />
    </section>
  );
}
