"use client";

import { useEffect, useState } from "react";

const DISMISSED = "aimc-install-banner-dismissed";

/**
 * Shown to someone already signed in *in a browser* on a phone, prompting them
 * to install.
 *
 * On iPhone it also warns that they will sign in once more inside the app,
 * because the Home Screen web app keeps its own storage separate from Safari's.
 * Discovering that at the door is worse than being told now.
 */
export default function InstallBanner() {
  const [state, setState] = useState<"hidden" | "ios" | "android">("hidden");

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED)) return;
    } catch {
      /* private mode — just show it */
    }

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (standalone) return;
    if (isIos) setState("ios");
    else if (isAndroid) setState("android");
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      /* nothing to do */
    }
    setState("hidden");
  }

  if (state === "hidden") return null;

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
      <p className="font-semibold">Add this to your home screen</p>

      {state === "ios" ? (
        <>
          <p className="mt-1 text-sm">
            Tap <strong>Share</strong> at the bottom of Safari, then{" "}
            <strong>Add to Home Screen</strong>.
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            You&rsquo;ll be asked to sign in once more inside the app — iPhone keeps
            the installed app&rsquo;s sign-in separate from Safari&rsquo;s. After that
            it stays signed in, and notifications only work there.
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm">
          Chrome should offer <strong>Install app</strong> in its menu. You stay
          signed in, and notifications work either way.
        </p>
      )}

      <button
        type="button"
        onClick={dismiss}
        className="mt-3 text-sm font-medium text-[var(--color-muted)] underline"
      >
        Got it
      </button>
    </div>
  );
}
