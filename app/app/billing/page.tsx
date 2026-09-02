import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/app/lib/supabase/server";
import CheckoutButton from "./checkout-button";
import ManageSubscription from "./manage-subscription";

const PRO_FEATURES = [
  "Unlimited generations (fair-use capped)",
  "All post types — Milestone, Lesson, Contrarian, Data",
  "Full post history",
  "Priority support",
];

export default async function BillingPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/app/billing");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, subscription_status, current_period_end")
    .eq("id", user.id)
    .single();

  const isActive =
    profile?.plan !== "free" &&
    (profile?.subscription_status === "active" || profile?.subscription_status === "authenticated");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] px-6 py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back to app
        </Link>

        <div>
          <h1 className="text-2xl font-semibold mb-1">Billing</h1>
          <p className="text-sm text-[var(--text-3)]">
            ₹299/mo or ₹2,999/yr — UPI AutoPay or card, billed by Razorpay.
          </p>
        </div>

        {isActive ? (
          <div className="cc-card p-6 flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--accent)] capitalize">
                {profile?.plan} plan — active
              </p>
              {profile?.current_period_end && (
                <p className="text-sm text-[var(--text-3)] mt-1">
                  Renews {new Date(profile.current_period_end).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <ManageSubscription />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="cc-card p-6 flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-1)]">Monthly</p>
                <p className="text-2xl font-semibold mt-1">₹299<span className="text-sm font-normal text-[var(--text-3)]">/mo</span></p>
              </div>
              <CheckoutButton cycle="monthly" label="Subscribe monthly" />
            </div>
            <div className="cc-card p-6 flex flex-col gap-4 border-[var(--accent)]">
              <div>
                <p className="text-sm font-semibold text-[var(--accent)]">Yearly — save 16%</p>
                <p className="text-2xl font-semibold mt-1">₹2,999<span className="text-sm font-normal text-[var(--text-3)]">/yr</span></p>
              </div>
              <CheckoutButton cycle="yearly" label="Subscribe yearly" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {PRO_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-[var(--text-2)]">
              <Check className="h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={2.5} />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
