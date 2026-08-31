// Pure, client-side heuristics — no AI call, no dependency. Mirrors the
// LinkedIn best-practice guidance baked into the generation prompt
// (app/api/generate/route.ts), so a freshly generated post should read as
// "Good length" / no hook issues by default; these exist mainly for when
// the user edits the text afterward.

export type ReadabilityLevel = "short" | "good" | "long";

export type Readability = {
  wordCount: number;
  charCount: number;
  level: ReadabilityLevel;
  label: string;
  densePara: boolean;
};

export function analyzeReadability(text: string): Readability {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;

  let level: ReadabilityLevel;
  let label: string;
  if (wordCount < 200) {
    level = "short";
    label = wordCount === 0 ? "Empty" : "A bit short — aim for 200-400 words";
  } else if (wordCount <= 400) {
    level = "good";
    label = "Good length";
  } else {
    level = "long";
    label = "Too long — trim toward 400 words";
  }

  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const densePara = paragraphs.some((p) => (p.match(/[.!?]+/g) || []).length > 4);

  return { wordCount, charCount, level, label, densePara };
}

const WEAK_OPENERS = [
  "excited to announce",
  "excited to share",
  "thrilled to announce",
  "thrilled to share",
  "happy to share",
  "happy to announce",
  "proud to announce",
  "proud to share",
  "in today's fast-paced",
];

export function analyzeHook(text: string): string[] {
  const firstLine = text.split("\n")[0]?.trim() ?? "";
  if (!firstLine) return [];

  const first210 = text.slice(0, 210);
  const lower = firstLine.toLowerCase();
  const issues: string[] = [];

  if (WEAK_OPENERS.some((w) => lower.startsWith(w))) {
    issues.push("Generic opener — lead with a specific number or detail instead.");
  }
  if (!/\d/.test(first210)) {
    issues.push("No number in the hook — specific numbers earn more curiosity than a description.");
  }
  if (firstLine.length < 15) {
    issues.push("Hook line is very short — make sure it stands on its own before \"see more\".");
  }
  if (/\b(thoughts|what do you think|agree)\??\s*$/i.test(firstLine)) {
    issues.push("Ends in generic engagement-bait — only ask a question you actually want answered.");
  }

  return issues;
}
