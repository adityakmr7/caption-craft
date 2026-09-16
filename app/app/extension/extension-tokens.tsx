"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Copy, Loader2, Trash2 } from "lucide-react";

type TokenRow = {
  id: string;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
};

type ConnectStatus = "idle" | "waiting" | "connected" | "timeout";

const CONNECT_TIMEOUT_MS = 2500;

// Token management for the Chrome extension's "smart paste" helper (see
// app/lib/extension-auth.ts). Two ways to hand a token to the extension:
//
//  1. One click ("Connect extension"): mints a token and hands it
//     straight to the extension via window.postMessage. The extension's
//     connect content script (extension/entrypoints/connect.content.ts)
//     — which only runs on this exact page — listens for it, stores it,
//     and posts back an acknowledgment. No copying, no pasting.
//  2. Manual paste, kept as a fallback for when the extension isn't
//     detected (not installed yet, wrong browser/profile, or the content
//     script hasn't loaded) — same as before this flow existed.
//
// Either way the raw token is only ever shown once, in the response to
// the create call — after that it's gone from the server for good,
// matching how GitHub/Vercel personal access tokens work.
export default function ExtensionTokens({ autoConnect = false }: { autoConnect?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tokens, setTokens] = useState<TokenRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>("idle");

  const load = useCallback(async () => {
    const res = await fetch("/api/extension/tokens");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setTokens(data.tokens ?? []);
  }, []);

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
  }, [load]);

  useEffect(() => {
    // Listens for the extension's ack after the one-click connect flow
    // below hands it a token — see connect.content.ts for the other side
    // of this handshake. Origin- and shape-checked before trusting it.
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;
      if (event.data?.source === "captioncraft-extension" && event.data?.type === "CAPTIONCRAFT_CONNECTED") {
        setConnectStatus("connected");
        setNewToken(null);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (connectStatus !== "waiting") return;
    const timer = setTimeout(() => {
      setConnectStatus((s) => (s === "waiting" ? "timeout" : s));
    }, CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [connectStatus]);

  // Shared by both the one-click and manual-paste flows below. Memoized so
  // the auto-connect effect below can depend on it without re-firing on
  // every render.
  const mintToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/extension/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't create a token.");
        return null;
      }
      await load();
      return data.token as string;
    } catch {
      setError("Network error. Try again.");
      return null;
    }
  }, [load]);

  const handleConnectExtension = useCallback(async () => {
    setError(null);
    setConnectStatus("waiting");
    const token = await mintToken();
    if (!token) {
      setConnectStatus("idle");
      return;
    }
    window.postMessage(
      { source: "captioncraft-web", type: "CAPTIONCRAFT_CONNECT_TOKEN", token },
      window.location.origin
    );
    // Kept around only as the manual-copy fallback if the handshake
    // above times out with no ack from the extension.
    setNewToken(token);
  }, [mintToken]);

  // Arriving here with ?connect=1 (from the extension popup's "Connect
  // account" link, possibly round-tripped through a login redirect — see
  // app/app/extension/page.tsx) means the user already expressed intent
  // to connect by clicking that link; skip the extra "Connect extension"
  // click and fire the same flow automatically, once.
  const autoConnectFired = useRef(false);
  useEffect(() => {
    if (!autoConnect || autoConnectFired.current) return;
    autoConnectFired.current = true;
    // Strip the query param immediately so a later manual refresh of this
    // page doesn't silently mint another token.
    router.replace(pathname);
    handleConnectExtension();
  }, [autoConnect, handleConnectExtension, pathname, router]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    const token = await mintToken();
    setCreating(false);
    if (token) setNewToken(token);
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
      <div className="cc-card p-5 flex flex-col gap-3">
        <p className="text-sm font-semibold text-[var(--text-1)]">Connect the extension</p>
        <p className="text-sm text-[var(--text-2)]">
          Have the CaptionCraft extension installed? Click below and it connects
          automatically — nothing to copy.
        </p>
        <button
          type="button"
          onClick={handleConnectExtension}
          disabled={connectStatus === "waiting"}
          className="btn-primary self-start inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connectStatus === "waiting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : connectStatus === "connected" ? (
            <>
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Connected
            </>
          ) : (
            "Connect extension"
          )}
        </button>
        {connectStatus === "timeout" && (
          <p className="text-xs text-[var(--text-3)]">
            Didn&apos;t detect the extension. Make sure it&apos;s installed in this
            browser, then try again — or copy a token manually below.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <details>
        <summary className="cursor-pointer text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
          Copy a token manually instead
        </summary>
        <div className="mt-3 flex flex-col gap-3">
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
                Paste it into the CaptionCraft extension popup&apos;s &quot;Paste a
                token manually&quot; field.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="btn-ghost self-start inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
      </details>

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
