"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ManageSubscription() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleCancel = async () => {
    if (!window.confirm("Cancel your subscription? You will keep access until the current billing period ends.")) {
      return;
    }
    setStatus("loading");
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    setStatus(res.ok ? "done" : "error");
  };

  if (status === "done") {
    return (
      <p className="text-sm text-[var(--text-2)]">
        Cancellation requested — you will keep Pro access until the end of your current billing period.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={status === "loading"}
        className="btn-ghost px-4 py-2 text-sm font-semibold self-start"
      >
        {status === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cancelling...
          </span>
        ) : (
          "Cancel subscription"
        )}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-400">Could not cancel. Try again.</p>
      )}
    </div>
  );
}
