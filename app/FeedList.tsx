"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { relativeAge, KIND_STYLE, type PostWithAuthor } from "@/lib/feed";
import { TRACKS } from "@/lib/program";

const trackLabel = (k: string | null) =>
  TRACKS.find((t) => t.key === k)?.label ?? null;

export default function FeedList({
  initial,
  isOrganiser,
}: {
  initial: PostWithAuthor[];
  isOrganiser: boolean;
}) {
  const [posts, setPosts] = useState(initial);
  const [arrived, setArrived] = useState(0);
  // Re-render periodically so "2m ago" doesn't go stale on a page left open.
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select("*, author:profiles(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setPosts(data as PostWithAuthor[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setArrived((n) => n + 1);
          }
          // Refetch rather than patch: keeps the author join correct and the
          // ordering authoritative, and the feed is small enough that it's free.
          load();
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  if (posts.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-[var(--color-line)] p-6">
        <p className="text-sm text-[var(--color-muted)]">
          No updates yet. Anything the organisers post during the day appears here.
        </p>
      </div>
    );
  }

  return (
    <>
      {arrived > 0 && (
        <button
          onClick={() => {
            setArrived(0);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="mt-4 w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white"
        >
          {arrived} new update{arrived > 1 ? "s" : ""} — tap to see
        </button>
      )}

      <ol className="mt-4 space-y-3">
        {posts.map((p) => {
          const style = KIND_STYLE[p.kind] ?? KIND_STYLE.info;
          const track = trackLabel(p.track);
          return (
            <li key={p.id} className={`rounded-xl border p-4 ${style.className}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[var(--color-muted)]">
                  {relativeAge(p.created_at)}
                </span>
                {style.label && (
                  <span className="rounded-full border border-current px-2 py-0.5 font-semibold uppercase tracking-wide opacity-80">
                    {style.label}
                  </span>
                )}
                {track && (
                  <span className="rounded-full bg-[var(--color-line)] px-2 py-0.5 font-medium">
                    {track}
                  </span>
                )}
                {p.edited && (
                  <span className="text-[var(--color-muted)]">edited</span>
                )}
              </div>

              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{p.body}</p>

              {p.author && (
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {p.author.first_name} {p.author.last_name}
                </p>
              )}
              {!p.author && p.kind === "auto" && (
                <p className="mt-2 text-xs text-[var(--color-muted)]">Posted automatically</p>
              )}

              {isOrganiser && (
                <a
                  href={`/admin/post?edit=${p.id}`}
                  className="mt-3 inline-block text-xs font-medium text-[var(--color-accent)]"
                >
                  Edit
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
