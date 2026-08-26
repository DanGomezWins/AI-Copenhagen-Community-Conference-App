import type { NextRequest } from "next/server";

/**
 * The app's public origin.
 *
 * Behind a proxy (Railway, and most PaaS), a Route Handler's
 * `request.nextUrl.origin` reports the container's internal bind address —
 * e.g. https://0.0.0.0:8080 — not the address the browser used. Redirecting
 * to that sends users to a dead URL, which is exactly what happened to the
 * magic-link callback.
 *
 * Order: explicit env override, then the proxy's forwarded headers, then the
 * raw Host header, and only then Next's own view as a last resort.
 */
export function publicOrigin(request: NextRequest): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (host && !host.startsWith("0.0.0.0") && !host.startsWith("[::]")) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}
