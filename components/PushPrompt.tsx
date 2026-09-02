"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/track";
import { EVENTS } from "@/lib/analytics";

type State =
  | "checking"
  | "unsupported"
  | "needs-install" // iOS: push only works once added to the home screen
  | "available"
  | "subscribed"
  | "blocked";

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag, absent from the standard type.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * VAPID keys are base64url; PushManager wants raw bytes.
 * Typed as ArrayBuffer because lib.dom's BufferSource does not accept the
 * generic Uint8Array<ArrayBufferLike> that TS 5.7 infers here.
 */
function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

export default function PushPrompt() {
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        // On iOS this is the pre-install state, not a permanent no.
        setState(isIos() && !isStandalone() ? "needs-install" : "unsupported");
        return;
      }
      if (isIos() && !isStandalone()) {
        setState("needs-install");
        return;
      }
      if (Notification.permission === "denied") {
        setState("blocked");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      setState(existing ? "subscribed" : "available");
    })().catch(() => setState("unsupported"));
  }, []);

  async function subscribe() {
    setBusy(true);
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "available");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        throw new Error(
          "Notifications aren’t set up on this deployment yet — the server is " +
            "missing its notification keys. Tell the organiser; it’s a one-off " +
            "config step, not something you did.",
        );
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(key),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Could not save your subscription.");

      setState("subscribed");
      track(EVENTS.NOTIFICATIONS_ENABLED);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not turn notifications on.");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("available");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking" || state === "unsupported") return null;

  const shell = "mt-6 rounded-xl border p-4";

  if (state === "needs-install") {
    return (
      <div className={`${shell} border-[var(--color-line)]`}>
        <p className="text-sm font-medium">Get updates on your lock screen</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          On iPhone, notifications only work once the app is on your home screen.
          Tap <strong>Share</strong> at the bottom of Safari, then{" "}
          <strong>Add to Home Screen</strong>. Open it from there and this option
          will appear.
        </p>
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div className={`${shell} border-[var(--color-line)]`}>
        <p className="text-sm font-medium">Notifications are blocked</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Your browser is set to block them for this site. You can change that in
          site settings — or just keep the Feed open, which always works.
        </p>
      </div>
    );
  }

  if (state === "subscribed") {
    return (
      <div className={`${shell} border-[var(--color-line)]`}>
        <p className="text-sm font-medium">Notifications are on</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          You’ll get schedule changes and organiser alerts.
        </p>
        <button
          type="button"
          onClick={unsubscribe}
          disabled={busy}
          className="mt-2 text-sm text-[var(--color-muted)] underline"
        >
          Turn off
        </button>
      </div>
    );
  }

  return (
    <div className={`${shell} border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5`}>
      <p className="text-sm font-medium">Get notified about changes</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Room changes, delays and what’s next — without keeping the app open.
      </p>
      {error && <p className="mt-2 text-sm text-[var(--color-danger-ink)]">{error}</p>}
      <button
        type="button"
        onClick={subscribe}
        disabled={busy}
        className="mt-3 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Turning on…" : "Turn on notifications"}
      </button>
    </div>
  );
}
