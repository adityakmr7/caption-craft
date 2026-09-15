import { NextResponse } from "next/server";
import { getUser } from "@/app/lib/supabase/server";
import { getSupabaseAdminClient } from "@/app/lib/supabase/admin";
import { generateExtensionToken, hashExtensionToken } from "@/app/lib/extension-auth";

const MAX_LABEL_LENGTH = 60;
const MAX_TOKENS_PER_USER = 10; // fair-use ceiling, not a security control

// Chrome-extension personal access tokens. Authenticated by the normal
// web session (cookie-based) — this is the "logged into captioncraft.xyz
// in your browser, generate a token, paste it into the extension" flow,
// not something the extension itself calls. See app/lib/extension-auth.ts.
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("extension_tokens")
    .select("id, label, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("extension token list failed", error);
    return NextResponse.json({ error: "Couldn't load your tokens." }, { status: 500 });
  }

  return NextResponse.json({ tokens: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const labelInput = body?.label;
  if (labelInput !== undefined && typeof labelInput !== "string") {
    return NextResponse.json({ error: "Invalid label." }, { status: 400 });
  }
  if (typeof labelInput === "string" && labelInput.length > MAX_LABEL_LENGTH) {
    return NextResponse.json(
      { error: `Label must be under ${MAX_LABEL_LENGTH} characters.` },
      { status: 400 }
    );
  }
  const label = labelInput || "Chrome extension";

  const supabase = getSupabaseAdminClient();

  const { count, error: countError } = await supabase
    .from("extension_tokens")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    console.error("extension token count failed", countError);
    return NextResponse.json({ error: "Couldn't create a token." }, { status: 500 });
  }
  if ((count ?? 0) >= MAX_TOKENS_PER_USER) {
    return NextResponse.json(
      { error: `You can have at most ${MAX_TOKENS_PER_USER} tokens. Revoke one first.` },
      { status: 400 }
    );
  }

  const token = generateExtensionToken();
  const { data, error } = await supabase
    .from("extension_tokens")
    .insert({ user_id: user.id, token_hash: hashExtensionToken(token), label })
    .select("id, label, created_at")
    .single();

  if (error || !data) {
    console.error("extension token create failed", error);
    return NextResponse.json({ error: "Couldn't create a token." }, { status: 500 });
  }

  // The raw token is returned exactly once, here — it is never stored
  // and can't be recovered later, only revoked and re-created.
  return NextResponse.json({
    id: data.id,
    label: data.label,
    createdAt: data.created_at,
    token,
  });
}
