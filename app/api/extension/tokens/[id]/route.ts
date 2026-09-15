import { NextResponse } from "next/server";
import { getUser } from "@/app/lib/supabase/server";
import { getSupabaseAdminClient } from "@/app/lib/supabase/admin";

// Revokes a Chrome-extension token. Web-session authenticated (see
// app/api/extension/tokens/route.ts) — deleting the row is enough to
// revoke it, since getUserIdFromExtensionToken looks it up by hash on
// every extension request.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { error, count } = await supabase
    .from("extension_tokens")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("extension token revoke failed", error);
    return NextResponse.json({ error: "Couldn't revoke this token." }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: "Token not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
