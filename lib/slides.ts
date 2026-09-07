/**
 * Speaker slides are switched off.
 *
 * The feature assumed speakers would hand over a PDF, or a link to one, before
 * or during the day. In practice almost none will, and a programme dotted with
 * "slides will appear here once the session has finished" promises something
 * that never arrives - worse than not offering it.
 *
 * Everything is left in place behind this flag rather than deleted, because
 * slides genuinely might turn up afterwards as a follow-up to attendees, and
 * turning it back on is a one-line change.
 *
 * To bring it back, either:
 *   - set SLIDES_ENABLED=true in the environment (no code change), or
 *   - change the default below to true and deploy.
 *
 * Gated by this flag: the Slides URL field on the session form, the download
 * link and the "coming once it finishes" notice on a session page, the marker
 * on programme and profile cards, and the announcer's "slides are available"
 * post. The sessions.slides_url column is untouched, and any URL already saved
 * is preserved - saving a session while this is off will not wipe it.
 */
export const SLIDES_ENABLED = process.env.SLIDES_ENABLED === "true";
