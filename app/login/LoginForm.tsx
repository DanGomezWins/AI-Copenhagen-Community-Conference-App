"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";

const DEV_SIGNIN = process.env.NEXT_PUBLIC_ENABLE_DEV_SIGNIN === "true";

// Supabase's code length is a project setting, and this project issues eight
// digits, not the six the docs assume. Testing caught it: a hard-coded six
// would have left the Sign in button permanently disabled. Accept the range.
const CODE_MIN = 6;
const CODE_MAX = 8;

/**
 * Sign-in by six-digit code, not by clicking a link.
 *
 * On iPhone a link in an email always opens Safari, and an installed Home
 * Screen app keeps its own storage separate from Safari's. So a magic link
 * tapped from Mail signs you into Safari and leaves the installed app signed
 * out — the person is stuck, and nothing in the app can fix it.
 *
 * A code has none of that problem: it is typed into whichever copy of the app
 * asked for it, so the session is created exactly where the person is. The
 * email still carries a link as a fallback for anyone reading it on a laptop.
 */
export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const urlError = params.get("error");

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resentAt, setResentAt] = useState<number | null>(null);
  // Test mode only: the code that would have been emailed, shown on screen.
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code") codeInput.current?.focus();
  }, [step]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    track(EVENTS.SIGN_IN_STARTED);

    const address = email.trim().toLowerCase();

    // Test mode: mint a real code server-side and show it, rather than sending
    // mail. The code and the verification below are genuine — only delivery is
    // simulated — so this exercises the same path attendees will use.
    if (DEV_SIGNIN) {
      const res = await fetch("/api/dev/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address }),
      });
      const json = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(json.error ?? "Could not create a code.");
        return;
      }
      setSimulatedCode(json.code);
      setResentAt(Date.now());
      setStep("code");
      return;
    }

    const supabase = createClient();
    const redirect = new URL("/auth/callback", window.location.origin);
    redirect.searchParams.set("next", next);

    const { error: err } = await supabase.auth.signInWithOtp({
      email: address,
      options: {
        emailRedirectTo: redirect.toString(),
        // Nobody signs up: profiles are made in advance from the ticket list.
        shouldCreateUser: false,
      },
    });

    setBusy(false);

    if (err) {
      setError(
        /not found|signups not allowed|invalid/i.test(err.message)
          ? "We can't find a ticket for that address. Use the address you bought your ticket with, or find an organiser."
          : err.message,
      );
      return;
    }

    setResentAt(Date.now());
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.replace(/\D/g, ""),
      type: "email",
    });

    setBusy(false);

    if (err) {
      setError(
        /expired/i.test(err.message)
          ? "That code has expired. Send a new one."
          : "That code isn't right. Check it and try again.",
      );
      return;
    }

    track(EVENTS.SIGN_IN_COMPLETED);
    router.push(next);
    router.refresh();
  }

  const field =
    "mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]";

  if (step === "code") {
    const canResend = !resentAt || Date.now() - resentAt > 30_000;
    return (
      <form onSubmit={verify} className="space-y-4">
        <div>
          <p className="font-semibold">Check your email</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            We sent a code to <strong>{email}</strong>. Type it in below — you
            don&rsquo;t need to leave this app.
          </p>
        </div>

        {simulatedCode && (
          <div className="rounded-xl border-2 border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-danger-ink)]">
              Test mode — no email was sent
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em]">
              {simulatedCode}
            </p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              This is a real code. Type it in below exactly as an attendee
              would — only the email delivery is simulated.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="code" className="block text-sm font-medium">
            Sign-in code
          </label>
          <input
            ref={codeInput}
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={CODE_MAX}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_MAX))}
            placeholder="123456"
            className={`${field} text-center font-mono text-2xl tracking-[0.4em]`}
          />
        </div>

        {(error || urlError) && (
          <p
            role="alert"
            className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-medium text-[var(--color-danger-ink)]"
          >
            {error || urlError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || code.length < CODE_MIN}
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Checking…" : "Sign in"}
        </button>

        <div className="flex justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
              setSimulatedCode(null);
            }}
            className="text-[var(--color-muted)] underline"
          >
            Use a different email
          </button>
          <button
            type="button"
            disabled={!canResend || busy}
            onClick={() => sendCode()}
            className="font-medium text-[var(--color-accent)] disabled:opacity-40"
          >
            Send a new code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4">
      {DEV_SIGNIN && (
        <p className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm">
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
          className={field}
        />
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Use the same address you bought your ticket with. Your profile is
          already set up — no password, nothing to fill in.
        </p>
      </div>

      {(error || urlError) && (
        <p
          role="alert"
          className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-medium text-[var(--color-danger-ink)]"
        >
          {error || urlError}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Sending…" : DEV_SIGNIN ? "Sign in" : "Email me a code"}
      </button>
    </form>
  );
}
