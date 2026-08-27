import { z } from "zod";

/**
 * What Claude returns after reading a photo of the open-sessions board.
 *
 * Times are wall-clock strings rather than timestamps: the model is reading a
 * whiteboard, and asking it to also do timezone arithmetic invites errors we
 * would then have to detect. The event is one fixed day, so "14:20" is
 * unambiguous and we build the timestamp ourselves.
 */
export const ProposedSessionSchema = z.object({
  title: z.string().describe("The talk or session title exactly as written"),
  speaker_name: z
    .string()
    .nullable()
    .describe(
      "The booker's full name exactly as written, including diacritics. It is " +
        "matched against attendee profiles. Null only if the board gives none.",
    ),
  start_time: z
    .string()
    .describe('24-hour wall-clock start time, "HH:MM". Convert any 12-hour times.'),
  end_time: z
    .string()
    .nullable()
    .describe('24-hour end time "HH:MM", or null if the board does not state one'),
  room: z
    .string()
    .nullable()
    .describe(
      "Almost always null: every Open Session is in the same room. Only fill " +
        "this in if the board explicitly names a different one.",
    ),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe(
      "How legible this row was. Use low for genuinely ambiguous handwriting, " +
        "medium if you inferred part of it, high only if it is plainly readable.",
    ),
  note: z
    .string()
    .nullable()
    .describe(
      "Only when confidence is not high: what specifically was unclear, so the " +
        "organiser knows where to look. Otherwise null.",
    ),
});

export const ScanResultSchema = z.object({
  sessions: z
    .array(ProposedSessionSchema)
    .describe("Every session legible on the board, in the order they appear"),
  unreadable: z
    .boolean()
    .describe("True if the photo is too blurry, dark or cropped to read at all"),
  remarks: z
    .string()
    .nullable()
    .describe(
      "One short sentence for the organiser if something needs their attention " +
        "— glare, a cut-off edge, contradictory times. Otherwise null.",
    ),
});

export type ProposedSession = z.infer<typeof ProposedSessionSchema>;
export type ScanResult = z.infer<typeof ScanResultSchema>;
