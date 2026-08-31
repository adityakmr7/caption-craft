import { Check } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

type Variation = { text: string; hashtags: string[] };

type GenerationRow = {
  id: string;
  tone: string;
  post_type: string | null;
  variations: Variation[];
  selected_variation: number | null;
  created_at: string;
};

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
              <div className="flex items-center gap-1.5">
                {g.post_type && POST_TYPE_LABELS[g.post_type] && (
                  <span className="cc-chip text-xs">{POST_TYPE_LABELS[g.post_type]}</span>
                )}
                <span className="cc-chip text-xs capitalize">{g.tone}</span>
              </div>
            </div>

            {selected && (
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] w-fit">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  What you used
                </span>
                <p className="text-sm text-[var(--text-1)] whitespace-pre-line">
                  {selected.text}
                </p>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {selected.hashtags.map((tag) => (
                    <span key={tag} className="cc-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <details>
              <summary className="cursor-pointer text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
                {hasSelection ? "Show other variations" : "Show all 3 variations"}
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                {others.map((v, i) => (
                  <p
                    key={i}
                    className="text-sm text-[var(--text-2)] whitespace-pre-line border-t border-[var(--border-soft)] pt-3"
                  >
                    {v.text}
                  </p>
                ))}
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
}
