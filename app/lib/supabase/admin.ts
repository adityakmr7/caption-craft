import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses Row Level Security. Server-only — never
// import this from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY
// to the browser. Use app/lib/supabase/server.ts for anything that should
// respect the signed-in user's own RLS policies.

type Database = {
  public: {
    Tables: {
      waitlist: {
        Row: { id: string; email: string; created_at: string };
        Insert: { email: string };
        Update: { email?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

let client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdminClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  client = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return client;
}
