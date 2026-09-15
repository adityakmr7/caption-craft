import { z } from "zod";

// Screenshot-confirmation step: before generating posts, extract the key
// facts (numbers, percentages, dates, labels) visible in the screenshot
// and show them back to the user for confirmation/correction, rather than
// silently trusting the model's read of a possibly messy dashboard/payout
// screenshot. This is the single biggest trust risk in the product — the
// whole pitch is "grounded in your real screenshot," which breaks the
// moment the model misreads a number and nobody catches it before it goes
// out on LinkedIn.
//
// Two-call design: /api/extract-facts does a small, cheap vision call
// that returns only these label/value pairs (no post generation yet).
// The user reviews/edits them client-side. /api/generate then accepts
// the confirmed facts and treats them as authoritative — see
// buildFactsPromptFragment.

export const MAX_FACTS = 6;
const MAX_LABEL_LENGTH = 40;
const MAX_VALUE_LENGTH = 60;

export const factSchema = z.object({
  label: z
    .string()
    .max(MAX_LABEL_LENGTH)
    .describe(
      "A short, specific label for this data point, e.g. 'MRR', 'Growth', 'New signups' — never generic like 'Number 1'."
    ),
  value: z
    .string()
    .max(MAX_VALUE_LENGTH)
    .describe(
      "The value exactly as shown, including currency symbols and units, e.g. '₹4,10,000', '+22%'."
    ),
});

export const extractionSchema = z.object({
  facts: z
    .array(factSchema)
    .min(1)
    .max(MAX_FACTS)
    .describe(
      "The key data points actually visible in the screenshot — numbers, percentages, dates, labels. Extract only what's genuinely visible, never invent a number."
    ),
});

export type ExtractedFact = z.infer<typeof factSchema>;

export const EXTRACTION_SYSTEM_PROMPT = `You read screenshots that Indian startup founders upload as proof of a milestone — a metric dashboard, a payout notification, a shipped feature, a signup count. Extract the key factual data points actually visible in the image as a short list of label/value pairs.

Rules:
- Only extract what is genuinely visible in the screenshot. Never invent, guess, or estimate a number.
- Keep labels short and specific (e.g. "MRR", "Growth", "New signups"), never generic ("Number 1", "Metric").
- Keep values exactly as shown, including currency symbols, units, and sign (e.g. "₹4,10,000", "+22%").
- Extract at most ${MAX_FACTS} of the most important data points — the ones a founder would actually want to double-check before writing about them.`;

// Client-supplied facts are trusted for prompt content, but still capped
// server-side (see the zod schema below in the /api/generate route) so a
// malicious client can't blow up the prompt with an oversized payload.
export function buildFactsPromptFragment(facts: ExtractedFact[]): string {
  if (facts.length === 0) return "";

  const lines = facts.map((f) => `- ${f.label}: ${f.value}`).join("\n");

  return `\n\nThe founder has confirmed these exact facts from the screenshot:\n${lines}\n\nUse these figures exactly as given in the generated posts — do not alter, round, recompute, or replace them with a different number you might otherwise read from the image. Where the posts reference these data points, they must match this confirmed list.`;
}
