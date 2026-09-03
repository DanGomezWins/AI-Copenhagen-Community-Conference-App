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
        href={EVENT.meetupUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-sm font-medium text-[var(--color-accent)] underline underline-offset-2"
      >
        Event details on Meetup ↗
      </a>

      <InstallFirst />

      <div className="mt-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
