/**
 * Starts the auto-announcement scheduler once, when the server boots.
 *
 * This is why the app runs on Railway rather than a serverless host: a
 * persistent container can hold a ticking scheduler, so "next up" and break
 * announcements need no organiser action at all.
 */
export async function register() {
  // Only in the Node runtime — never during build, and never on edge.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_ANNOUNCER === "true") return;

  const cron = (await import("node-cron")).default;
  const { runAnnouncerTick } = await import("./lib/announcer");

  let running = false;

  cron.schedule("* * * * *", async () => {
    // A slow tick must not overlap the next one; the DB claim would catch it,
    // but not piling up work is cheaper than relying on that.
    if (running) return;
    running = true;
    try {
      const { posted, skipped } = await runAnnouncerTick();
      if (posted > 0) console.log(`[announcer] posted ${posted}`);
      else if (skipped) console.log(`[announcer] skipped: ${skipped}`);
    } catch (err) {
      console.error("[announcer] tick failed", err);
    } finally {
      running = false;
    }
  });

  console.log("[announcer] scheduler started (every minute)");
}
