"use client";

import { useActionState } from "react";
import { addOrganiser, type OrganiserFormState } from "@/app/actions/organisers";

export default function OrganiserForm() {
  const [state, action, pending] = useActionState<OrganiserFormState, FormData>(
    addOrganiser,
    {},
  );

  return (
    <form action={action} className="mt-6 space-y-3">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="off"
          placeholder="helper@example.com"
          className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]"
        />
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Must match the address they sign in with.
        </p>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium">
          Note <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <input
          id="note"
          name="note"
          placeholder="Demos room host"
          className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      {state.error && <p className="text-sm text-[var(--color-danger-ink)]" role="alert">{state.error}</p>}
      {state.ok && <p className="text-sm text-[var(--color-positive-ink)]" role="status">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add organiser"}
      </button>
    </form>
  );
}
