import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ScanFlow from "./ScanFlow";
import type { Session } from "@/lib/program";
import { nameKey } from "@/lib/names";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const supabase = await createClient();
  const [{ data }, { data: profiles }] = await Promise.all([
    supabase.from("sessions").select("*").eq("track", "open")
      .order("starts_at", { ascending: true }),
    supabase.from("profiles").select("id, first_name, last_name"),
  ]);

  // Sent to the client so a booker whose name matches nobody can be flagged
  // during review, rather than after publishing.
  const knownNames = (profiles ?? []).map((p) =>
    nameKey(`${p.first_name} ${p.last_name}`),
  );

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Scan the board</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Photograph the Open Sessions board and publish what changed. Anyone can
        do this — if you&rsquo;ve added your own session, snap the board and it
        goes live for everyone.
      </p>

      <div className="mt-4 rounded-xl border border-[var(--color-line)] p-4">
        <p className="text-sm font-medium">Each line on the board needs</p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
          <li>· Start time</li>
          <li>· End time</li>
          <li>· Session title</li>
          <li>· Your full name, spelled as it is on your profile</li>
        </ul>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          The name is how your session links back to you, so spell it the same way.
          No room needed — every open session is in the same room.
        </p>
      </div>

      <ScanFlow existing={(data ?? []) as Session[]} knownNames={knownNames} />

      <Link
        href="/program?track=open"
        className="mt-6 inline-block text-sm text-[var(--color-muted)] underline"
      >
        See the current Open Sessions
      </Link>
    </section>
  );
}
