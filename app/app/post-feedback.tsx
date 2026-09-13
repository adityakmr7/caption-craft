"use client";

import { useState } from "react";

type Outcome = "flopped" | "average" | "viral";

const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: "flopped", label: "Flopped" },
  { value: "average", label: "Average" },
  { value: "viral", label: "Went viral" },
];

// Phase 3 data foundation (2026-09-13 roadmap addition): 20 responses here
// tells you which templates/tones/voice-matched posts actually perform,
// without needing the LinkedIn API. Shown only for a post the user
// actually selected, 24h+ after generation (see post-history.tsx) — no
// point asking before there's been time to see how it did.
export default function PostFeedback({
  generationId,
  initialOutcome,
  initialComment,
}: {
  generationId: string;
  initialOutcome: Outcome | null;
  initialComment: string | null;
}) {
  const [outcome, setOutcome] = useState<Outcome | null>(initialOutcome);
  const [comment, setComment] = useState(initialComment ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const submit = async (nextOutcome: Outcome, nextComment: string) => {
    setStatus("saving");
    try {
      const res = await fetch("/api/post-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId,
          outcome: nextOutcome,
          comment: nextComment.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  const pick = (value: Outcome) => {
    setOutcome(value);
    submit(value, comment);
  };

  return (
    <div className="border-t border-[var(--border-soft)] pt-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-[var(--text-3)]">
        How did this post perform?
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {OUTCOMES.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => pick(o.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              outcome === o.value
                ? "border-[var(--accent)] text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]"
                : "border-[var(--border)] text-[var(--text-3)]"
            }`}
          >
            {o.label}
          </button>
        ))}
        {status === "saving" && (
          <span className="text-xs text-[var(--text-3)]">Saving…</span>
        )}
        {status === "saved" && (
          <span className="text-xs text-[var(--success)]">Saved</span>
        )}
        {status === "error" && (
          <span className="text-xs text-red-400">Couldn&apos;t save</span>
        )}
      </div>
      {outcome && (
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={() => submit(outcome, comment)}
          placeholder="What would you change? (optional)"
          maxLength={1000}
          className="w-full rounded-[0.5rem] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] focus:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
        />
      )}
    </div>
  );
}
