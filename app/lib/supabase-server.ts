import { createClient } from "@supabase/supabase-js";

type Database = {
  public: {
    Tables: {
      waitlist: {
        Row: { id: string; email: string; created_at: string };
        Insert: { email: string };
        Update: { email?: string };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          plan: string;
          credits: number;
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: never;
        // Server-only (no client update policy - see schema.sql). Used for
        // credit refunds; prefer the deduct_credit() RPC for spending credits.
        Update: Partial<{ plan: string; credits: number; stripe_customer_id: string | null }>;
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          original_url: string | null;
          processed_url: string | null;
          status: string;
          style: string;
          error_message: string | null;
          duration_seconds: number | null;
          credits_used: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          style: string;
          status?: string;
          original_url?: string | null;
          processed_url?: string | null;
          error_message?: string | null;
          duration_seconds?: number | null;
          credits_used?: number;
          completed_at?: string | null;
        };
        Update: Partial<{
          original_url: string | null;
          processed_url: string | null;
          status: string;
          error_message: string | null;
          duration_seconds: number | null;
          completed_at: string | null;
        }>;
        Relationships: [];
      };
      captions: {
        Row: { id: string; video_id: string; text: string; start_time: number; end_time: number };
        Insert: { video_id: string; text: string; start_time: number; end_time: number };
        Update: never;
        Relationships: [];
      };
      words: {
        Row: {
          id: string;
          caption_id: string;
          text: string;
          start_time: number;
          end_time: number;
          confidence: number | null;
        };
        Insert: {
          caption_id: string;
          text: string;
          start_time: number;
          end_time: number;
          confidence?: number | null;
        };
        Update: never;
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          video_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          type: string;
          video_id?: string | null;
          description?: string | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      deduct_credit: {
        Args: { p_user_id: string; p_amount?: number };
        Returns: number | null;
      };
    };
  };
};

let client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseServerClient() {
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
