import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

// Handles the redirect back from Supabase Auth after a Google OAuth flow
// or an email-confirmation link click, exchanging the one-time `code` for
// a session cookie.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
