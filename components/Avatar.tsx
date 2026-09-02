/**
 * Profile photo, falling back to initials on a stable per-person colour.
 * Most attendees won't upload a picture, so the fallback is the common case
 * and needs to look deliberate rather than broken.
 *
 * Every colour here was checked to give at least 4.5:1 against white initials,
 * so the fallback stays readable. The brand purple leads the set; the rest are
 * distinct enough that two people side by side rarely share one.
 */
const COLOURS = [
  "#4309ff",
  "#1e3a8a",
  "#6b21a8",
  "#0a5f2c",
  "#0f766e",
  "#9a3412",
  "#b31212",
  "#3f3f46",
];

function pick(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLOURS[h % COLOURS.length];
}

export default function Avatar({
  firstName,
  lastName,
  photoUrl,
  size = 44,
}: {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: pick(firstName + lastName),
      }}
    >
      {initials}
    </span>
  );
}
