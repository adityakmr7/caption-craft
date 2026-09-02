import { NextResponse } from "next/server";
import { createClient, getUser } from "@/app/lib/supabase/server";
import {
  BILLING_CYCLES,
  TOTAL_COUNT,
  getPlanId,
  getRazorpayClient,
  type BillingCycle,
} from "@/app/lib/razorpay";

// Creates a Razorpay subscription for the signed-in user and returns what
// the client needs to open Razorpay Checkout. Deliberately does NOT create
// a Razorpay customer here — subscriptions.create has no customer_id
// parameter; Razorpay creates/attaches the customer itself once the
// authorization payment completes in Checkout, and that's when
// razorpay_customer_id actually gets persisted (see /api/billing/verify).
// This route does NOT activate the subscription — that happens once
// Checkout completes, confirmed via /api/billing/verify (immediate) and
// the webhook (durable source of truth for the subscription's ongoing
// lifecycle).
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const cycle = body?.cycle;
  if (typeof cycle !== "string" || !BILLING_CYCLES.includes(cycle as BillingCycle)) {
    return NextResponse.json({ error: "Invalid billing cycle." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, subscription_status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Couldn't load your account. Try again." },
      { status: 500 }
    );
  }

  if (profile.subscription_status === "active") {
    return NextResponse.json(
      { error: "You already have an active subscription." },
      { status: 409 }
    );
  }

  const razorpay = getRazorpayClient();

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: getPlanId(cycle as BillingCycle),
      total_count: TOTAL_COUNT[cycle as BillingCycle],
      customer_notify: 1,
      notes: { user_id: user.id },
    });

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        razorpay_subscription_id: subscription.id,
        subscription_status: subscription.status,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("failed to persist subscription", updateError);
      return NextResponse.json(
        { error: "Couldn't start checkout. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      prefill: { email: user.email, contact: "" },
    });
  } catch (err) {
    console.error("razorpay subscription creation failed", err);
    return NextResponse.json(
      { error: "Couldn't start checkout. Try again." },
      { status: 502 }
    );
  }
}
