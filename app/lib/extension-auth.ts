import { createHash, randomBytes } from "node:crypto";
import { getSupabaseAdminClient } from "@/app/lib/supabase/admin";

// Chrome-extension personal access tokens (see
// supabase/migrations/0013_extension_tokens.sql for the full rationale).
// Only the hash is ever stored or looked up — the raw token exists only
// in the response body at creation time and in the extension's own
// chrome.storage.local after that.

const TOKEN_PREFIX = "cc_";

export function generateExtensionToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

export function hashExtensionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Resolves a bearer token from an extension request to the user it
 * belongs to. Returns null for a missing, malformed, or unknown token —
 * callers should treat that as 401, not distinguish why.
 */
export async function getUserIdFromExtensionToken(
  authHeader: string | null
): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token.startsWith(TOKEN_PREFIX)) return null;

  const tokenHash = hashExtensionToken(token);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("extension_tokens")
    .select("id, user_id")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !data) return null;

  // Best-effort — a failed last_used_at update shouldn't block the
  // actual request the token was presented for.
  supabase
    .from("extension_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(({ error: updateError }) => {
      if (updateError) console.error("extension token touch failed", updateError);
    });

  return data.user_id;
}
