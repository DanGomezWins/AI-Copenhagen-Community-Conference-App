import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FeedList from "./FeedList";
import type { PostWithAuthor } from "@/lib/feed";
import { EVENT } from "@/lib/event";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: organiser }] = await Promise.all([
    supabase
      .from("posts")
      .select("*, author:profiles(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("is_organiser"),
  ]);

  const isOrganiser = organiser === true;

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight tracking-tight">
            {EVENT.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
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
        </div>
        {isOrganiser && (
          <Link
            href="/admin/post"
            className="shrink-0 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-white"
          >
            Post
          </Link>
        )}
      </div>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        Live updates
      </h2>

      <FeedList
        initial={(posts ?? []) as PostWithAuthor[]}
        isOrganiser={isOrganiser}
      />
    </section>
  );
}
