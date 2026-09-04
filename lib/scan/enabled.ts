/**
 * The Open Sessions board scan is retired.
 *
 * Open Sessions moved to a separate site — the Program's Open Sessions tab now
 * links out rather than listing anything — so nobody needs to photograph the
 * board from this app. The flow is left intact behind this flag rather than
 * deleted: reviving it is a one-line change, rebuilding it would not be.
 *
 * This is also the only feature that calls the Anthropic API. While it is off,
 * ANTHROPIC_API_KEY is unused and the account needs no credit.
 *
 * To bring it back, either:
 *   - set SCAN_ENABLED=true in the environment (no code change, no git push —
 *     fastest if it is needed unexpectedly on the day), or
 *   - change the default below to true and deploy.
 *
 * Either way ANTHROPIC_API_KEY has to be set and funded again, or every scan
 * fails on the Claude call.
 *
 * Gated by this flag: the Organiser hub card, the /scan page, and all four
 * /api/scan/* routes. Everything under lib/scan/ is untouched and still builds.
 */
export const SCAN_ENABLED = process.env.SCAN_ENABLED === "true";
