"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";

/**
 * A profile photo you can tap to see properly.
 *
 * At 168px a headshot is an identifier, not a face — fine for "is this the
 * person I am about to walk up to?", useless for actually recognising someone
 * across a room. Tapping fills the screen width with it.
 *
 * Only when there is a photo: the initials fallback has nothing to enlarge,
 * so it stays a plain avatar rather than a button that disappoints.
 */
export default function PhotoLightbox({
  firstName,
  lastName,
  photoUrl,
  size = 168,
}: {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    // The page must not scroll behind the photo - on a phone that reads as the
    // photo sliding around rather than the page moving underneath it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      // Put the keyboard back where it was, not at the top of the document.
      opener.current?.focus();
    };
  }, [open]);

  const fullName = `${firstName} ${lastName}`.trim();

  if (!photoUrl) {
    return <Avatar firstName={firstName} lastName={lastName} size={size} />;
  }

  return (
    <>
      <button
        ref={opener}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`See ${firstName}'s photo larger`}
        aria-haspopup="dialog"
        className="rounded-full"
      >
        <Avatar
          firstName={firstName}
          lastName={lastName}
          photoUrl={photoUrl}
          size={size}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={fullName}
          onClick={() => setOpen(false)}
          // Above the tab bar (z-50) as well as the page: "dim everything"
          // means the navigation too, or the photo looks like it is stuck
          // inside the app rather than on top of it.
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={fullName}
            // Anywhere outside closes; the photo itself is the exception.
            onClick={(e) => e.stopPropagation()}
            className="max-h-full w-full max-w-screen-sm rounded-2xl object-contain"
          />

          <button
            ref={closeButton}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close photo"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/50 text-2xl leading-none text-white"
            style={{ top: "max(1rem, env(safe-area-inset-top))" }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
