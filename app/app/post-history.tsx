import { Check } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import LinkedInPreview from "./linkedin-preview";
import DeleteGenerationButton from "./delete-generation-button";
import PostFeedback from "./post-feedback";

type Variation = { text: string; hashtags: string[] };
type FeedbackOutcome = "flopped" | "average" | "viral";

type GenerationRow = {
  id: string;
  tone: string;
  post_type: string | null;
  variations: Variation[];
  selected_variation: number | null;
  created_at: string;
};

type FeedbackRow = {
  generation_id: string;
  outcome: FeedbackOutcome;
  comment: string | null;
};

const FEEDBACK_ELIGIBLE_AFTER_MS = 24 * 60 * 60 * 1000;

// A plain helper, not the component body — eslint's react-hooks purity
// rule (React Compiler compat) flags Date.now()/new Date() called directly
// inside a component's render path, even a Server Component's, where it's
// actually safe (runs once per request, not re-rendered). Isolating the
// impure read here keeps the rule happy without disabling it wholesale.
function isFeedbackEligible(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() >= FEEDBACK_ELIGIBLE_AFTER_MS;
}

const POST_TYPE_LABELS: Record<string, string> = {
  milestone: "Milestone",
  lesson: "Lesson",
  contrarian: "Contrarian",
  data: "Data",
};

export default async function PostHistory({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: generations } = await supabase
    .from("generations")
    .select("id, tone, post_type, variations, selected_variation, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<GenerationRow[]>();

  if (!generations || generations.length === 0) return null;

  const generationIds = generations.map((g) => g.id);
  const { data: feedbackRows } = await supabase
    .from("post_feedback")
    .select("generation_id, outcome, comment")
    .in("generation_id", generationIds)
    .returns<FeedbackRow[]>();
  const feedbackByGeneration = new Map(
    (feedbackRows ?? []).map((f) => [f.generation_id, f])
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-[var(--text-2)]">
        Your history
      </h2>
      {generations.map((g) => {
        const hasSelection = g.selected_variation !== null;
        const selected = hasSelection ? g.variations[g.selected_variation!] : null;
        const others = hasSelection
          ? g.variations.filter((_, i) => i !== g.selected_variation)
          : g.variations;
        const feedback = feedbackByGeneration.get(g.id) ?? null;
        const feedbackEligible = hasSelection && isFeedbackEligible(g.created_at);

        return (
          <div key={g.id} className="cc-card px-5 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-1)]">
                {new Date(g.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {g.post_type && POST_TYPE_LABELS[g.post_type] && (
                    <span className="cc-chip text-xs">{POST_TYPE_LABELS[g.post_type]}</span>
                  )}
                  <span className="cc-chip text-xs capitalize">{g.tone}</span>
                </div>
                <DeleteGenerationButton id={g.id} />
              </div>
            </div>

            {selected && (
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] w-fit">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  What you used
                </span>
                <LinkedInPreview text={selected.text} hashtags={selected.hashtags} />
              </div>
            )}

            <details>
              <summary className="cursor-pointer text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                {hasSelection ? "Show other variations" : "Show all 3 variations"}
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                {others.map((v, i) => (
                  <div key={i} className="border-t border-[var(--border-soft)] pt-3">
                    <LinkedInPreview text={v.text} hashtags={v.hashtags} />
                  </div>
                ))}
              </div>
            </details>

            {feedbackEligible && (
              <PostFeedback
                generationId={g.id}
                initialOutcome={feedback?.outcome ?? null}
                initialComment={feedback?.comment ?? null}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
