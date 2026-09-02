"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteGenerationButton({ id }: { id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setStatus("loading");
    const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {status === "error" && (
        <span className="text-xs text-red-400">Couldn&apos;t delete</span>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={status === "loading"}
        title="Delete this post"
        className="text-[var(--text-3)] hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        )}
        <span className="sr-only">Delete</span>
      </button>
    </div>
  );
}
