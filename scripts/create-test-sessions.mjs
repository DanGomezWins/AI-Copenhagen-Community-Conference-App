import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://shggwtoeppiwyybkanfc.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2d3dG9lcHBpd3l5YmthbmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc0NDAxOSwiZXhwIjoyMTAzMzIwMDE5fQ.KlXTv85zWc8qj3JzrHWbP3Ht41voyyheh9qONTMuwIQ";

const supabase = createClient(supabaseUrl, serviceRoleKey);

const pastSession = {
  title: "[TEST] Past Session - Edit me to add slides",
  description:
    "This session already finished. You can edit it to add slides and test the announcement.",
  speaker_name: "Test Speaker",
  speaker_profile_id: null,
  track: "main",
  room: "Test Room",
  starts_at: "2026-09-04T08:00:00+00:00",
  ends_at: "2026-09-04T09:00:00+00:00",
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
  starts_at: "2026-09-04T12:00:00+00:00",
  ends_at: "2026-09-04T13:00:00+00:00",
  status: "scheduled",
};

async function run() {
  try {
    const { data: past, error: pastError } = await supabase
      .from("sessions")
      .insert([pastSession])
      .select();
    if (pastError) throw pastError;
    console.log("✓ Past session created:", past[0].id);

    const { data: now, error: nowError } = await supabase
      .from("sessions")
      .insert([nowSession])
      .select();
    if (nowError) throw nowError;
    console.log("✓ Now session created:", now[0].id);

    console.log(
      "\nDone! Go to Organiser → Edit the schedule to edit them and add slides."
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

run();
