"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileFormState } from "./actions";

type Profile = {
  first_name?: string | null;
  last_name?: string | null;
  is_speaker?: boolean | null;
  company?: string | null;
  role?: string | null;
  linkedin_url?: string | null;
  public_email?: string | null;
};

const field =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]";

export default function ProfileForm({
  profile,
  prefilled,
}: {
  profile: Profile;
  prefilled: boolean;
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    saveProfile,
    {},
  );

  return (
    <form action={action} className="mt-6 space-y-5">
      {prefilled && (
        <p className="rounded-lg bg-[var(--color-accent)]/10 px-3 py-2 text-sm">
          We found your registration and filled in what we could. Check it over.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium">First name</label>
          <input id="first_name" name="first_name" required defaultValue={profile.first_name ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium">Last name</label>
          <input id="last_name" name="last_name" required defaultValue={profile.last_name ?? ""} className={field} />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">I am attending as</legend>
        <div className="mt-2 flex gap-2">
          {[
            { value: "guest", label: "Guest" },
            { value: "speaker", label: "Speaker" },
          ].map((opt) => (
            <label key={opt.value} className="flex-1">
              <input
                type="radio"
                name="is_speaker"
                value={opt.value}
                defaultChecked={
                  opt.value === (profile.is_speaker ? "speaker" : "guest")
                }
                className="peer sr-only"
              />
              <span className="block cursor-pointer rounded-lg border border-[var(--color-line)] px-3 py-2.5 text-center text-sm peer-checked:border-[var(--color-accent)] peer-checked:text-[var(--color-accent)]">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="company" className="block text-sm font-medium">
          Company <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <input id="company" name="company" defaultValue={profile.company ?? ""} className={field} />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium">
          Role <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <input id="role" name="role" defaultValue={profile.role ?? ""} className={field} />
      </div>

      <div>
        <label htmlFor="linkedin_url" className="block text-sm font-medium">
          LinkedIn <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <input
          id="linkedin_url"
          name="linkedin_url"
          inputMode="url"
          placeholder="linkedin.com/in/yourname"
          defaultValue={profile.linkedin_url ?? ""}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="public_email" className="block text-sm font-medium">
          Contact email <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <input
          id="public_email"
          name="public_email"
          type="email"
          inputMode="email"
          defaultValue={profile.public_email ?? ""}
          className={field}
        />
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Shown to other attendees. Leave blank to keep it private.
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      {state.ok && <p className="text-sm text-green-600" role="status">Profile saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>

      <p className="text-center text-xs text-[var(--color-muted)]">
        Your profile appears in the Networking directory for other attendees.
      </p>
    </form>
  );
}
