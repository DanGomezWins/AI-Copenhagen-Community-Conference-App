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
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setShow(!standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
  }, []);

  if (!show) return null;

  // Only iPhone actually needs this. Android Chrome does web push in an
  // ordinary tab, so installing there buys a nicer icon and nothing else -
  // and telling everyone to install "first" turned a blocked install into a
  // dead end: Play Protect refuses some home-screen installs with "unsafe app
  // blocked", and the reader concludes they cannot sign in at all.
  if (!ios) {
    return (
      <div className="mt-6 rounded-xl border border-[var(--color-line)] p-4">
        <p className="text-sm font-medium">Sign in below &mdash; that is all you need</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Notifications and everything else work right here in your browser. If
          you would like an icon on your home screen, your browser&rsquo;s menu
          has <strong>Add to Home Screen</strong> (or <strong>Install</strong>)
          &mdash; and if your phone refuses it, ignore it and carry on.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
      <p className="font-semibold">
        On iPhone, add this to your home screen first
      </p>
      <p className="mt-1 text-sm">
        Tap <strong>Share</strong> at the bottom of Safari, then{" "}
        <strong>Add to Home Screen</strong>. Open the app from its new icon and
        sign in there.
      </p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        The installed app keeps its own sign-in, so signing in from the icon
        means you only do it once &mdash; and on iPhone it is the only place
        notifications can arrive.
      </p>
    </div>
  );
}
