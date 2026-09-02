"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_EDGE = 512;

/**
 * Downscales in the browser before upload. Phone cameras produce 4-8 MB files;
 * the directory renders these at 44px. Resizing client-side keeps uploads fast
 * on venue wifi and keeps us well under the bucket's 5 MB limit.
 */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process that image."))),
      "image/jpeg",
      0.85,
    );
  });
}

export default function PhotoUpload({
  userId,
  firstName,
  lastName,
  photoUrl,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(photoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (file.size > MAX_BYTES * 4) {
      setError("That image is very large. Try a different one.");
      return;
    }

    setBusy(true);
    try {
      const blob = await downscale(file);
      const supabase = createClient();
      // Folder must be the uid — the storage policy scopes writes to it.
      const path = `${userId}/avatar.jpg`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // Cache-bust so a replaced photo shows immediately.
      const url = `${data.publicUrl}?v=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ photo_url: url })
        .eq("id", userId);
      if (dbErr) throw dbErr;

      setPreview(url);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      await supabase.storage.from("avatars").remove([`${userId}/avatar.jpg`]);
      await supabase.from("profiles").update({ photo_url: null }).eq("id", userId);
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex items-center gap-4">
      <Avatar
        firstName={firstName || "?"}
        lastName={lastName || "?"}
        photoUrl={preview}
        size={64}
      />
      <div className="min-w-0 flex-1">
        <input
          ref={input}
          type="file"
          accept="image/*"
          onChange={onPick}
          disabled={busy}
          className="sr-only"
          id="photo"
        />
        <label
          htmlFor="photo"
          className={`inline-block cursor-pointer rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm font-medium ${
            busy ? "opacity-60" : ""
          }`}
        >
          {busy ? "Uploading…" : preview ? "Change photo" : "Add a photo"}
        </label>
        {preview && !busy && (
          <button
            type="button"
            onClick={remove}
            className="ml-3 text-sm text-[var(--color-muted)] underline"
          >
            Remove
          </button>
        )}
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Optional. Helps people recognise you.
        </p>
        {error && <p className="mt-1 text-sm text-[var(--color-danger-ink)]">{error}</p>}
      </div>
    </div>
  );
}
