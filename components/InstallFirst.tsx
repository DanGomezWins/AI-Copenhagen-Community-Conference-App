"use client";

import { useEffect, useState } from "react";

/**
 * Tells an iPhone user to install BEFORE signing in.
 *
 * Two iOS facts drive this, and neither can be engineered around:
 *
 *  1. A link in an email always opens Safari. Apple has never supported
 *     deep-linking into an installed Home Screen web app.
 *  2. A Home Screen web app has its own storage, separate from Safari's. So
 *     signing in via the emailed link does not sign you in inside the app.
 *
 * Together that means anyone who signs in first and installs second has to
 * sign in twice — and once real email is live, that is a second email and a
 * second wait. Installing first costs one tap and avoids the whole thing.
 *
 * Android is unaffected: installed PWAs handle their own in-scope links, and
 * storage is shared.
 */
export default function InstallFirst() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setShow(isIos && !standalone);
  }, []);

  if (!show) return null;

  return (
    <div className="mt-6 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
      <p className="font-semibold">Add to your home screen first</p>
      <p className="mt-1 text-sm">
        Tap <strong>Share</strong> at the bottom of Safari, then{" "}
        <strong>Add to Home Screen</strong>. Open it from the new icon and sign
        in there.
      </p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        On iPhone the installed app keeps its own sign-in, so doing it this way
        round saves you signing in twice. It&rsquo;s also the only way
        notifications work.
      </p>
    </div>
  );
}
