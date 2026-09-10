/**
 * Turns email addresses and web links in plain text into links.
 *
 * Feed posts are plain text, so an organiser writing "mail me at x@y.com"
 * got an address people had to copy by hand on a phone. Builds elements
 * rather than HTML, so a post can never inject markup.
 */
const LINKABLE = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+|https?:\/\/[^\s]+)/g;

export function linkify(text: string) {
  return text.split(LINKABLE).map((part, i) => {
    // split() with a capturing group puts the matches at the odd indices.
    if (i % 2 === 0) return part;

    // A sentence ending in a link keeps its full stop outside the link.
    const [, core, trail] = part.match(/^(.*?)([.,;:!?)]*)$/)!;
    const email = !core.startsWith("http");

    return (
      <span key={i}>
        <a
          href={email ? `mailto:${core}` : core}
          {...(email ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          className="break-all font-medium text-[var(--color-accent)] underline underline-offset-2"
        >
          {core}
        </a>
        {trail}
      </span>
    );
  });
}
