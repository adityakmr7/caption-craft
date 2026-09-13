"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

const MIN_SAMPLES = 2;
const MIN_LENGTH = 20;
const SLOTS = 3;

// Mandatory onboarding step (PRD §7.1a) — not a skippable settings toggle,
// which gets ignored. Shown before a brand-new user's first generation so
// voice matching kicks in from generation #1, not after their third use.
// See app/app/page.tsx for the gating logic and app/lib/voice.ts for how
// these get used in the prompt.
export default function VoiceOnboarding() {
  const router = useRouter();
  const [values, setValues] = useState<string[]>(Array(SLOTS).fill(""));
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const filledCount = values.filter((v) => v.trim().length >= MIN_LENGTH).length;
  const canSubmit = filledCount >= MIN_SAMPLES && status !== "submitting";

  const handleChange = (index: number, value: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    const el = textareaRefs.current[index];
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus("submitting");
    setError(null);

    const samples = values.map((v) => v.trim()).filter((v) => v.length >= MIN_LENGTH);

    try {
      const res = await fetch("/api/voice-samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Couldn't save your posts. Try again.");
        setStatus("error");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setStatus("error");
    }
  };

  return (
    <div className="cc-card p-7 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
          <Sparkles className="h-4 w-4" strokeWidth={2.1} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[var(--text-1)]">
            Before your first post: paste 2–3 of your own
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-2)] max-w-[56ch]">
            Paste a few LinkedIn posts you&apos;ve actually written before.
            Every generation from here on mirrors your sentence rhythm and
            phrasing — not a generic tone dial. Used only for your account,
            never shared, never used to train a model.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {values.map((value, i) => (
          <div key={i}>
            <label
              htmlFor={`sample-${i}`}
              className="mb-1.5 block text-xs font-semibold text-[var(--text-3)]"
            >
              Past post {i + 1}
              {i < MIN_SAMPLES ? "" : " (optional)"}
            </label>
            <textarea
              id={`sample-${i}`}
              ref={(el) => {
                textareaRefs.current[i] = el;
              }}
              value={value}
              onChange={(e) => handleChange(i, e.target.value)}
              rows={3}
              placeholder="Paste the full text of a post you wrote..."
              className="w-full resize-none overflow-hidden rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm leading-relaxed text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] focus:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Continue to my first post"
          )}
        </button>
        <span className="text-xs text-[var(--text-3)]">
          {filledCount}/{MIN_SAMPLES} minimum
        </span>
      </div>
    </div>
  );
}
