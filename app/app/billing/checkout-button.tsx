"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type BillingCycle = "monthly" | "yearly";

// Razorpay's own hosted Checkout script — not bundled, loaded on demand so
// it never ships to users who aren't at the billing page.
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckoutScript(): Promise<void> {
  if (document.querySelector(`script[src="${CHECKOUT_SRC}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

// window.Razorpay is injected by the script above — narrowly typed to just
// what this component calls, rather than a full SDK type.
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutButton({
  cycle,
  label,
  className,
}: {
  cycle: BillingCycle;
  label: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setStatus("loading");
    setError(null);

    try {
      const [subscribeRes] = await Promise.all([
        fetch("/api/billing/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cycle }),
        }),
        loadCheckoutScript(),
      ]);

      const data = await subscribeRes.json().catch(() => ({}));
      if (!subscribeRes.ok) {
        setError(data?.error || "Couldn't start checkout.");
        setStatus("idle");
        return;
      }

      if (!window.Razorpay) {
        setError("Checkout failed to load. Try again.");
        setStatus("idle");
        return;
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "CaptionCraft",
        description:
          cycle === "monthly" ? "CaptionCraft Pro — Monthly" : "CaptionCraft Pro — Yearly",
        prefill: data.prefill,
        theme: { color: "#d99a3e" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            window.location.href = "/app?upgraded=1";
          } else {
            setError("Payment succeeded but we couldn't confirm it — refresh in a moment.");
            setStatus("idle");
          }
        },
        modal: {
          ondismiss: () => setStatus("idle"),
        },
      });

      checkout.open();
      setStatus("idle");
    } catch {
      setError("Something went wrong. Try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className={className ?? "btn-primary px-5 py-3 text-sm font-semibold"}
      >
        {status === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting checkout...
          </span>
        ) : (
          label
        )}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
