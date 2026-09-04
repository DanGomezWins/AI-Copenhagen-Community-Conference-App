/**
 * Two test sessions at known times, so time-dependent behaviour (finished vs
 * happening-now styling, the slides announcement) can be exercised before the
 * real event date.
 *
 *   node scripts/create-test-sessions.mjs
 *
 * Times are written with an explicit +02:00 offset to match Copenhagen, which
 * is what timeToIso() in lib/program produces. Writing them as +00:00 shifts
 * everything two hours and makes a "past" session look like it is still ahead.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !secretKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey);

const pastSession = {
  title: "[TEST] Past Session - Edit me to add slides",
  description:
    "This session already finished. You can edit it to add slides and test the announcement.",
  speaker_name: "Test Speaker",
  speaker_profile_id: null,
  track: "main",
  room: "Test Room",
  starts_at: "2026-09-03T20:00:00+02:00",
  ends_at: "2026-09-03T21:00:00+02:00",
  status: "scheduled",
};

const nowSession = {
  title: "[TEST] Happening Now - Edit me",
  description:
    "This session is currently happening. You can edit it to test live features.",
  speaker_name: "Test Speaker 2",
  speaker_profile_id: null,
  track: "demos",
  room: "Test Room 2",
  starts_at: "2026-09-04T10:00:00+02:00",
  ends_at: "2026-09-04T15:00:00+02:00",
  status: "scheduled",
};

async function run() {
  try {
    const { data: past, error: pastError } = await supabase
      .from("sessions")
      .insert([pastSession])
      .select();
    if (pastError) throw pastError;
    console.log("Past session created:", past[0].id);

    const { data: now, error: nowError } = await supabase
      .from("sessions")
      .insert([nowSession])
      .select();
    if (nowError) throw nowError;
    console.log("Now session created:", now[0].id);

    console.log(
      "\nDone. Go to Organiser -> Edit the schedule to edit them and add slides.",
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

run();
