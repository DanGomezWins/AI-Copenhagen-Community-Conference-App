import { createClient } from "@/lib/supabase/server";
import { getPrefill, signOut } from "./actions";
import ProfileForm from "./ProfileForm";
import PhotoUpload from "./PhotoUpload";
import PushPrompt from "@/components/PushPrompt";

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

      {profile && (
        <PhotoUpload
          userId={user!.id}
          firstName={profile.first_name ?? ""}
          lastName={profile.last_name ?? ""}
          photoUrl={profile.photo_url ?? null}
        />
      )}

      <ProfileForm
        profile={profile ?? prefill ?? {}}
        prefilled={Boolean(!profile && prefill)}
      />

      {!profile && (
        <p className="mt-6 text-xs text-[var(--color-muted)]">
          You can add a photo once your profile is saved.
        </p>
      )}

      {profile && <PushPrompt />}

      <form action={signOut} className="mt-8">
        <button type="submit" className="text-sm text-[var(--color-muted)] underline">
          Sign out
        </button>
      </form>
    </section>
  );
}
