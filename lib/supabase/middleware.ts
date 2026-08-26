import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicOrigin } from "@/lib/site-url";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Routes reachable without a session. Everything else redirects to /login. */
const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/dev", // dev sign-in; the route itself 404s unless the flag is on
  "/api/health",
  "/manifest.json",
  "/sw.js",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes an expiring token and rewrites the cookie. Must run before any
  // auth check, and getUser() (not getSession()) because it verifies with the
  // auth server rather than trusting the cookie.
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(p + "/"),
  );

  if (!user && !isPublic) {
    // Build from the public origin, not request.nextUrl — behind a proxy the
    // latter can be the container's internal bind address.
    const url = new URL("/login", publicOrigin(request));
    // Preserve where they were heading so we can land them there after login.
    if (path !== "/") url.searchParams.set("next", path);
    return NextResponse.redirect(url.toString());
  }

  return response;
}
