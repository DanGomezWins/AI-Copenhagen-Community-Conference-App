import { createClient } from "@/lib/supabase/server";
import { removeOrganiser } from "@/app/actions/organisers";
import OrganiserForm from "./OrganiserForm";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function OrganisersPage() {
  const supabase = await createClient();
  const [{ data: organisers }, { data: { user } }] = await Promise.all([
    supabase.from("organisers").select("email, note").order("email"),
    supabase.auth.getUser(),
  ]);

  const me = user?.email?.toLowerCase();

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Who can post</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Organisers can post updates, edit the schedule, and add other organisers.
        Add someone before the day starts so they aren’t waiting on a sign-in email.
      </p>

      <ul className="mt-6 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
        {(organisers ?? []).map((o) => (
          <li key={o.email} className="flex items-center justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{o.email}</p>
              {o.note && (
                <p className="truncate text-xs text-[var(--color-muted)]">{o.note}</p>
              )}
            </div>
            {o.email.toLowerCase() === me ? (
              <span className="shrink-0 text-xs text-[var(--color-muted)]">You</span>
            ) : (
              <form action={removeOrganiser}>
                <input type="hidden" name="email" value={o.email} />
                <SubmitButton
                  className="shrink-0 text-xs font-medium text-[var(--color-danger-ink)]"
                  pendingLabel="Removing…"
                >
                  Remove
                </SubmitButton>
              </form>
            )}
          </li>
        ))}
      </ul>

      <OrganiserForm />
    </section>
  );
}
