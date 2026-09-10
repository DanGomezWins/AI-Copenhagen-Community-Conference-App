import { Suspense } from "react";
import { EVENT } from "@/lib/event";
import InstallFirst from "@/components/InstallFirst";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <section className="pt-8">
      <h1 className="text-2xl font-bold leading-tight tracking-tight">
        {EVENT.fullName}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {EVENT.date} · {EVENT.venue}
      </p>
      <a
        href={EVENT.eventUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-sm font-medium text-[var(--color-accent)] underline underline-offset-2"
      >
        Event details ↗
      </a>

      <InstallFirst />

      <div className="mt-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>

      {/* A code only reaches an address that was on the ticket list, so anyone
          who bought their ticket with a different address gets turned away
          with no way through. This is the way through. */}
      <p className="mt-10 text-center text-xs text-[var(--color-muted)]">
        Trouble signing in? email:{" "}
        <a
          href="mailto:dangomezwindshuttle@gmail.com?subject=AIMC-CC%20app%20%E2%80%94%20trouble%20signing%20in"
          className="font-medium text-[var(--color-accent)] underline underline-offset-2"
        >
          dangomezwindshuttle@gmail.com
        </a>
      </p>
    </section>
  );
}
