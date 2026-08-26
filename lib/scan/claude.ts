import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ScanResultSchema, type ScanResult } from "./schema";
import type { Session } from "@/lib/program";
import { timeAt } from "@/lib/program";

const MODEL = "claude-opus-5";

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

const SYSTEM = `You read photographs of a handwritten schedule board at a one-day conference and turn them into structured data.

The event is the AI Meetup Copenhagen Community Conference, Thursday 10 September 2026, at twoday København. The board you are reading is the Open Sessions track — participant-led talks that attendees sign up for during the day, so it is handwritten, edited in place, and often messy.

Rules:
- Transcribe what is on the board. Do not invent sessions, tidy up titles, or fill in gaps from what seems plausible.
- Handwriting is often ambiguous. Say so via confidence and note rather than guessing silently. An organiser can fix a flagged row in seconds; they cannot fix a confident error they never noticed.
- Crossed-out or erased rows are deletions. Do not include them.
- Times may be written as "2.20", "14:20", "2:20pm" or "1420". Normalise all of them to 24-hour HH:MM.
- Rooms may appear as "R2", "room 2", "Rm 2". Return them as written; the organiser will normalise.
- If a row has a time but no title, still return it with an empty-ish title and low confidence, so the organiser sees the slot exists.`;

/** Current state of the track, so Claude can resolve ambiguity against reality. */
function contextBlock(current: Session[]): string {
  if (current.length === 0) {
    return "The Open Sessions track is currently empty — everything on the board is new.";
  }
  const lines = current.map(
    (s) =>
      `- ${timeAt(s.starts_at)}${s.ends_at ? `–${timeAt(s.ends_at)}` : ""} | ${s.title}` +
      `${s.speaker_name ? ` | ${s.speaker_name}` : ""}${s.room ? ` | ${s.room}` : ""}` +
      `${s.status === "cancelled" ? " | CANCELLED" : ""}`,
  );
  return `The Open Sessions track currently holds these entries. Use them only to resolve ambiguous handwriting — a name you can half-read that matches one below is probably that one. Do not carry over anything that is not on the photo.\n\n${lines.join("\n")}`;
}

export async function extractFromPhoto(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  current: Session[],
): Promise<ScanResult> {
  const response = await client().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: `${contextBlock(current)}\n\nRead the board.` },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(ScanResultSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("Claude returned an unreadable response. Try the photo again.");
  }
  return response.parsed_output;
}

export type RefineTurn = { role: "user" | "assistant"; content: string };

/**
 * Applies a plain-English correction to an existing draft.
 * The whole draft is resent each turn — it is small, and it keeps the model
 * from having to reconstruct state from a conversation transcript.
 */
export async function refineDraft(
  draft: ScanResult,
  instruction: string,
  history: RefineTurn[],
): Promise<ScanResult> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Here is the current draft of the Open Sessions schedule:

${JSON.stringify(draft, null, 2)}

The organiser will now correct it in plain English. Apply only what they ask, leave everything else exactly as it is, and return the complete corrected draft.

When they correct a row, set that row's confidence to "high" and clear its note — a human has now confirmed it.`,
    },
    { role: "assistant", content: "Understood. What needs changing?" },
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: instruction },
  ];

  const response = await client().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    messages,
    output_config: { format: zodOutputFormat(ScanResultSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("Claude returned an unreadable response. Try rewording that.");
  }
  return response.parsed_output;
}
