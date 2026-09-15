import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getUser } from "@/app/lib/supabase/server";
import { validateImageFile } from "@/app/lib/image";
import { EXTRACTION_SYSTEM_PROMPT, extractionSchema } from "@/app/lib/facts";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export const runtime = "nodejs";
export const maxDuration = 30;

// Screenshot-confirmation step (see app/lib/facts.ts): reads a screenshot
// and returns the key facts visible in it, *before* any post is generated.
// The client shows these back to the user to confirm/correct, then sends
// them along with the actual /api/generate call.
//
// Deliberately does NOT touch the free/paid generation cap
// (increment_free_generation) — this is a preview step, not a generation,
// and shouldn't cost the user one of their monthly generations just to
// see what the model read. Known tradeoff: unlike /api/generate, this
// route isn't behind the Vercel Firewall rate limit (Hobby plan allows
// only one custom rule per project, already spent on /api/generate).
// It's still auth-gated and does a small, cheap vision call, so the
// abuse surface is limited, but a follow-up should add rate limiting
// here too if usage data shows it's needed.
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
  const validationError = validateImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  const image = file as File;
  const bytes = new Uint8Array(await image.arrayBuffer());

  try {
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      instructions: EXTRACTION_SYSTEM_PROMPT,
      output: Output.object({ schema: extractionSchema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the key facts visible in this screenshot." },
            { type: "file", mediaType: image.type, data: bytes },
          ],
        },
      ],
    });
    return NextResponse.json({ facts: result.output.facts });
  } catch (err) {
    console.error("fact extraction failed", err);
    // Best-effort: a failed extraction shouldn't block the user from
    // generating — the client falls back to generating without confirmed
    // facts, same as before this feature existed.
    return NextResponse.json(
      { error: "Couldn't read the screenshot automatically." },
      { status: 502 }
    );
  }
}
