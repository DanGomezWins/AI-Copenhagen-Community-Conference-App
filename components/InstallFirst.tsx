"use client";

import { useEffect, useState } from "react";

/**
 * Tells people to install BEFORE signing in.
 *
 * The reason is sharpest on iPhone - a Home Screen app there keeps its own
 * storage, so signing in via Safari leaves the installed icon signed out, and
 * an emailed link can never open the installed app - but the advice is worth
 * following everywhere: the installed copy is where notifications arrive, so
 * that is where the session needs to live.
 *
 * The wording is deliberately browser-neutral. Naming Safari's Share menu
 * helped iPhone users and quietly misled everyone else, and the exact menu
 * differs across Chrome, Edge, Firefox and Samsung Internet - so it says what
 * to look for rather than where to tap.
 */
export default function InstallFirst() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setShow(!standalone);
  }, []);

  if (!show) return null;

  return (
    <div className="mt-6 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
      <p className="font-semibold">
        Open this webpage on your mobile and add it to your home screen first
      </p>
      <p className="mt-1 text-sm">
        Open your browser&rsquo;s menu and choose{" "}
        <strong>Add to Home Screen</strong> (or <strong>Install</strong>). Then
        open the app from its new icon and sign in there.
      </p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        The installed app keeps its own sign-in, so signing in from the icon
        means you only do it once &mdash; and it&rsquo;s where notifications
        arrive.
      </p>
    </div>
  );
}
