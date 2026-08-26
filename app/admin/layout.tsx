import Link from "next/link";
import { notFound } from "next/navigation";
import { isOrganiser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Gate for every /admin route. 404 rather than a message, so the existence of
 * the admin area isn't advertised to attendees poking at URLs. RLS is still
 * the real enforcement — this only keeps the UI honest.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isOrganiser())) notFound();

  return (
    <div>
      <Link
        href="/admin"
        className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]"
      >
        ← Organiser
      </Link>
      <div className="mt-2">{children}</div>
    </div>
  );
}
