import Link from "next/link";

const ITEMS = [
  { href: "/admin/post", title: "Post an update", desc: "Goes to every attendee's feed instantly." },
  { href: "/admin/schedule", title: "Edit the schedule", desc: "Change a time, room or speaker. Posts the notice for you." },
  { href: "/admin/scan", title: "Scan the whiteboard", desc: "Photograph the open sessions board and publish it.", soon: true },
  { href: "/admin/organisers", title: "Who can post", desc: "Add or remove organisers." },
];

export default function AdminHub() {
  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">Organiser</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Everything here is visible to attendees the moment you save it.
      </p>

      <ul className="mt-6 space-y-3">
        {ITEMS.map((i) => (
          <li key={i.href}>
            {i.soon ? (
              <div className="rounded-xl border border-dashed border-[var(--color-line)] p-4 opacity-55">
                <p className="font-semibold">{i.title}</p>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">{i.desc}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">Not built yet</p>
              </div>
            ) : (
              <Link
                href={i.href}
                className="block rounded-xl border border-[var(--color-line)] p-4"
              >
                <p className="font-semibold">{i.title}</p>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">{i.desc}</p>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
