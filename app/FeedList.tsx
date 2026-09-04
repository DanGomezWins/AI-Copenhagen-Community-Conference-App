"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import { relativeAge, type PostWithAuthor } from "@/lib/feed";
import { TRACKS } from "@/lib/program";
import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";

const trackLabel = (k: string | null) =>
  TRACKS.find((t) => t.key === k)?.label ?? null;

export default function FeedList({
  initial,
  organiserIds,
  isOrganiser,
  userId,
}: {
  initial: PostWithAuthor[];
  organiserIds: string[];
  isOrganiser: boolean;
  userId: string | null;
}) {
  const [posts, setPosts] = useState(initial);
  const [arrived, setArrived] = useState(0);
  const [, setTick] = useState(0);

  const organisers = new Set(organiserIds);

  useEffect(() => {
    track(EVENTS.FEED_OPENED);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select("*, author:profiles(id, first_name, last_name, photo_url)")
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
          if (payload.eventType === "INSERT") setArrived((n) => n + 1);
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
          Nothing here yet. Updates from the organisers and anything attendees
          share will appear here.
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
          {arrived} new post{arrived > 1 ? "s" : ""} — tap to see
        </button>
      )}

      <ol className="mt-4 space-y-3">
        {posts.map((p) => {
          const official =
            p.kind === "auto" || (p.author_id ? organisers.has(p.author_id) : false);
          const track = trackLabel(p.track);
          const mine = p.author_id === userId;

          return (
            <li
              key={p.id}
              className={`rounded-xl border p-4 ${
                p.kind === "alert"
                  ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)]"
                  : official
                    // Official posts carry the brand accent so they are
                    // separable from community chatter at a glance.
                    ? "border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]"
                    : "border-[var(--color-line)]"
              }`}
            >
              <div className="flex items-center gap-2">
                {p.author ? (
                  <Avatar
                    firstName={p.author.first_name}
                    lastName={p.author.last_name}
                    photoUrl={p.author.photo_url}
                    size={28}
                  />
                ) : (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs text-white">
                    ★
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {p.author
                      ? `${p.author.first_name} ${p.author.last_name}`
                      : "AIMC-CC"}
                    {official && (
                      <span className="ml-1.5 rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-wide text-white">
                        Organiser
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {relativeAge(p.created_at)}
                    {p.edited && " · edited"}
                    {p.kind === "alert" && " · Alert"}
                    {track && ` · ${track}`}
                  </p>
                </div>
              </div>

              {p.body && (
                <p className="mt-2.5 whitespace-pre-wrap leading-relaxed">{p.body}</p>
              )}

              {p.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt=""
                  loading="lazy"
                  className="mt-3 w-full rounded-lg object-cover"
                />
              )}

              {p.link_url && (
                <a
                  href={p.link_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-3 block truncate rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm font-medium text-[var(--color-accent)]"
                >
                  {p.link_url.replace(/^https?:\/\//, "")} ↗
                </a>
              )}

              {(mine || isOrganiser) && (
                <Link
                  href={`/post?edit=${p.id}`}
                  className="mt-3 inline-block text-xs font-medium text-[var(--color-accent)]"
                >
                  {mine ? "Edit" : "Moderate"}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
