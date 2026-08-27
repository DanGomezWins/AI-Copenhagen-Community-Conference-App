"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that shows it has been pressed.
 *
 * Plain server-action forms give no feedback at all while the action runs,
 * which on a phone reads as "nothing happened" and invites a second tap.
 */
export default function SubmitButton({
  children,
  pendingLabel,
  className = "",
  confirm,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={`${className} transition-opacity active:opacity-60 disabled:opacity-50`}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingLabel ?? "Working…"}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
