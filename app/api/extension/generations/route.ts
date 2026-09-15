import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/app/lib/supabase/admin";
import { getUserIdFromExtensionToken } from "@/app/lib/extension-auth";

const RECENT_LIMIT = 20;

// Called by the Chrome extension's popup (not a browser page — no
// Supabase session cookie available), so auth is via bearer token
// instead of the usual getUser() cookie check. See
// app/lib/extension-auth.ts and supabase/migrations/0013_extension_tokens.sql.
//
// Uses the admin client because there's no Supabase session for RLS to
// scope against — the .eq("user_id", ...) filter below is what actually
// restricts this to the token's owner, not a redundant extra check.
export async function GET(request: Request) {
  const userId = await getUserIdFromExtensionToken(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "Invalid or missing token." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("generations")
    .select("id, tone, post_type, variations, selected_variation, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);

  if (error) {
    console.error("extension generations fetch failed", error);
    return NextResponse.json({ error: "Couldn't load your posts." }, { status: 500 });
  }

  return NextResponse.json({
    generations: (data ?? []).map((g) => ({
      id: g.id,
      tone: g.tone,
      postType: g.post_type,
      variations: g.variations,
      selectedVariation: g.selected_variation,
      createdAt: g.created_at,
    })),
  });
}
