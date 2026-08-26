import { createClient } from "@/lib/supabase/server";
import { getPrefill, signOut } from "./actions";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  // Only reach into the allowlist when there's nothing to show yet.
  const prefill = profile ? null : await getPrefill();

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">
        {welcome && !profile ? "Welcome — set up your profile" : "Your profile"}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Signed in as {user?.email}
      </p>

      <ProfileForm
        profile={profile ?? prefill ?? {}}
        prefilled={Boolean(!profile && prefill)}
      />

      <form action={signOut} className="mt-8">
        <button type="submit" className="text-sm text-[var(--color-muted)] underline">
          Sign out
        </button>
      </form>
    </section>
  );
}
