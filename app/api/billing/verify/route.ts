import { NextResponse } from "next/server";
// validatePaymentVerification isn't attached to the Razorpay class (only
// validateWebhookSignature is, per node_modules/razorpay/dist/razorpay.js)
// — it only exists in this utils submodule.
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { createClient, getUser } from "@/app/lib/supabase/server";
import { cycleForPlanId, getRazorpayClient } from "@/app/lib/razorpay";

// Called by the client immediately after Razorpay Checkout's handler fires
// (i.e. the authorization payment succeeded). This gives the user instant
// feedback instead of waiting on webhook delivery. It is NOT the sole
// source of truth, though — /api/billing/webhook independently reconciles
// the subscription's state on every lifecycle event (renewals, failures,
// cancellations), so a missed or replayed call here is not a correctness
// issue.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const paymentId = body?.razorpay_payment_id;
  const subscriptionId = body?.razorpay_subscription_id;
  const signature = body?.razorpay_signature;

  if (
    typeof paymentId !== "string" ||
    typeof subscriptionId !== "string" ||
    typeof signature !== "string"
  ) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Billing is misconfigured." }, { status: 500 });
  }

  const isValid = validatePaymentVerification(
    { payment_id: paymentId, subscription_id: subscriptionId },
    signature,
    keySecret
  );

  if (!isValid) {
    console.error("razorpay verify: signature mismatch", { subscriptionId, userId: user.id });
    return NextResponse.json({ error: "Verification failed." }, { status: 400 });
  }

  const supabase = await createClient();

  // Defense in depth: only let a user verify a subscription they actually
  // created (subscribe route wrote razorpay_subscription_id onto their own
  // row) — the signature check above already proves the payload is
  // authentically from Razorpay, this just stops it being replayed against
  // the wrong account.
  const { data: profile } = await supabase
    .from("profiles")
    .select("razorpay_subscription_id")
    .eq("id", user.id)
    .single();

  if (profile?.razorpay_subscription_id !== subscriptionId) {
    return NextResponse.json({ error: "Subscription mismatch." }, { status: 403 });
  }

  const razorpay = getRazorpayClient();
  const subscription = await razorpay.subscriptions.fetch(subscriptionId);
  const cycle = cycleForPlanId(subscription.plan_id);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      // Razorpay creates/attaches the customer during Checkout itself
      // (subscriptions.create has no customer_id param — see
      // /api/billing/subscribe) — this fetch is the first point
      // razorpay_customer_id is actually known.
      razorpay_customer_id: subscription.customer_id,
      subscription_status: subscription.status,
      current_period_end: subscription.current_end
        ? new Date(subscription.current_end * 1000).toISOString()
        : null,
      ...(cycle ? { plan: cycle } : {}),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("failed to persist verified subscription", updateError);
    return NextResponse.json({ error: "Couldn't update your account." }, { status: 500 });
  }

  return NextResponse.json({ status: subscription.status });
}
