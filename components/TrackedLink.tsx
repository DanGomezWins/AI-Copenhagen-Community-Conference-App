"use client";

import { track } from "@/lib/track";
import type { EventName } from "@/lib/analytics";

/**
 * An outbound link that records the tap.
 *
 * The pages holding these links - a profile, a session, the Open Sessions tab
 * - are server components and cannot call track() themselves, so the handler
 * needs a client boundary of its own. Keeping it to the link means the rest of
 * the page stays on the server.
 */
export default function TrackedLink({
  href,
  event,
  properties,
  className,
  children,
}: {
  href: string;
  event: EventName;
  properties?: Record<string, unknown>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track(event, properties, { onLeave: true })}
      className={className}
    >
      {children}
    </a>
  );
}
