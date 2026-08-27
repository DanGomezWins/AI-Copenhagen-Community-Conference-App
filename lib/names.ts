/**
 * Name folding, shared by the Networking search and by matching a session's
 * free-text speaker to a profile.
 *
 * NFD alone is not enough for Danish: a-with-ring decomposes, but o-with-stroke
 * and ae are distinct Unicode letters and survive untouched. At a Copenhagen
 * event people type "norgaard" and "odegard" on an English keyboard, so those
 * are mapped explicitly.
 *
 * a-with-ring is genuinely ambiguous — "Aagaard" and "Agaard" are both plausible
 * — so both spellings go into the search index and either query hits.
 */
const BASE: Record<string, string> = {
  "ø": "o", // o with stroke
  "æ": "ae",
  "ð": "d",
  "þ": "th",
  "ł": "l",
};

export function fold(s: string, ring: string): string {
  let out = "";
  for (const ch of s.toLowerCase()) {
    out += ch === "å" ? ring : (BASE[ch] ?? ch);
  }
  return out
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Query side, and the primary index form. */
export function normalise(s: string): string {
  return fold(s, "a");
}

/** Everything a name could reasonably be typed as. */
export function searchKey(s: string): string {
  const a = fold(s, "a");
  const aa = fold(s, "aa");
  return a === aa ? a : `${a} ${aa}`;
}

/**
 * Key used to match a session's speaker_name to a profile.
 *
 * Sessions store speakers as free text — the programme is imported, and the
 * open-sessions board is handwritten — so an exact string match is too brittle.
 * Punctuation is dropped so "Signe V. Holm" and "Signe V Holm" agree.
 */
export function nameKey(s: string): string {
  return normalise(s)
    // Hyphens become spaces, not nothing: "Gomez-Windshuttle" and
    // "Gomez Windshuttle" are the same person written two ways.
    .replace(/[-–—]/g, " ")
    .replace(/[.,'’`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
