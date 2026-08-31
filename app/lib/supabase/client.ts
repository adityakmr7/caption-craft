import { createBrowserClient } from "@supabase/ssr";

// Browser client: respects the signed-in user's Row Level Security policies.
// Safe to import from Client Components — both env vars below are
// NEXT_PUBLIC_-prefixed and meant to be exposed to the browser.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
