import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/app/lib/supabase/admin";

// Anonymous, unauthenticated by design — this exists purely so LinkedIn
// breaking the extension's compose-box selector (has happened twice
// already) surfaces within hours instead of waiting for a bug report. No
// user id, no page content, no raw URL — see supabase/migrations/
// 0014_extension_telemetry.sql and extension/entrypoints/sidepanel/api.ts
// (classifySurface) for exactly what is and isn't sent.
//
// The payload is a closed enum on every field (checked below, and again
// by the table's CHECK constraints), so there's no free-text field to
// abuse — worst case with a spammed request is a handful of throwaway
// rows, not an injection or storage-exhaustion vector. No Vercel Firewall
// rate limit here: the Hobby plan's one custom rule is already spent on
// /api/generate (see TODO.md) — worth adding if this ever needs one.

const VALID_REASONS = new Set(["no-compose-box", "no-content-script"]);
const VALID_SURFACES = new Set(["feed", "compose", "messaging", "profile-post", "other"]);
const MAX_VERSION_LENGTH = 20;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const reason = body?.reason;
  const surface = body?.surface;
  const extensionVersion =
    typeof body?.extensionVersion === "string"
      ? body.extensionVersion.slice(0, MAX_VERSION_LENGTH)
      : null;

  if (!VALID_REASONS.has(reason) || !VALID_SURFACES.has(surface)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("extension_telemetry").insert({
      reason,
      surface,
      extension_version: extensionVersion,
    });

    if (error) {
      console.error("extension telemetry insert failed", error);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("extension telemetry route error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
