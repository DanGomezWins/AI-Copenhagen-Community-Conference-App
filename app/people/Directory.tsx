"use client";

import { useMemo, useState, useDeferredValue } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { normalise, searchKey } from "@/lib/names";

export type DirectoryPerson = {
  id: string;
  first_name: string;
  last_name: string;
  is_speaker: boolean;
  company: string | null;
  role: string | null;
  photo_url: string | null;
};

type Filter = "all" | "speakers" | "guests";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "speakers", label: "Speakers" },
  { key: "guests", label: "Guests" },
];

export default function Directory({ people }: { people: DirectoryPerson[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const deferred = useDeferredValue(query);

  const indexed = useMemo(
    () =>
      people.map((p) => ({
        person: p,
        haystack: searchKey(
          [p.first_name, p.last_name, p.company, p.role].filter(Boolean).join(" "),
        ),
      })),
    [people],
  );

  const results = useMemo(() => {
    const q = normalise(deferred.trim());
    return indexed
      .filter(({ person }) =>
        filter === "all" ? true : filter === "speakers" ? person.is_speaker : !person.is_speaker,
      )
      .filter(({ haystack }) => (q ? haystack.includes(q) : true))
      .map(({ person }) => person);
  }, [indexed, deferred, filter]);

  const speakerCount = people.filter((p) => p.is_speaker).length;

  return (
    <>
      <div className="mt-4">
        <label htmlFor="q" className="sr-only">Search attendees</label>
        <input
          id="q"
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, company or role"
          className="w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div className="mt-3 flex gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === "all" ? people.length
              : f.key === "speakers" ? speakerCount
              : people.length - speakerCount;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                filter === f.key
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                  : "border-[var(--color-line)] text-[var(--color-muted)]"
              }`}
            >
              {f.label} <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-[var(--color-muted)]">
        {results.length === people.length
          ? `${people.length} ${people.length === 1 ? "person" : "people"}`
          : `${results.length} of ${people.length}`}
      </p>

      {results.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--color-line)] p-6">
          <p className="text-sm text-[var(--color-muted)]">
            {people.length === 0
              ? "Nobody has created a profile yet. Yours could be the first."
              : `No one matches “${query}”.`}
          </p>
        </div>
      )}

      <ul className="mt-3 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
        {results.map((p) => (
          <li key={p.id}>
            <Link href={`/people/${p.id}`} className="flex items-center gap-3 p-3">
              <Avatar
                firstName={p.first_name}
                lastName={p.last_name}
                photoUrl={p.photo_url}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">
                    {p.first_name} {p.last_name}
                  </span>
                  {p.is_speaker && (
                    <span className="shrink-0 rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                      Speaker
                    </span>
                  )}
                </span>
                <span className="block truncate text-sm text-[var(--color-muted)]">
                  {[p.role, p.company].filter(Boolean).join(" · ") || " "}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
