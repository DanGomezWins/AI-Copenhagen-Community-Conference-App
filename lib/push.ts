import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:organiser@example.com";
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Fans a notification out to every stored subscription.
 *
 * Subscriptions die constantly — a cleared browser, an uninstalled PWA, an
 * expired endpoint. 404 and 410 mean gone for good, so those rows are deleted
 * rather than retried forever. Every other failure is swallowed: a push that
 * doesn't land must never break the action that triggered it, because the feed
 * is the source of truth and push is only an accelerant.
 */
export async function sendToAll(payload: PushPayload): Promise<{
  sent: number;
  removed: number;
  failed: number;
}> {
  if (!configure()) return { sent: 0, removed: 0, failed: 0 };

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys");

  if (!subs?.length) return { sent: 0, removed: 0, failed: 0 };

  const body = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys as { p256dh: string; auth: string } },
          body,
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(s.id);
        else failed++;
      }
    }),
  );

  if (dead.length) {
    await admin.from("push_subscriptions").delete().in("id", dead);
  }

  return { sent, removed: dead.length, failed };
}
