import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Railway healthcheck target. Reports config presence, never config values. */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "aic-info",
    env: {
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      anthropicApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
      vapidPublicKey: Boolean(process.env.VAPID_PUBLIC_KEY),
      vapidPrivateKey: Boolean(process.env.VAPID_PRIVATE_KEY),
      vapidPublicKeyClient: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    },
  });
}
