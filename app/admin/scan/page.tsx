import { createClient } from "@/lib/supabase/server";
import ScanFlow from "./ScanFlow";
import type { Session } from "@/lib/program";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("track", "open")
    .order("starts_at", { ascending: true });

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Scan the board</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Photograph the Open Sessions board and publish what changed.
      </p>
      <ScanFlow existing={(data ?? []) as Session[]} />
    </section>
  );
}
