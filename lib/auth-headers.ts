/**
 * Identity headers, written by the proxy once it has verified the session.
 *
 * Their own module because both sides of the handoff need the names and the
 * two sides run in different worlds: the proxy cannot import lib/auth.ts,
 * which reaches for next/headers and a Supabase server client that only exist
 * inside a request being rendered.
 *
 * Set (never appended) on every non-public request, so a header a client sends
 * for itself is always overwritten before anything reads it.
 */
export const USER_ID_HEADER = "x-aimc-user-id";
export const USER_EMAIL_HEADER = "x-aimc-user-email";
