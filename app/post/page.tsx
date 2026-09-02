import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deletePost } from "@/app/actions/posts";
import SubmitButton from "@/components/SubmitButton";
import PostComposer from "./PostComposer";

export const dynamic = "force-dynamic";

export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const supabase = await createClient();

  const [{ data: { user } }, { data: organiser }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("is_organiser"),
  ]);
  if (!user) redirect("/login");

  const isOrganiser = organiser === true;

  let editing: { id: string; body: string; link_url: string | null } | null = null;
  let canDelete = false;
  if (edit) {
    const { data } = await supabase
      .from("posts")
      .select("id, body, link_url, author_id")
      .eq("id", edit)
      .maybeSingle();
    if (data) {
      editing = { id: data.id, body: data.body, link_url: data.link_url };
      canDelete = data.author_id === user.id || isOrganiser;
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">
        {editing ? "Edit post" : "Post to the feed"}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {editing
          ? "Anyone who already read it will see the corrected version."
          : isOrganiser
            ? "Appears in every attendee's feed immediately."
            : "Shared with everyone at the conference."}
      </p>

      <PostComposer editing={editing} isOrganiser={isOrganiser} userId={user.id} />

      {editing && canDelete && (
        <div className="mt-8 border-t border-[var(--color-line)] pt-6">
          <form action={deletePost}>
            <input type="hidden" name="id" value={editing.id} />
            <SubmitButton
              className="text-sm font-medium text-[var(--color-danger-ink)]"
              pendingLabel="Deleting…"
              confirm="Delete this post?"
            >
              Delete this post
            </SubmitButton>
          </form>
          <Link href="/" className="mt-4 inline-block text-sm text-[var(--color-muted)] underline">
            Cancel
          </Link>
        </div>
      )}
    </section>
  );
}
