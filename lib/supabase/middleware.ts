import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicOrigin } from "@/lib/site-url";
import { USER_ID_HEADER, USER_EMAIL_HEADER } from "@/lib/auth-headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Routes reachable without a session. Everything else redirects to /login. */
const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/dev", // dev sign-in; the route itself 404s unless the flag is on
  "/api/dev", // mints a test code; also 404s unless the flag is on
  "/api/health",
  // Carries its own bearer token: the Open Space platform pushes the agenda
  // here and has no attendee session to present.
  "/api/open-sessions",
  "/manifest.json",
  "/sw.js",
];

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(p + "/"),
  );

  // Nothing public reads the session, so don't buy one. getUser() is a network
  // round trip to Supabase Auth on every request carrying a cookie, and this
  // test used to run after it — the healthcheck, the login page and the
  // service worker were all paying for an answer none of them used.
  if (isPublic) return NextResponse.next({ request });

  // Cookies Supabase wants written back (a refreshed token). Collected rather
  // than attached to a response as they arrive, because the response can only
  // be built once getUser() has resolved: that is when the verified id exists.
  const refreshed: CookieToSet[] = [];

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
          refreshed.push(...cookiesToSet);
        },
      },
    },
  );

  // Refreshes an expiring token and rewrites the cookie. Must run before any
  // auth check, and getUser() (not getSession()) because it verifies with the
  // auth server rather than trusting the cookie.
  const { data: { user } } = await supabase.auth.getUser();

  // Gate /admin here, before anything renders. Doing it in the layout meant
  // Next streamed the admin page's markup alongside the not-found, so the menu
  // labels reached non-organisers even though the 404 won. RLS is still the
  // real boundary — this stops the UI leaking at all.
  if (user && path.startsWith("/admin")) {
    const { data: organiser } = await supabase.rpc("is_organiser");
    if (organiser !== true) {
      return new NextResponse(null, { status: 404 });
    }
  }

  if (!user) {
    // Build from the public origin, not request.nextUrl — behind a proxy the
    // latter can be the container's internal bind address.
    const url = new URL("/login", publicOrigin(request));
    // Preserve where they were heading so we can land them there after login.
    if (path !== "/") url.searchParams.set("next", path);
    const redirect = NextResponse.redirect(url.toString());
    // An expired session clears its cookies here. Carry that through, or the
    // dead cookie outlives the redirect and every page bounces to /login again.
    refreshed.forEach(({ name, value, options }) =>
      redirect.cookies.set(name, value, options),
    );
    return redirect;
  }

  // Hand the verified identity downstream, so the layout and the page can read
  // who is signed in instead of each asking Supabase Auth over again. See
  // currentUser() in lib/auth.ts for what that was costing.
  //
  // set(), not append() — a client that sends this header for itself has it
  // overwritten here, before anything downstream can read it. And it is only
  // ever identity: every query still carries the user's own JWT, so RLS, not
  // this header, decides what they can actually see.
  const identity = new Headers(request.headers);
  identity.set(USER_ID_HEADER, user.id);
  if (user.email) identity.set(USER_EMAIL_HEADER, user.email);
  else identity.delete(USER_EMAIL_HEADER);

  const response = NextResponse.next({ request: { headers: identity } });
  refreshed.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  return response;
}
