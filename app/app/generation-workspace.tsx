"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Check, Clock, Copy, ImagePlus, Loader2, TriangleAlert, X } from "lucide-react";
import { analyzeHook, analyzeReadability } from "./text-analysis";
import LinkedInPreview from "./linkedin-preview";

type Tone = "professional" | "casual" | "hype";
type PostType = "milestone" | "lesson" | "contrarian" | "data";

type Variation = {
  text: string;
  hashtags: string[];
};

type GenerateResponse = {
  id: string;
  createdAt: string;
  tone: Tone;
  postType: PostType;
  variations: Variation[];
  remainingFree: number | null;
};

const POST_TYPES: { value: PostType; label: string; description: string }[] = [
  { value: "milestone", label: "Milestone", description: "Revenue, users, funding, launches" },
  { value: "lesson", label: "Lesson", description: "What you learned from a failure or win" },
  { value: "contrarian", label: "Contrarian", description: "Challenge a common startup belief" },
  { value: "data", label: "Data / Framework", description: "Share a number or process" },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "hype", label: "Hype" },
];

const READABILITY_COLOR: Record<string, string> = {
  short: "bg-yellow-400",
  good: "bg-[var(--success)]",
  long: "bg-red-400",
};

function AutoGrowTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      className="w-full resize-none overflow-hidden rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm leading-relaxed text-[var(--text-1)] focus:outline-none focus:ring-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] focus:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
    />
  );
}

function VariationCard({
  variation,
  index,
  isSelected,
  dimmed,
  onUseThis,
}: {
  variation: Variation;
  index: number;
  isSelected: boolean;
  dimmed: boolean;
  onUseThis: (index: number, text: string, hashtags: string[]) => void;
}) {
  const [text, setText] = useState(variation.text);
  const [hashtags, setHashtags] = useState(variation.hashtags);
  const [justCopied, setJustCopied] = useState(false);

  const readability = useMemo(() => analyzeReadability(text), [text]);
  const hookIssues = useMemo(() => analyzeHook(text), [text]);

  const handleUseThis = async () => {
    const full = `${text}\n\n${hashtags.join(" ")}`;
    try {
      await navigator.clipboard.writeText(full);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1800);
    } catch {
      // clipboard unavailable — selection still gets recorded below
    }
    onUseThis(index, text, hashtags);
  };

  return (
    <div
      className={`cc-card p-6 flex flex-col gap-4 transition-opacity ${
        isSelected ? "border-[var(--accent)]" : ""
      } ${dimmed ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono-cc text-xs text-[var(--text-3)]">
          Variation {index + 1}
        </span>
        {isSelected && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            Selected
          </span>
        )}
      </div>

      <LinkedInPreview text={text} hashtags={hashtags} />

      <details className="group">
        <summary className="cursor-pointer text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
          Edit text
        </summary>
        <div className="mt-3">
          <AutoGrowTextarea value={text} onChange={setText} />
        </div>
      </details>

      <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
        <span className={`h-1.5 w-1.5 rounded-full ${READABILITY_COLOR[readability.level]}`} />
        <span className="font-mono-cc">{readability.wordCount} words</span>
        <span>·</span>
        <span>{readability.label}</span>
      </div>

      {hookIssues.length > 0 && (
        <div className="flex items-start gap-2 rounded-[0.5rem] border border-yellow-400/25 bg-yellow-400/[0.06] px-3 py-2.5">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5 text-yellow-400" strokeWidth={2} />
          <p className="text-xs leading-relaxed text-[var(--text-2)]">{hookIssues[0]}</p>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {hashtags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setHashtags((h) => h.filter((t) => t !== tag))}
            className="cc-tag inline-flex items-center gap-1 hover:opacity-70 transition-opacity"
            title="Remove hashtag"
          >
            {tag}
            <X className="h-2.5 w-2.5" strokeWidth={2.5} />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleUseThis}
        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold ${
          isSelected ? "btn-primary" : "btn-ghost"
        }`}
      >
        {justCopied ? (
          <>
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Copied
          </>
        ) : isSelected ? (
          <>
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Using this — copy again
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" strokeWidth={2} />
            Use this one
          </>
        )}
      </button>
    </div>
  );
}

export default function GenerationWorkspace({
  initialRemainingFree,
}: {
  initialRemainingFree: number | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [postType, setPostType] = useState<PostType>("milestone");
  const [tone, setTone] = useState<Tone>("professional");
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [remainingFree, setRemainingFree] = useState(initialRemainingFree);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      setError("Screenshot must be PNG, JPEG, or WebP.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Screenshot must be under 10MB.");
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
    if (item) pickFile(item.getAsFile());
  };

  const handleGenerate = async () => {
    if (!file || status === "generating") return;
    setStatus("generating");
    setError(null);

    const formData = new FormData();
    formData.append("screenshot", file);
    formData.append("tone", tone);
    formData.append("postType", postType);

    try {
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Generation failed. Try again.");
        setStatus("error");
        return;
      }

      setResult(data as GenerateResponse);
      setRemainingFree(data.remainingFree ?? null);
      setSelectedIndex(null);
      setStatus("idle");
    } catch {
      setError("Network error. Try again.");
      setStatus("error");
    }
  };

  const handleUseThis = (index: number, text: string, hashtags: string[]) => {
    setSelectedIndex(index);
    if (!result?.id) return;
    // Persists any edits made in the "Edit text" box, not just the
    // selection — otherwise an edit only ever lived in local component
    // state and history always showed the original unedited AI output.
    fetch(`/api/generations/${result.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedVariation: index, text, hashtags }),
    }).catch(() => {
      // best-effort — the copy already succeeded, so the user isn't blocked
    });
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setSelectedIndex(null);
    setError(null);
    setStatus("idle");
  };

  return (
    <div className="flex flex-col gap-6">
      {remainingFree !== null && (
        <p className="text-sm text-[var(--text-3)]">
          {remainingFree > 0
            ? `${remainingFree} free generation${remainingFree === 1 ? "" : "s"} left`
            : "You've used all your free generations."}
        </p>
      )}

      {!result && (
        <div className="cc-card p-6 flex flex-col gap-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
            className={`rounded-[0.75rem] border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                : "border-[var(--border)]"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Selected screenshot preview"
                className="max-h-64 rounded-lg border border-[var(--border-soft)]"
              />
            ) : (
              <>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
                  <ImagePlus className="h-5 w-5" strokeWidth={2} />
                </span>
                <p className="text-sm text-[var(--text-2)]">
                  Drop a screenshot, paste one, or click to browse
                </p>
                <p className="text-xs text-[var(--text-3)]">PNG, JPEG, or WebP — up to 10MB</p>
              </>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--text-3)] mb-2">Post type</p>
            <div className="grid grid-cols-2 gap-2">
              {POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPostType(t.value)}
                  className={`text-left px-3.5 py-2.5 rounded-[0.625rem] border transition-colors ${
                    postType === t.value
                      ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  <span
                    className={`block text-sm font-semibold ${
                      postType === t.value ? "text-[var(--accent)]" : "text-[var(--text-1)]"
                    }`}
                  >
                    {t.label}
                  </span>
                  <span className="block text-xs text-[var(--text-3)] mt-0.5">
                    {t.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--text-3)] mb-2">Tone</p>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`text-sm px-3.5 py-2 rounded-full border transition-colors ${
                    tone === t.value
                      ? "border-[var(--accent)] text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]"
                      : "border-[var(--border)] text-[var(--text-3)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
            <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Best time to post (India, 2026): Tue–Thu, 9 AM–5 PM IST
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!file || status === "generating" || remainingFree === 0}
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "generating" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate 3 posts"
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-5">
          {selectedIndex !== null && (
            <p className="text-sm text-[var(--accent)]">
              {`Variation ${selectedIndex + 1} copied — this is what's saved to your history.`}
            </p>
          )}
          <div className="grid gap-5 md:grid-cols-3 items-start">
            {result.variations.map((v, i) => (
              <VariationCard
                key={i}
                variation={v}
                index={i}
                isSelected={selectedIndex === i}
                dimmed={selectedIndex !== null && selectedIndex !== i}
                onUseThis={handleUseThis}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={reset}
            className="btn-ghost self-start px-5 py-2.5 text-sm font-semibold"
          >
            Generate another
          </button>
        </div>
      )}
    </div>
  );
}
