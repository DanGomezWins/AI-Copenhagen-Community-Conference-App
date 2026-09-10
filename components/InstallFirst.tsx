"use client";

import { useEffect, useState } from "react";

/**
 * What to do before signing in, for both kinds of phone.
 *
 * Says both rather than detecting one. Detection meant each person saw only
 * their own line, so an organiser holding an Android could not point at the
 * iPhone instruction from the stage, or read it out to someone stuck.
 *
 * The two platforms genuinely differ, and the difference is not cosmetic:
 * Safari keeps separate storage for an installed app and only delivers web
 * push there, so on iPhone the install has to come first. Android Chrome does
 * push in an ordinary tab, so installing buys an icon and nothing else -
 * which matters, because Play Protect refuses some installs outright and
 * anyone told to install "first" reads that refusal as a locked door.
 */
export default function InstallFirst() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setShow(!standalone);
  }, []);

  // Already running from the home screen: they have done the only bit that
  // needed doing.
  if (!show) return null;

  return (
    <div className="mt-6 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
      <p className="font-semibold">Before you sign in</p>

      <dl className="mt-3 space-y-3 text-sm">
        <div>
          <dt className="font-semibold">On iPhone — add to your home screen first</dt>
          <dd className="mt-0.5 text-[var(--color-muted)]">
            Tap <strong className="text-[var(--color-ink)]">Share</strong> at the
            bottom of Safari, then{" "}
            <strong className="text-[var(--color-ink)]">Add to Home Screen</strong>.
            Open the app from its new icon and sign in there — it is the only
            place notifications can arrive on iPhone.
          </dd>
        </div>

        <div>
          <dt className="font-semibold">On Android — just sign in below</dt>
          <dd className="mt-0.5 text-[var(--color-muted)]">
            Notifications and everything else work in your browser. You can{" "}
            <strong className="text-[var(--color-ink)]">Add to Home Screen</strong>{" "}
            from the browser menu if you want an icon, and if your phone refuses
            it, ignore it and carry on.
          </dd>
        </div>
      </dl>
    </div>
  );
}
