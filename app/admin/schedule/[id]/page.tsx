import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SessionForm from "../SessionForm";
import type { Session } from "@/lib/program";

export const dynamic = "force-dynamic";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Edit session</h1>
      <SessionForm session={data as Session} />
    </section>
  );
}
