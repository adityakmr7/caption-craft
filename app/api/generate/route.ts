import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { createClient, getUser } from "@/app/lib/supabase/server";

// Using Gemini directly (not Vercel AI Gateway) for now — Gateway requires
// a card on file even for free credits; Google AI Studio's free tier
// doesn't. Swap back to a gateway model string once that's sorted.
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export const runtime = "nodejs";
export const maxDuration = 60;

const TONES = ["professional", "casual", "hype"] as const;
type Tone = (typeof TONES)[number];

const POST_TYPES = ["milestone", "lesson", "contrarian", "data"] as const;
type PostType = (typeof POST_TYPES)[number];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB, per PRD §7.1
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const FREE_LIFETIME_CAP = 3; // PRD §7.1
const PAID_MONTHLY_CAP = 100; // PRD §7.1 — fair-use ceiling to bound AI cost exposure

const variationSchema = z.object({
  variations: z
    .array(
      z.object({
        text: z
          .string()
          .describe(
            "The LinkedIn post body, 200-400 words, hook-first (first 1-2 lines are what shows before 'see more')."
          ),
        hashtags: z
          .array(z.string())
          .describe(
            "3-5 hashtags relevant to Indian startup/build-in-public audiences, each starting with #."
          ),
      })
    )
    .length(3)
    .describe("Exactly 3 distinct post variations for the same screenshot, tone, and structure."),
});

const TONE_GUIDANCE: Record<Tone, string> = {
  professional:
    "Professional: measured, credible, founder-to-founder. No hype words, no excessive punctuation.",
  casual:
    "Casual: conversational, first-person, like texting a friend about a milestone. Contractions are fine.",
  hype:
    "Hype: high-energy, celebratory, confident. Still specific and factual — never vague hype for its own sake.",
};

const POST_TYPE_GUIDANCE: Record<PostType, string> = {
  milestone:
    "Milestone post. Structure: Hook (the number/moment itself) -> Context (what led here) -> Lesson (one thing you'd tell someone earlier in the journey) -> soft CTA (invite reaction, not a hard ask).",
  lesson:
    "Lesson post. Structure: Story (the specific failure or win, told briefly) -> Insight (the non-obvious thing you realized) -> Actionable takeaway (something the reader can actually apply, not a platitude).",
  contrarian:
    "Contrarian take. Structure: Hot take (a stance that pushes back on common startup wisdom) -> Evidence (why you believe it, grounded in what's in the screenshot) -> Alternative view (what you'd tell someone to do instead). Confident, not combative — never attack a person or company by name.",
  data: "Data/framework post. Structure: Lead with the number or process shown in the screenshot -> Explanation (why it matters or how it happened) -> How to apply (a step the reader could try themselves).",
};

const SYSTEM_PROMPT = `You write LinkedIn posts for Indian startup founders documenting their build-in-public journey. You read a screenshot the founder uploaded (a metric, a shipped feature, a payout notification, a milestone) and turn it into 3 distinct, specific LinkedIn post variations in the requested tone and structure.

Rules:
- Ground every post in what is actually visible in the screenshot. Never invent numbers or facts not shown or stated.
- Write like a founder talking, not an AI summarizing. No "In today's fast-paced world," no generic AI-wrapper phrasing, no "Excited to announce" / "Thrilled to share" openers.
- Use Indian context by default: ₹ for currency, IST-appropriate references, Indian company/market context — never default to $ or US-centric examples unless the screenshot itself shows them.
- Each of the 3 variations must take a genuinely different angle on the same underlying fact (e.g. the number itself, the story behind it, the lesson learned) — not just reworded sentences.
- Hashtags come from a curated Indian-startup set such as #BuildInPublic, #StartupIndia, #SaaS, #IndianStartups, #Bootstrapped — pick 3-5 that actually fit, never generic or random tags.
- Keep each post 200-400 words, hook-first: the first 1-2 lines (roughly the first 210 characters) must work as a standalone hook with a specific detail or number, since that's what shows before "see more" on LinkedIn. Never a generic opener, and never a hook whose only job is bare engagement-bait ("Thoughts?").
- Follow the requested post-type structure below for every variation.`;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("screenshot");
  const toneInput = formData.get("tone");
  const postTypeInput = formData.get("postType");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a screenshot." }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Screenshot must be PNG, JPEG, or WebP." },
      { status: 400 }
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Screenshot must be under 10MB." },
      { status: 400 }
    );
  }
  if (typeof toneInput !== "string" || !TONES.includes(toneInput as Tone)) {
    return NextResponse.json({ error: "Invalid tone." }, { status: 400 });
  }
  if (typeof postTypeInput !== "string" || !POST_TYPES.includes(postTypeInput as PostType)) {
    return NextResponse.json({ error: "Invalid post type." }, { status: 400 });
  }
  const tone = toneInput as Tone;
  const postType = postTypeInput as PostType;

  const supabase = await createClient();

  // Atomically check-and-reserve a free-generation slot *before* calling
  // Gemini (PRD §7.1). This used to be a plain SELECT-then-UPDATE, which is
  // a check-then-act race: concurrent requests from the same user could all
  // pass the check before any of them incremented the counter, exceeding
  // the cap and spending real Gemini quota on every extra call. The RPC
  // does the check + increment as one row-locked transaction instead. See
  // supabase/migrations/0003_atomic_free_generation.sql.
  const { data: reservation, error: reservationError } = await supabase
    .rpc("increment_free_generation", { p_user_id: user.id })
    .single()
    .overrideTypes<{
      allowed: boolean;
      plan: string | null;
      free_generations_used: number | null;
    }>();

  if (reservationError || !reservation || reservation.plan === null) {
    console.error("reservation failed", reservationError);
    return NextResponse.json(
      { error: "Couldn't load your account. Try again." },
      { status: 500 }
    );
  }

  if (!reservation.allowed) {
    return NextResponse.json(
      {
        error: "You've used all 3 free generations. Join the waitlist for paid access.",
        code: "FREE_LIMIT_REACHED",
      },
      { status: 402 }
    );
  }

  const plan = reservation.plan;
  const usedAfterReservation = reservation.free_generations_used ?? 0;

  // Paid plans bypass the free-tier cap entirely (see increment_free_generation),
  // but still need *some* ceiling — an unbounded paid account is unbounded
  // Gemini spend. Checked by calendar month, not stored as a counter, so
  // there's no separate reset job to keep correct.
  if (plan !== "free") {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    if (countError) {
      console.error("fair-use count failed", countError);
      return NextResponse.json(
        { error: "Couldn't load your account. Try again." },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= PAID_MONTHLY_CAP) {
      return NextResponse.json(
        {
          error: `You've hit the fair-use limit of ${PAID_MONTHLY_CAP} generations this month — it resets next month.`,
          code: "FAIR_USE_LIMIT_REACHED",
        },
        { status: 429 }
      );
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let output: z.infer<typeof variationSchema>;
  try {
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      instructions: SYSTEM_PROMPT,
      output: Output.object({ schema: variationSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Tone: ${tone} — ${TONE_GUIDANCE[tone]}\n\nStructure: ${POST_TYPE_GUIDANCE[postType]}\n\nGenerate 3 LinkedIn post variations from this screenshot.`,
            },
            { type: "file", mediaType: file.type, data: bytes },
          ],
        },
      ],
    });
    output = result.output;
  } catch (err) {
    console.error("generation failed", err);
    // Give back the reserved slot — a failed attempt shouldn't cost the
    // user one of their 3 free generations.
    if (plan === "free") {
      await supabase
        .from("profiles")
        .update({ free_generations_used: Math.max(0, usedAfterReservation - 1) })
        .eq("id", user.id);
    }
    return NextResponse.json(
      { error: "Generation failed. Try again." },
      { status: 502 }
    );
  }

  // Upload after generation succeeds, so a failed generation never leaves
  // an orphaned file in storage.
  const ext = file.type.split("/")[1] ?? "png";
  const screenshotPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("screenshots")
    .upload(screenshotPath, bytes, { contentType: file.type });

  if (uploadError) {
    console.error("screenshot upload failed", uploadError);
    return NextResponse.json(
      { error: "Couldn't save your screenshot. Try again." },
      { status: 500 }
    );
  }

  const { data: generation, error: insertError } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      screenshot_path: screenshotPath,
      tone,
      post_type: postType,
      variations: output.variations,
    })
    .select("id, created_at")
    .single();

  if (insertError || !generation) {
    console.error("generation insert failed", insertError);
    return NextResponse.json(
      { error: "Couldn't save your generation. Try again." },
      { status: 500 }
    );
  }

  const remainingFree =
    plan === "free" ? Math.max(0, FREE_LIFETIME_CAP - usedAfterReservation) : null;

  return NextResponse.json({
    id: generation.id,
    createdAt: generation.created_at,
    tone,
    postType,
    variations: output.variations,
    remainingFree,
  });
}
