"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EVENT } from "@/lib/event";

const DEV_SIGNIN = process.env.NEXT_PUBLIC_ENABLE_DEV_SIGNIN === "true";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const urlError = params.get("error");

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const address = email.trim().toLowerCase();

    // Dev mode: sign in directly, no email round-trip. Still a real session.
    if (DEV_SIGNIN) {
      const url = new URL("/dev/signin", window.location.origin);
      url.searchParams.set("email", address);
      url.searchParams.set("next", next);
      window.location.href = url.toString();
      return;
    }

    const supabase = createClient();
    const redirect = new URL("/auth/callback", window.location.origin);
    redirect.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOtp({
      email: address,
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
      {DEV_SIGNIN && (
        <p className="rounded-lg border border-[var(--color-danger)]/60 bg-[var(--color-danger-soft)] px-3 py-2 text-sm">
          <strong>Test mode.</strong> Entering an email signs you straight in —
          no email is sent. Turn this off before the event.
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
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
          Use the same address you bought your ticket with. Your profile is already set up — no password, nothing to fill in.
        </p>
      </div>

      {(state === "error" || urlError) && (
        <p className="text-sm text-[var(--color-danger-ink)]" role="alert">
          {message || urlError}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 font-medium text-white disabled:opacity-60"
      >
        {state === "sending" ? (DEV_SIGNIN ? "Signing in…" : "Sending…")
          : (DEV_SIGNIN ? "Sign in" : "Send sign-in link")}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <section className="pt-8">
      <h1 className="text-2xl font-bold leading-tight tracking-tight">
        {EVENT.name}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {EVENT.date} · {EVENT.venue}
      </p>
      <a
        href={EVENT.meetupUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-sm font-medium text-[var(--color-accent)] underline underline-offset-2"
      >
        Event details on Meetup ↗
      </a>
      <div className="mt-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
