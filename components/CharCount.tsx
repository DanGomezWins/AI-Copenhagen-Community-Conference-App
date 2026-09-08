"use client";

import { useEffect, useState } from "react";

/**
 * Live character count for a field that has a maxLength.
 *
 * Attaches to the field by id and listens, rather than taking a value, so the
 * server-rendered forms can stay uncontrolled - converting them would mean
 * hoisting state through several components to show a number.
 *
 * `initial` covers the first paint before the effect runs: without it a
 * prefilled field flashes 0 and then jumps, which reads as the text having
 * been lost.
 */
export default function CharCount({
  htmlFor,
  max,
  initial = 0,
}: {
  htmlFor: string;
  max: number;
  initial?: number;
}) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    // Listens on the document rather than on the field itself. Holding a
    // reference to the element meant that when React re-rendered the form and
    // swapped that node, the listener stayed on the detached one and the count
    // froze at whatever it last read. Delegation does not care which node is
    // currently mounted, only what its id is.
    const onInput = (e: Event) => {
      const t = e.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (t && t.id === htmlFor) setCount(t.value.length);
    };
    document.addEventListener("input", onInput, true);

    const el = document.getElementById(htmlFor) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    if (el) setCount(el.value.length);

    return () => document.removeEventListener("input", onInput, true);
  }, [htmlFor]);

  // maxLength stops the typing, so the count cannot exceed the limit - the
  // colour is there to explain why the keyboard stopped responding.
  const full = count >= max;

  return (
    <p
      aria-live="polite"
      className={`mt-1 text-right text-xs tabular-nums ${
        full ? "font-medium text-[var(--color-danger-ink)]" : "text-[var(--color-muted)]"
      }`}
    >
      {full ? `${max}/${max} — that's the limit` : `${count}/${max}`}
    </p>
  );
}
