"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createPost, updatePost, type PostFormState } from "@/app/actions/posts";
import { POST_MAX } from "@/lib/feed";
import { TRACKS } from "@/lib/program";
import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";

const MAX_EDGE = 1280;

/** Downscales before upload — phone photos are 4–8 MB and the feed shows them small. */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not process that image."))),
      "image/jpeg",
      0.85,
    ),
  );
}

export default function PostComposer({
  editing,
  isOrganiser,
  userId,
}: {
  editing?: { id: string; body: string; link_url: string | null } | null;
  isOrganiser: boolean;
  userId: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(
    editing ? updatePost : createPost,
    {},
  );

  const [body, setBody] = useState(editing?.body ?? "");
  const [alert, setAlert] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      if (!editing) {
        track(EVENTS.ATTENDEE_POST_CREATED);
      }
      router.push("/");
    }
  }, [state.ok, router, editing]);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError("");
    setUploading(true);
    try {
      const blob = await downscale(file);
      const supabase = createClient();
      // Folder must be the uid — the storage policy scopes writes to it.
      const path = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("post-images")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      setImageUrl(supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl);
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const over = body.length > POST_MAX;

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {!editing && <input type="hidden" name="kind" value={alert ? "alert" : "info"} />}
      {imageUrl && <input type="hidden" name="image_url" value={imageUrl} />}

      <div>
        <label htmlFor="body" className="sr-only">Update</label>
        <textarea
          id="body"
          name="body"
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Something worth sharing with the room."
          className={`w-full rounded-lg border bg-transparent px-3 py-3 text-base leading-relaxed outline-none focus:border-[var(--color-accent)] ${
            over ? "border-[var(--color-danger)]" : "border-[var(--color-line)]"
          }`}
        />
        <p
          className={`mt-1 text-right text-xs ${
            over ? "font-medium text-[var(--color-danger-ink)]" : "text-[var(--color-muted)]"
          }`}
        >
          {body.length}/{POST_MAX}
        </p>
      </div>

      {!editing && (
        <>
          <div>
            {imageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="mt-2 text-sm text-[var(--color-danger-ink)] underline"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInput}
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={onPickImage}
                  disabled={uploading}
                  className="sr-only"
                />
                <label
                  htmlFor="image"
                  className="inline-block cursor-pointer rounded-lg border border-[var(--color-line)] px-3.5 py-2.5 text-sm font-medium"
                >
                  {uploading ? "Uploading…" : "Add a photo"}
                </label>
              </>
            )}
            {imgError && (
              <p className="mt-1 text-sm text-[var(--color-danger-ink)]">{imgError}</p>
            )}
          </div>

          <fieldset>
            <legend className="text-sm font-medium">
              Who is this for?{" "}
              <span className="font-normal text-[var(--color-muted)]">
                (everyone sees it either way)
              </span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <label>
                <input type="radio" name="track" value="" defaultChecked className="peer sr-only" />
                <span className="block cursor-pointer rounded-full border border-[var(--color-line)] px-3 py-1.5 text-sm peer-checked:border-[var(--color-accent)] peer-checked:text-[var(--color-accent)]">
                  Everyone
                </span>
              </label>
              {TRACKS.map((t) => (
                <label key={t.key}>
                  <input type="radio" name="track" value={t.key} className="peer sr-only" />
                  <span className="block cursor-pointer rounded-full border border-[var(--color-line)] px-3 py-1.5 text-sm peer-checked:border-[var(--color-accent)] peer-checked:text-[var(--color-accent)]">
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <div>
        <label htmlFor="link_url" className="block text-sm font-medium">
          Link <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <input
          id="link_url"
          name="link_url"
          inputMode="url"
          placeholder="example.com/something"
          defaultValue={editing?.link_url ?? ""}
          className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-3 text-base outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      {!editing && isOrganiser && (
        <label className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] px-3 py-3">
          <input
            type="checkbox"
            checked={alert}
            onChange={(e) => setAlert(e.target.checked)}
            className="size-4 accent-[var(--color-danger)]"
          />
          <span className="text-sm">
            <span className="font-medium">Mark as an alert</span>
            <span className="block text-xs text-[var(--color-muted)]">
              Highlighted for everyone. Use it sparingly or it stops meaning anything.
            </span>
          </span>
        </label>
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-medium text-[var(--color-danger-ink)]"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading || over || (!body.trim() && !imageUrl)}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3.5 text-base font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Posting…" : editing ? "Save changes" : "Post"}
      </button>
    </form>
  );
}
