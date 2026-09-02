import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSupabaseAdminClient } from "@/app/lib/supabase/admin";
import { cycleForPlanId } from "@/app/lib/razorpay";

export const runtime = "nodejs";

// Durable source of truth for subscription state — unlike /api/billing/verify
// (client-triggered, best-effort UX), this is what Razorpay itself calls on
// every lifecycle event (renewals, failures, cancellations), so it's what
// actually keeps `profiles.plan` correct over the life of a subscription.
//
// Statuses that end paid access downgrade `plan` back to 'free' immediately
// rather than waiting for a grace period — access should track "are they
// actually paying", and downgrading is the conservative direction to err
// toward (worst case a payment recovers and the next event re-upgrades them;
// the alternative, leaving paid access on by default, risks unbounded AI
// cost exposure on a lapsed subscription).
const ACCESS_ENDING_STATUSES = new Set(["cancelled", "completed", "expired", "halted"]);

type SubscriptionEntity = {
  id: string;
  status: string;
  plan_id: string;
  current_end: number | null;
  customer_id: string | null;
};

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id");
  const rawBody = await request.text();

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("razorpay webhook: RAZORPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook misconfigured." }, { status: 500 });
  }

  if (!signature || !Razorpay.validateWebhookSignature(rawBody, signature, webhookSecret)) {
    console.error("razorpay webhook: signature verification failed");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (!eventId) {
    // Every real Razorpay webhook delivery carries this header — its
    // absence means this isn't a delivery we can safely dedupe.
    return NextResponse.json({ error: "Missing event id." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const admin = getSupabaseAdminClient();

  // Idempotency: Razorpay retries on any non-2xx or timeout, so the same
  // event id can arrive more than once. The unique constraint on
  // razorpay_event_id makes this insert the atomic "have I seen this
  // before?" check — a conflict means a duplicate delivery, safe to no-op.
  const { error: insertError } = await admin.from("billing_events").insert({
    razorpay_event_id: eventId,
    event_type: event.event,
    payload: event,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      // Duplicate delivery — already processed.
      return NextResponse.json({ status: "duplicate" });
    }
    console.error("razorpay webhook: failed to record event", insertError);
    return NextResponse.json({ error: "Couldn't record event." }, { status: 500 });
  }

  if (!event.event?.startsWith("subscription.")) {
    // payment.*, order.*, refund.* etc. — not relevant to subscription
    // state, but already recorded above for audit purposes.
    return NextResponse.json({ status: "ignored" });
  }

  const entity: SubscriptionEntity | undefined = event.payload?.subscription?.entity;
  if (!entity?.id) {
    console.error("razorpay webhook: unexpected payload shape", event.event);
    return NextResponse.json({ error: "Unexpected payload." }, { status: 400 });
  }

  const cycle = cycleForPlanId(entity.plan_id);
  const downgrade = ACCESS_ENDING_STATUSES.has(entity.status);

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      ...(entity.customer_id ? { razorpay_customer_id: entity.customer_id } : {}),
      subscription_status: entity.status,
      current_period_end: entity.current_end
        ? new Date(entity.current_end * 1000).toISOString()
        : null,
      plan: downgrade ? "free" : cycle ?? undefined,
    })
    .eq("razorpay_subscription_id", entity.id);

  if (updateError) {
    console.error("razorpay webhook: failed to update profile", updateError);
    return NextResponse.json({ error: "Couldn't update subscription." }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
