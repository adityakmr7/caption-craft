import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-aware server client: reads the signed-in user's session from
// cookies and respects Row Level Security. Use this in Server Components,
// Server Actions, and Route Handlers. For privileged writes that must
// bypass RLS (e.g. the waitlist insert), use app/lib/supabase/admin.ts
// instead.

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't write cookies —
            // safe to ignore as long as the proxy is refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Returns the signed-in user, or null. Use this (not `getSession()`) for
 * anything that gates access to data — it revalidates the JWT against
 * Supabase Auth rather than trusting an unverified cookie.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
