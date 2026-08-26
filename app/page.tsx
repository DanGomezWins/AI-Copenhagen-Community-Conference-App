import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FeedList from "./FeedList";
import type { PostWithAuthor } from "@/lib/feed";

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feed</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Live updates from the organisers.
          </p>
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

      <FeedList
        initial={(posts ?? []) as PostWithAuthor[]}
        isOrganiser={isOrganiser}
      />
    </section>
  );
}
