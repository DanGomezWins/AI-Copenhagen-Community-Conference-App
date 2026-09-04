import SessionForm from "../SessionForm";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ warning?: string }>;
}) {
  const { warning } = await searchParams;

  return (
    <section>
      {warning && (
        <div className="rounded-lg border border-[var(--color-warning-soft)] bg-[var(--color-warning-soft)] p-3.5">
          <p className="text-sm text-[var(--color-warning-ink)]">{warning}</p>
        </div>
      )}
      <h1 className="text-2xl font-bold tracking-tight">Add session</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        New sessions appear in the Program straight away.
      </p>
      <SessionForm />
    </section>
  );
}
