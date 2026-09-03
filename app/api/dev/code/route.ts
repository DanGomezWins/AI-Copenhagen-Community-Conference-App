import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY: mints a real sign-in code without sending an email.
 *
 * generateLink() issues a genuine, Supabase-signed one-time code and does NOT
 * dispatch mail — so the code the tester types is the same code the real flow
 * would email, and verifyOtp validates it for real. Only delivery is
 * simulated. That also sidesteps the built-in SMTP's two-per-hour limit,
 * which is what makes testing this impossible otherwise.
 *
 * Fails closed on ENABLE_DEV_SIGNIN, which is server-only and read at runtime,
 * so clearing it kills this instantly with no rebuild. Delete this route once
 * Resend is live.
 */
export async function POST(request: NextRequest) {
  if (process.env.ENABLE_DEV_SIGNIN !== "true") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { email } = await request.json();
  const address = String(email ?? "").trim().toLowerCase();
  if (!address) {
    return NextResponse.json({ error: "Email required." }, { status: 400 });
  }

  const admin = createAdminClient();

  // generateLink CREATES the user if it does not exist — testing showed it
  // silently minting an account for a typo'd address. Nobody signs up here, so
  // check first and refuse rather than manufacturing a profile-less account.
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const known = (existing?.users ?? []).some(
    (u) => (u.email ?? "").toLowerCase() === address,
  );
  if (!known) {
    return NextResponse.json(
      { error: "No account for that address. Profiles are made in advance from the ticket list." },
      { status: 400 },
    );
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: address,
  });

  const code = data?.properties?.email_otp;
  if (error || !code) {
    return NextResponse.json(
      {
        error:
          error?.message ??
          "No account for that address. Profiles are made in advance from the ticket list.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ code });
}
