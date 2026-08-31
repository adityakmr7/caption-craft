"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Check, Copy, ImagePlus, Loader2, X } from "lucide-react";

type Tone = "professional" | "casual" | "hype";

type Variation = {
  text: string;
  hashtags: string[];
};

type GenerateResponse = {
  id: string;
  createdAt: string;
  tone: Tone;
  variations: Variation[];
  remainingFree: number | null;
};

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "hype", label: "Hype" },
];

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
  onUseThis: (index: number, fullText: string) => void;
}) {
  const [text, setText] = useState(variation.text);
  const [hashtags, setHashtags] = useState(variation.hashtags);
  const [justCopied, setJustCopied] = useState(false);

  const handleUseThis = async () => {
    const full = `${text}\n\n${hashtags.join(" ")}`;
    try {
      await navigator.clipboard.writeText(full);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1800);
    } catch {
      // clipboard unavailable — selection still gets recorded below
    }
    onUseThis(index, full);
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

      <AutoGrowTextarea value={text} onChange={setText} />

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

  const handleUseThis = (index: number) => {
    setSelectedIndex(index);
    if (!result?.id) return;
    fetch(`/api/generations/${result.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedVariation: index }),
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
