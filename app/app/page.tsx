import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/app/lib/supabase/server";
import { MIN_ONBOARDING_SAMPLES, inferToneFromSamples } from "@/app/lib/voice";
import GenerationWorkspace from "./generation-workspace";
import PostHistory from "./post-history";
import VoiceOnboarding from "./voice-onboarding";

// Kept in sync with app/api/generate/route.ts's FREE_MONTHLY_CAP — not
// imported from there to avoid pulling a route handler's dependencies
// (the Gemini/ai-sdk imports) into this page's bundle for one constant.
const FREE_MONTHLY_CAP = 10;

// Protected dashboard root. The proxy (proxy.ts) already redirects
// unauthenticated requests to /login as an optimistic check, but per
// Next.js's auth guidance, every protected page also verifies the session
// itself — the proxy is not the only line of defense.
export default async function AppHome() {
  const user = await getUser();

  if (!user) {
    redirect("/login?next=/app");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, free_generations_used, free_period_start")
    .eq("id", user.id)
    .single();

  // 10/month, not 3 lifetime (2026-09-13) — see
  // supabase/migrations/0012_free_tier_monthly.sql. free_generations_used
  // only actually resets inside increment_free_generation, which runs on
  // generate, not on page load — so a user who hasn't generated yet this
  // month would otherwise see last month's stale count here. Mirror the
  // RPC's rollover check for display purposes only; this never writes.
  const currentPeriodStart = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
  );
  const freeUsedThisPeriod =
    profile && new Date(profile.free_period_start) < currentPeriodStart
      ? 0
      : (profile?.free_generations_used ?? 0);
  const remainingFree =
    profile && profile.plan === "free"
      ? Math.max(0, FREE_MONTHLY_CAP - freeUsedThisPeriod)
      : null;

  // Voice-matching onboarding (PRD §7.1a) — mandatory for a brand-new user
  // before their first generation, so the feature kicks in from post #1
  // instead of after several uses. Never re-shown to a user who already
  // has generations (an existing account from before this feature shipped
  // shouldn't get retroactively gated) or who already completed it.
  const [{ count: generationsCount }, { data: voiceSamples }] =
    await Promise.all([
      supabase
        .from("generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("voice_samples")
        .select("content")
        .eq("user_id", user.id)
        .returns<{ content: string }[]>(),
    ]);

  const voiceSamplesCount = voiceSamples?.length ?? 0;
  const needsVoiceOnboarding =
    (generationsCount ?? 0) === 0 && voiceSamplesCount < MIN_ONBOARDING_SAMPLES;

  // Tone-conflict warning: guess the tone the user's own samples read
  // closest to, so GenerationWorkspace can nudge if they pick a different
  // one. Heuristic, not authoritative — see inferToneFromSamples.
  const inferredVoiceTone = voiceSamples?.length
    ? inferToneFromSamples(voiceSamples.map((s) => s.content))
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] px-6 py-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-3)] mb-1">Signed in as</p>
            <h1 className="text-lg font-semibold">{user.email}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/app/billing"
              className="btn-ghost px-4 py-2 text-sm font-semibold"
            >
              {profile?.plan && profile.plan !== "free" ? "Billing" : "Upgrade"}
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="btn-ghost px-4 py-2 text-sm font-semibold"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {needsVoiceOnboarding ? (
          <VoiceOnboarding />
        ) : (
          <>
            <GenerationWorkspace
              initialRemainingFree={remainingFree}
              inferredVoiceTone={inferredVoiceTone}
            />
            <PostHistory userId={user.id} />
          </>
        )}
      </div>
    </div>
  );
}
