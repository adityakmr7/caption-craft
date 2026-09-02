import Razorpay from "razorpay";

// Server-only Razorpay client. RAZORPAY_KEY_SECRET must never reach the
// browser. RAZORPAY_KEY_ID isn't secret (Checkout.js needs it client-side),
// but rather than duplicating it into a NEXT_PUBLIC_ var, the client gets
// it from /api/billing/subscribe's response — one less place to keep in
// sync.

let client: Razorpay | null = null;

export function getRazorpayClient() {
  if (client) return client;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables"
    );
  }

  client = new Razorpay({ key_id, key_secret });
  return client;
}

export const BILLING_CYCLES = ["monthly", "yearly"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

// Plan IDs come from Razorpay's Plans API (created once via
// scripts/create-razorpay-plans.mjs) — not creatable per-request, so they're
// pinned via env vars rather than hardcoded.
export function getPlanId(cycle: BillingCycle): string {
  const id =
    cycle === "monthly"
      ? process.env.RAZORPAY_PLAN_ID_MONTHLY
      : process.env.RAZORPAY_PLAN_ID_YEARLY;

  if (!id) {
    throw new Error(
      `Missing RAZORPAY_PLAN_ID_${cycle.toUpperCase()} environment variable — run scripts/create-razorpay-plans.mjs first.`
    );
  }
  return id;
}

// Total billing cycles Razorpay will auto-charge before the subscription
// needs re-authorization. Set generously (~10 years) so it behaves like an
// indefinite subscription in practice; cancellation is handled via the
// Subscriptions API, not by letting total_count run out.
export const TOTAL_COUNT: Record<BillingCycle, number> = {
  monthly: 120,
  yearly: 10,
};

// Reverse lookup — the webhook/verify handlers get a plan_id back from
// Razorpay and need to know which of our two plans (and therefore which
// `profiles.plan` value) it corresponds to.
export function cycleForPlanId(planId: string): BillingCycle | null {
  if (planId === process.env.RAZORPAY_PLAN_ID_MONTHLY) return "monthly";
  if (planId === process.env.RAZORPAY_PLAN_ID_YEARLY) return "yearly";
  return null;
}
