import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY development sign-in.
 *
 * Creates a genuine Supabase session — real user, real cookies, real RLS —
 * without sending an email. It exists because Supabase's built-in SMTP is
 * rate-limited to a couple of messages per hour, which makes testing the rest
 * of the app impossible. It is NOT a way to run the event: production needs a
 * real SMTP provider.
 *
 * Fails closed on ENABLE_DEV_SIGNIN — deliberately server-only and read at
 * RUNTIME, so clearing it kills the bypass immediately with no rebuild.
 * (NEXT_PUBLIC_ENABLE_DEV_SIGNIN only toggles the button on the login page;
 * it is inlined at build time and must never be the security gate.)
 * Delete this file once real email is configured.
 */
export async function GET(request: NextRequest) {
  if (process.env.ENABLE_DEV_SIGNIN !== "true") {
    return new NextResponse("Not found", { status: 404 });
  }

  const origin = publicOrigin(request);
  const email = (request.nextUrl.searchParams.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=dev_email_required`);
  }

  const admin = createAdminClient();

  // Ensure the user exists. A duplicate is expected and fine on repeat use.
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr && !/already|exists|registered/i.test(createErr.message)) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(createErr.message)}`,
    );
  }

  // Mint a magic-link token without dispatching an email.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? "dev_link_failed")}`,
    );
  }

  // Redeem it exactly as the real callback would, so cookies are set the same way.
  const supabase = await createClient();
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyErr) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(verifyErr.message)}`,
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?error=no_user`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const next = request.nextUrl.searchParams.get("next") ?? "/";
  if (!profile) {
    const url = new URL("/me", origin);
    url.searchParams.set("welcome", "1");
    return NextResponse.redirect(url.toString());
  }
  return NextResponse.redirect(`${origin}${next}`);
}
