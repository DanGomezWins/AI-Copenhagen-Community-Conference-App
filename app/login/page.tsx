"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");

    const supabase = createClient();
    const redirect = new URL("/auth/callback", window.location.origin);
    redirect.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirect.toString() },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-xl border border-[var(--color-line)] p-6">
        <h2 className="font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this
          device — the link signs you straight in.
        </p>
        <button
          onClick={() => { setState("idle"); setMessage(""); }}
          className="mt-4 text-sm font-medium text-[var(--color-accent)]"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]"
        />
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Use the address you registered with. No password needed.
        </p>
      </div>

      {state === "error" && (
        <p className="text-sm text-red-600" role="alert">{message}</p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 font-medium text-white disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send sign-in link"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <section className="pt-8">
      <h1 className="text-2xl font-bold tracking-tight">AIC Info</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        AI Meetup Copenhagen Community Conference #1 · 10 September
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
