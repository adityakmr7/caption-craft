import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses Row Level Security. Server-only — never
// import this from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY
// to the browser. Use app/lib/supabase/server.ts for anything that should
// respect the signed-in user's own RLS policies.

type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          plan: "free" | "monthly" | "yearly";
          free_generations_used: number;
          free_period_start: string;
          razorpay_customer_id: string | null;
          razorpay_subscription_id: string | null;
          subscription_status: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: never;
        Update: Partial<{
          plan: "free" | "monthly" | "yearly";
          razorpay_customer_id: string | null;
          razorpay_subscription_id: string | null;
          subscription_status: string | null;
          current_period_end: string | null;
        }>;
        Relationships: [];
      };
      billing_events: {
        Row: {
          id: string;
          razorpay_event_id: string;
          event_type: string;
          payload: unknown;
          processed_at: string;
        };
        Insert: { razorpay_event_id: string; event_type: string; payload: unknown };
        Update: never;
        Relationships: [];
      };
      extension_tokens: {
        Row: {
          id: string;
          user_id: string;
          token_hash: string;
          label: string | null;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: { user_id: string; token_hash: string; label?: string | null };
        Update: Partial<{ last_used_at: string | null }>;
        Relationships: [];
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          tone: string;
          post_type: string | null;
          variations: { text: string; hashtags: string[] }[];
          selected_variation: number | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      extension_telemetry: {
        Row: {
          id: string;
          reason: "no-compose-box" | "no-content-script";
          surface: "feed" | "compose" | "messaging" | "profile-post" | "other";
          extension_version: string | null;
          created_at: string;
        };
        Insert: {
          reason: "no-compose-box" | "no-content-script";
          surface: "feed" | "compose" | "messaging" | "profile-post" | "other";
          extension_version?: string | null;
        };
        Update: never;
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
