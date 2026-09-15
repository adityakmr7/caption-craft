"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Trash2 } from "lucide-react";

type TokenRow = {
  id: string;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
};

// Token management for the Chrome extension's "smart paste" helper (see
// app/lib/extension-auth.ts). The raw token is only ever shown once, in
// the response to the create call below — after that it's gone from the
// server for good, matching how GitHub/Vercel personal access tokens work.
export default function ExtensionTokens() {
  const [tokens, setTokens] = useState<TokenRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/extension/tokens");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setTokens(data.tokens ?? []);
  };

  useEffect(() => {
    // Standard fetch-on-mount shape: an ignore flag means a setState
    // from a stale run (e.g. after fast unmount/remount) is a no-op
    // rather than updating state nothing is looking at anymore.
    let ignore = false;
    (async () => {
      if (!ignore) await load();
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/extension/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't create a token.");
        return;
      }
      setNewToken(data.token);
      await load();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — the token is still visible to copy manually
    }
  };

  const handleRevoke = async (id: string) => {
    await fetch(`/api/extension/tokens/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="flex flex-col gap-5">
      {newToken && (
        <div className="cc-card p-5 flex flex-col gap-3 border-[var(--accent)]">
          <p className="text-sm font-semibold text-[var(--text-1)]">
            Copy this token now — you won&apos;t be able to see it again
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded-[0.5rem] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-1)]">
              {newToken}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-[var(--text-3)]">
            Paste it into the CaptionCraft extension popup&apos;s &quot;Connect&quot;
            field.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="btn-primary self-start inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate a new token"
        )}
      </button>

      <div className="flex flex-col gap-2">
        {tokens === null && <p className="text-sm text-[var(--text-3)]">Loading…</p>}
        {tokens?.length === 0 && (
          <p className="text-sm text-[var(--text-3)]">No tokens yet.</p>
        )}
        {tokens?.map((t) => (
          <div
            key={t.id}
            className="cc-card px-4 py-3 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm text-[var(--text-1)]">{t.label || "Chrome extension"}</p>
              <p className="text-xs text-[var(--text-3)]">
                Created{" "}
                {new Date(t.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                {t.last_used_at
                  ? `Last used ${new Date(t.last_used_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}`
                  : "Never used"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleRevoke(t.id)}
              title="Revoke"
              className="text-[var(--text-3)] hover:text-red-400 transition-colors shrink-0"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              <span className="sr-only">Revoke</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
