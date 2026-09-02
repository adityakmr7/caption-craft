// One-time setup script: creates the two Razorpay Plans CaptionCraft bills
// against (₹299/mo, ₹2,999/yr — PRD §7.1). Run once per Razorpay mode
// (test, then again in live once you're ready to go live) — plans aren't
// shared between test and live mode.
//
// Usage:
//   RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx node scripts/create-razorpay-plans.mjs
//
// Copy the printed plan IDs into RAZORPAY_PLAN_ID_MONTHLY / _YEARLY (env,
// then `vercel env add` for the deployed value).

import Razorpay from "razorpay";

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  console.error(
    "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET before running this script."
  );
  process.exit(1);
}

const razorpay = new Razorpay({ key_id, key_secret });

const plans = [
  {
    period: "monthly",
    interval: 1,
    item: {
      name: "CaptionCraft Pro — Monthly",
      amount: 29900, // paise — ₹299
      currency: "INR",
      description: "CaptionCraft Pro subscription, billed monthly",
    },
  },
  {
    period: "yearly",
    interval: 1,
    item: {
      name: "CaptionCraft Pro — Yearly",
      amount: 299900, // paise — ₹2,999
      currency: "INR",
      description: "CaptionCraft Pro subscription, billed yearly",
    },
  },
];

for (const plan of plans) {
  const created = await razorpay.plans.create(plan);
  const envVar =
    plan.period === "monthly"
      ? "RAZORPAY_PLAN_ID_MONTHLY"
      : "RAZORPAY_PLAN_ID_YEARLY";
  console.log(`${envVar}=${created.id}`);
}
