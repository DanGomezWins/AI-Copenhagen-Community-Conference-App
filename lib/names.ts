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

/**
 * Title-cases a person's name for storage and display.
 *
 * Works per hyphen/apostrophe segment, and does two different things:
 *   - the first letter of every segment is always capitalised, so
 *     "Gomez-windshuttle" becomes "Gomez-Windshuttle"
 *   - the rest of a segment is lowercased only when the segment is entirely
 *     one case, so "DANIEL" becomes "Daniel" while "McDonald" and "MacLeod"
 *     keep their interior capitals
 *
 * Dots and underscores are treated as separators, since people paste
 * "daniel.gomez-windshuttle" from an email address or handle.
 */
export function titleCaseName(input: string): string {
  const capSegment = (seg: string): string => {
    if (!seg) return seg;
    const uniform = seg === seg.toLowerCase() || seg === seg.toUpperCase();
    const body = uniform ? seg.toLowerCase() : seg;
    return body.charAt(0).toUpperCase() + body.slice(1);
  };

  return input
    // A dot or underscore *between two letters* is a separator, because people
    // paste "daniel.gomez-windshuttle" from an email or handle. A dot followed
    // by a space is an initial and must survive: "Berit D. Brouer".
    .replace(/(?<=\p{L})[._](?=\p{L})/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      // Keep the separators by splitting with a capturing group.
      word
        .split(/([-'’])/)
        .map((part) => (/^[-'’]$/.test(part) ? part : capSegment(part)))
        .join(""),
    )
    .join(" ");
}
