import SessionForm from "../SessionForm";

export default function NewSessionPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Add session</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        New sessions appear in the Program straight away.
      </p>
      <SessionForm />
    </section>
  );
}
