"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ScanResult, ProposedSession } from "@/lib/scan/schema";
import type { DiffRow } from "@/lib/scan/diff";
import type { Session } from "@/lib/program";
import { nameKey } from "@/lib/names";

type Stage = "capture" | "working" | "review" | "publishing";

const CONFIDENCE_STYLE: Record<ProposedSession["confidence"], string> = {
  high: "",
  medium: "border-[var(--color-danger)] bg-[var(--color-danger-soft)]",
  low: "border-[var(--color-danger)] bg-[var(--color-danger-soft)]",
};

const KIND_META: Record<DiffRow["kind"], { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-[var(--color-positive-soft)] text-[var(--color-positive-ink)]" },
  changed: { label: "Changed", cls: "bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)]" },
  removed: { label: "Removed", cls: "bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)]" },
  unchanged: { label: "Unchanged", cls: "bg-[var(--color-line)] text-[var(--color-muted)]" },
};

export default function ScanFlow({
  existing,
  knownNames = [],
}: {
  existing: Session[];
  knownNames?: string[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("capture");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [diff, setDiff] = useState<DiffRow[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [instruction, setInstruction] = useState("");
  const [note, setNote] = useState("");

  async function computeDiff(r: ScanResult) {
    const res = await fetch("/api/scan/diff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessions: r.sessions }),
    });
    const json = await res.json();
    setDiff(json.diff ?? []);
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPreview(URL.createObjectURL(file));
    setStage("working");
    setNote("Reading the board…");

    try {
      const body = new FormData();
      body.append("photo", file);
      const res = await fetch("/api/scan", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not read that photo.");

      setDraftId(json.id);
      setResult(json.result);
      await computeDiff(json.result);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("capture");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function applyCorrection() {
    if (!draftId || !instruction.trim()) return;
    setStage("working");
    setNote("Applying your correction…");
    setError("");

    try {
      const res = await fetch("/api/scan/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draftId, instruction }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not apply that.");

      setResult(json.result);
      await computeDiff(json.result);
      setInstruction("");
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("review");
    }
  }

  async function publish() {
    if (!draftId) return;
    setStage("publishing");
    setError("");
    try {
      const res = await fetch("/api/scan/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draftId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Publish failed.");
      router.push("/program?track=open");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("review");
    }
  }

  // ---------- capture ----------
  if (stage === "capture") {
    return (
      <div className="mt-6">
        <input
          ref={fileInput}
          id="photo"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPhoto}
          className="sr-only"
        />
        <label
          htmlFor="photo"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-line)] px-6 py-14 text-center"
        >
          <span className="text-4xl">📷</span>
          <span className="mt-3 font-semibold">Photograph the board</span>
          <span className="mt-1 text-sm text-[var(--color-muted)]">
            Get the whole board in frame. Straight on beats artistic.
          </span>
        </label>

        {error && (
          <p className="mt-4 rounded-lg border border-[var(--color-danger)]/60 bg-[var(--color-danger-soft)] p-3 text-sm" role="alert">
            {error}
          </p>
        )}

        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Nothing changes until you review and publish. You will see exactly what
          it read before anything reaches attendees.
        </p>
      </div>
    );
  }

  // ---------- working ----------
  if (stage === "working" || stage === "publishing") {
    return (
      <div className="mt-6 flex flex-col items-center py-16">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="mb-6 max-h-48 rounded-xl object-contain opacity-60" />
        )}
        <div className="size-8 animate-spin rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-accent)]" />
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          {stage === "publishing" ? "Publishing…" : note}
        </p>
      </div>
    );
  }

  // ---------- review ----------
  const stats = {
    added: diff.filter((d) => d.kind === "new").length,
    changed: diff.filter((d) => d.kind === "changed").length,
    removed: diff.filter((d) => d.kind === "removed").length,
  };
  const flagged = (result?.sessions ?? []).filter((s) => s.confidence !== "high");
  const known = new Set(knownNames);
  const unmatched = (result?.sessions ?? [])
    .map((s) => s.speaker_name)
    .filter((n): n is string => Boolean(n) && !known.has(nameKey(n!)));
  const nothingToDo = stats.added + stats.changed + stats.removed === 0;

  return (
    <div className="mt-6">
      {result?.unreadable && (
        <p className="rounded-lg border border-[var(--color-danger)]/60 bg-[var(--color-danger-soft)] p-3 text-sm">
          That photo couldn’t be read. Try again with more light, or closer.
        </p>
      )}

      {unmatched.length > 0 && (
        <p className="mt-3 rounded-lg border border-[var(--color-danger)]/60 bg-[var(--color-danger-soft)] p-3 text-sm">
          <strong>
            {unmatched.length === 1 ? "This name doesn’t" : "These names don’t"} match
            anyone with a profile:
          </strong>{" "}
          {unmatched.join(", ")}. The session will still publish, but it won’t link
          to a profile. Ask them to add one, or correct the spelling below.
        </p>
      )}

      {result?.remarks && (
        <p className="rounded-lg border border-[var(--color-danger)]/60 bg-[var(--color-danger-soft)] p-3 text-sm">
          {result.remarks}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Stat n={stats.added} label="new" cls="text-[var(--color-positive-ink)]" />
        <Stat n={stats.changed} label="changed" cls="text-[var(--color-danger-ink)]" />
        <Stat n={stats.removed} label="removed" cls="text-[var(--color-danger-ink)]" />
        {flagged.length > 0 && (
          <span className="rounded-full bg-[var(--color-danger-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-danger-ink)]">
            {flagged.length} to check
          </span>
        )}
      </div>

      {nothingToDo && (
        <p className="mt-4 rounded-lg border border-[var(--color-line)] p-3 text-sm text-[var(--color-muted)]">
          Nothing has changed since the last update — publishing would do nothing.
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {diff
          .filter((d) => d.kind !== "unchanged")
          .map((row, i) => (
            <DiffCard key={i} row={row} />
          ))}
      </ul>

      <div className="mt-6 rounded-xl border border-[var(--color-line)] p-4">
        <label htmlFor="fix" className="text-sm font-medium">
          Anything wrong? Say so in plain English.
        </label>
        <textarea
          id="fix"
          rows={2}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. The 14:20 one ends at 14:45, and the name is Ida, not Ada."
          className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2.5 text-base outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="button"
          onClick={applyCorrection}
          disabled={!instruction.trim()}
          className="mt-2 w-full rounded-lg border border-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent)] disabled:opacity-40"
        >
          Apply correction
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-[var(--color-danger)]/60 bg-[var(--color-danger-soft)] p-3 text-sm" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={publish}
        disabled={nothingToDo}
        className="mt-6 w-full rounded-lg bg-[var(--color-accent)] px-4 py-3.5 font-semibold text-white disabled:opacity-40"
      >
        Publish to attendees
      </button>

      <button
        type="button"
        onClick={() => { setStage("capture"); setResult(null); setDiff([]); setPreview(null); }}
        className="mt-3 w-full py-2 text-sm text-[var(--color-muted)] underline"
      >
        Throw this away and start over
      </button>
    </div>
  );
}

function Stat({ n, label, cls }: { n: number; label: string; cls: string }) {
  if (!n) return null;
  return (
    <span className={`font-medium ${cls}`}>
      {n} {label}
    </span>
  );
}

function DiffCard({ row }: { row: DiffRow }) {
  const meta = KIND_META[row.kind];
  const p = row.proposed;
  const conf = p?.confidence ?? "high";

  return (
    <li
      className={`rounded-xl border p-3.5 ${
        row.kind === "removed" ? "border-[var(--color-danger)]/60" : CONFIDENCE_STYLE[conf] || "border-[var(--color-line)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.cls}`}>
          {meta.label}
        </span>
        <span className="font-mono text-xs tabular-nums text-[var(--color-muted)]">
          {p?.start_time ?? "—"}
        </span>
        {conf !== "high" && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-danger-ink)]">
            {conf} confidence
          </span>
        )}
      </div>

      <p className={`mt-1.5 font-medium leading-snug ${row.kind === "removed" ? "line-through opacity-70" : ""}`}>
        {p?.title ?? row.existing?.title}
      </p>
      <p className="mt-0.5 text-sm text-[var(--color-muted)]">
        {p?.speaker_name ?? row.existing?.speaker_name ?? "No speaker listed"}
        {(p?.room ?? row.existing?.room) ? ` · ${p?.room ?? row.existing?.room}` : ""}
      </p>

      {row.changes.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-[var(--color-line)] pt-2 text-xs">
          {row.changes.map((c) => (
            <li key={c.field}>
              <span className="text-[var(--color-muted)]">{c.field}: </span>
              <span className="line-through opacity-60">{c.before}</span>
              <span className="text-[var(--color-muted)]"> → </span>
              <span className="font-medium">{c.after}</span>
            </li>
          ))}
        </ul>
      )}

      {p?.note && (
        <p className="mt-2 text-xs text-[var(--color-danger-ink)]">{p.note}</p>
      )}
    </li>
  );
}
