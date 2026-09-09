"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

const TABS = [
  {
    href: "/",
    label: "Feed",
    icon: (
      <path d="M3 10l7-6 7 6M5 9v8h10V9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/program",
    label: "Program",
    icon: (
      <>
        <rect x="3.5" y="4" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 8h13M7 2.5v3M13 2.5v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/people",
    label: "Networking",
    icon: (
      <>
        <circle cx="10" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
] as const;

/**
 * How long to keep showing the indicator if the route never changes.
 *
 * A navigation that fails, or one the user aborts by tapping elsewhere, would
 * otherwise leave the bar running forever - which is a worse lie than showing
 * nothing at all.
 */
const GIVE_UP_MS = 12_000;

export default function TabBar() {
  const pathname = usePathname();
  const [target, setTarget] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Clears the indicator once the new route is actually on screen.
   *
   * Pending navigation state is harder to get than it looks. Every page is
   * dynamic, so the first tap on a route the router has not already fetched
   * sits for the best part of a second before Next renders even the loading
   * state - measured at 0.6-1.1s locally, and a phone on conference wifi will
   * be slower. Nothing changes on screen for that whole second, which reads as
   * a tap that did not register and invites a second one.
   *
   * Two obvious answers were measured and rejected. useLinkStatus tracks the
   * prefetch, not the navigation: its flag went true and false again inside
   * 30ms while the page was still a second away. Wrapping router.push in
   * useTransition does nothing either, because push does not return a promise
   * the transition can stay pending on.
   *
   * Watching the pathname is what actually works: it changes exactly when the
   * new page commits, which is the moment the user sees it.
   */
  useEffect(() => {
    setTarget(null);
    if (timer.current) clearTimeout(timer.current);
  }, [pathname]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const mark = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Leave modified clicks alone - they open a tab rather than navigating
    // this one, so nothing here is pending.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (href === pathname) return;

    // flushSync, and this is the whole trick. Next wraps the navigation in a
    // transition, and any state set in the same event is swallowed by it -
    // React keeps showing the old UI, indicator included, until the new route
    // commits. Which is precisely the second we are trying to fill. Forcing
    // the paint here puts the indicator on screen before the navigation
    // starts; measured, that is the difference between 900ms of nothing and
    // feedback in under 30ms.
    flushSync(() => setTarget(href));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTarget(null), GIVE_UP_MS);
  };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 bg-[var(--color-accent)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex w-full max-w-screen-sm">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const loading = target === tab.href;

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                onClick={(e) => mark(e, tab.href)}
                aria-current={active ? "page" : undefined}
                aria-busy={loading || undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-sm font-medium transition-colors ${
                  active || loading ? "text-white" : "text-white/60"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
                  {tab.icon}
                </svg>
                {tab.label}
                {loading && (
                  <span
                    aria-hidden
                    data-pending
                    className="absolute inset-x-3 bottom-2.5 h-0.5 overflow-hidden rounded-full bg-white/25"
                  >
                    <span className="block h-full w-1/2 animate-[tab-progress_900ms_ease-in-out_infinite] rounded-full bg-white" />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
