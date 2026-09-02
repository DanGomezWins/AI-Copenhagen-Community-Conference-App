import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RatingModal from "@/components/RatingModal";
import { EVENT } from "@/lib/event";
import { nameKey } from "@/lib/names";

export const dynamic = "force-dynamic";

// The two people behind the app. Linked to their profiles in the directory
// when they have one, so "who made this" leads somewhere useful.
const MAKERS = ["Daniel Gomez-Windshuttle", "Martin Schultz"];

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: myRating }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name"),
    user
      ? supabase.from("ratings").select("stars, comment")
          .eq("profile_id", user.id).eq("subject", "app").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const findProfile = (name: string) =>
    (profiles ?? []).find(
      (p) => nameKey(`${p.first_name} ${p.last_name}`) === nameKey(name),
    );

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight">About this app</h1>

      <p className="mt-4 leading-relaxed">
        This app was built for {EVENT.fullName} by{" "}
        {MAKERS.map((name, i) => {
          const p = findProfile(name);
          return (
            <span key={name}>
              {p ? (
                <Link
                  href={`/people/${p.id}`}
                  className="font-medium text-[var(--color-accent)] underline underline-offset-2"
                >
                  {name}
                </Link>
              ) : (
                <span className="font-medium">{name}</span>
              )}
              {i < MAKERS.length - 1 ? " & " : ""}
            </span>
          );
        })}{" "}
        as an experiment — one day, one venue, three rooms, and a question about
        how much of the running of an event can simply take care of itself.
      </p>

      <p className="mt-4 leading-relaxed text-[var(--color-muted)]">
        It keeps the programme, the live updates and the people in one place, so
        nobody has to hunt for what changed. There is no app to download and no
        account to create: your profile was set up before you arrived.
      </p>

      <div className="mt-8">
        <RatingModal
          label="Rate this app"
          existingStars={myRating?.stars ?? null}
          existingComment={myRating?.comment ?? null}
        />
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Got feedback or suggestions? We&rsquo;d love to hear it.
        </p>
      </div>

      <div className="mt-10 border-t border-[var(--color-line)] pt-6">
        <a
          href={EVENT.meetupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[var(--color-accent)] underline underline-offset-2"
        >
          Event details on Meetup ↗
        </a>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Your data stays in the EU. Your profile is visible to other attendees
          only, and you can remove it from your profile page at any time.
        </p>
      </div>
    </section>
  );
}
