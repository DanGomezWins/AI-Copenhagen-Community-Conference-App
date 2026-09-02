import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deletePost } from "@/app/actions/posts";
import PostComposer from "./PostComposer";

export const dynamic = "force-dynamic";

export default async function AdminPostPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;

  let editing: { id: string; body: string } | null = null;
  if (edit) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select("id, body")
      .eq("id", edit)
      .maybeSingle();
    if (data) editing = data;
  }

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">
        {editing ? "Edit update" : "Post an update"}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {editing
          ? "Attendees who already read it will see the corrected version."
          : "Appears in every attendee's feed immediately."}
      </p>

      <PostComposer editing={editing} />

      {editing && (
        <div className="mt-8 border-t border-[var(--color-line)] pt-6">
          <form action={deletePost}>
            <input type="hidden" name="id" value={editing.id} />
            <button type="submit" className="text-sm font-medium text-[var(--color-danger-ink)]">
              Delete this update
            </button>
          </form>
          <Link href="/" className="mt-4 inline-block text-sm text-[var(--color-muted)] underline">
            Cancel
          </Link>
        </div>
      )}
    </section>
  );
}
