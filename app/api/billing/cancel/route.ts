import { NextResponse } from "next/server";
import { createClient, getUser } from "@/app/lib/supabase/server";
import { getRazorpayClient } from "@/app/lib/razorpay";

// Cancels at the end of the current billing cycle (cancel_at_cycle_end) —
// the user keeps paid access through what they already paid for. The
// webhook handler picks up the eventual subscription.cancelled event and
// downgrades `plan` back to 'free' at that point; this route just requests
// the cancellation and reflects the pending state immediately.
export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("razorpay_subscription_id, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile?.razorpay_subscription_id) {
    return NextResponse.json({ error: "No active subscription." }, { status: 404 });
  }

  try {
    const razorpay = getRazorpayClient();
    const subscription = await razorpay.subscriptions.cancel(
      profile.razorpay_subscription_id,
      true // cancel_at_cycle_end
    );

    await supabase
      .from("profiles")
      .update({ subscription_status: subscription.status })
      .eq("id", user.id);

    return NextResponse.json({ status: subscription.status });
  } catch (err) {
    console.error("razorpay subscription cancel failed", err);
    return NextResponse.json({ error: "Couldn't cancel. Try again." }, { status: 502 });
  }
}
