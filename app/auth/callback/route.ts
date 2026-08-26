import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicOrigin } from "@/lib/site-url";

/**
 * Magic-link landing. Exchanges the PKCE code for a session, then decides
 * where to send the user: to profile setup if they have no profile yet,
 * otherwise onward to wherever they were originally heading.
 */
export async function GET(request: NextRequest) {
  const origin = publicOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?error=no_user`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // First sign-in: send them to build a profile, carrying the destination.
    const url = new URL("/me", origin);
    url.searchParams.set("welcome", "1");
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url.toString());
  }

  return NextResponse.redirect(`${origin}${next}`);
}
