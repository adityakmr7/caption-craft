import type { createClient } from "@/app/lib/supabase/server";

// Voice matching (PRD §7.1a): few-shot injection of the founder's own past
// writing into the generation prompt, so output mirrors their sentence
// rhythm and phrasing instead of a generic tone dial. Two sources, not
// mutually exclusive:
//
//  - Explicit: samples pasted during onboarding (voice_samples table).
//    Prioritized first since they're curated by the user for this purpose.
//  - Implicit: the edited, final text of past generations the user
//    actually selected — real style signal collected as a byproduct of
//    normal use. Filled in only if explicit samples don't already cover
//    MAX_VOICE_EXAMPLES.
//
// Capped at 3 total per PRD's token-budget note (~500-900 input tokens).

const MAX_VOICE_EXAMPLES = 3;
export const MIN_ONBOARDING_SAMPLES = 2;

type Supabase = Awaited<ReturnType<typeof createClient>>;

type PastGenerationRow = {
  variations: { text: string; hashtags: string[] }[] | null;
  selected_variation: number | null;
};

export async function getVoiceExamples(
  supabase: Supabase,
  userId: string
): Promise<string[]> {
  const { data: samples } = await supabase
    .from("voice_samples")
    .select("content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_VOICE_EXAMPLES)
    .returns<{ content: string }[]>();

  const explicit = (samples ?? []).map((s) => s.content);
  if (explicit.length >= MAX_VOICE_EXAMPLES) return explicit;

  const { data: pastGenerations } = await supabase
    .from("generations")
    .select("variations, selected_variation")
    .eq("user_id", userId)
    .not("selected_variation", "is", null)
    .order("created_at", { ascending: false })
    .limit(MAX_VOICE_EXAMPLES)
    .returns<PastGenerationRow[]>();

  const implicit = (pastGenerations ?? [])
    .map((g) => {
      const idx = g.selected_variation;
      if (idx === null || idx === undefined || !g.variations) return null;
      return g.variations[idx]?.text ?? null;
    })
    .filter((text): text is string => Boolean(text));

  return [...explicit, ...implicit].slice(0, MAX_VOICE_EXAMPLES);
}

// Never reuse specific facts/numbers from the examples — they're style
// reference only. Without that instruction the model tends to lift a
// number or claim straight out of an old post into the new one, which
// would be wrong (the new post is grounded in a different screenshot).
export function buildVoicePromptFragment(examples: string[]): string {
  if (examples.length === 0) return "";

  const numbered = examples
    .map((example, i) => `Example ${i + 1}:\n"""\n${example.trim()}\n"""`)
    .join("\n\n");

  return `\n\nThe founder's own past LinkedIn posts, for voice reference only:\n\n${numbered}\n\nMirror this founder's sentence rhythm, vocabulary, and phrasing style from the examples above. Do NOT reuse any specific facts, numbers, or claims from them — they are style reference only. The new post must be grounded solely in the screenshot provided in this request.`;
}
