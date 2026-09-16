import { useEffect, useState } from "react";
import {
  ApiError,
  fetchGenerations,
  tokenSettingsUrl,
  type Generation,
  type Variation,
} from "./api";
import { clearStoredToken, getStoredToken, setStoredToken, TOKEN_STORAGE_KEY } from "@/utils/storage";
import "./App.css";

type View =
  | { status: "loading" }
  | { status: "connect"; error?: string }
  | { status: "ready"; generations: Generation[] }
  | { status: "error"; message: string };

// What the active tab looks like right now, from the LinkedIn content
// script's point of view — checked proactively (a "ping") rather than only
// discovered after a failed Insert. Without this, every failure looked
// identical regardless of cause: wrong tab, extension not injected on this
// tab yet (needs a refresh), or simply no compose box open yet — three very
// different fixes that all produced the same unhelpful error before.
type TargetStatus =
  | "checking"
  | "no-tab"
  | "not-linkedin"
  | "no-content-script"
  | "no-compose-box"
  | "ready";

const TARGET_POLL_MS = 2000;

// Only the non-"ready" statuses need copy — "ready" and "checking" render
// their own (minimal/no) banner directly.
const TARGET_STATUS_COPY: Partial<Record<TargetStatus, string>> = {
  "no-tab": "Switch to your LinkedIn tab, then come back here.",
  "not-linkedin": "Switch to your LinkedIn tab, then come back here.",
  "no-content-script":
    "CaptionCraft isn't active on that tab yet — refresh the LinkedIn tab and try again.",
  "no-compose-box":
    'Open a LinkedIn post ("Start a post") or click into a comment box to enable Insert.',
};

const EMPTY_VARIATION: Variation = { text: "", hashtags: [] };

// Generations always have 3 variations per the /api/generate schema, but
// this reads arbitrary JSON over the network — fall back to an empty
// variation rather than crashing the side panel on malformed data.
function variationToUse(g: Generation): Variation {
  const index = g.selectedVariation ?? 0;
  return g.variations[index] ?? g.variations[0] ?? EMPTY_VARIATION;
}

function fullPostText(g: Generation) {
  const v = variationToUse(g);
  return `${v.text}\n\n${v.hashtags.join(" ")}`;
}

export default function App() {
  const [view, setView] = useState<View>({ status: "loading" });
  const [tokenInput, setTokenInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [insertStatus, setInsertStatus] = useState<Record<string, "inserting" | "done" | "failed">>(
    {}
  );
  const [targetStatus, setTargetStatus] = useState<TargetStatus>("checking");

  const load = async () => {
    const token = await getStoredToken();
    if (!token) {
      setView({ status: "connect" });
      return;
    }
    try {
      const generations = await fetchGenerations(token);
      setView({ status: "ready", generations });
    } catch (err) {
      if (err instanceof ApiError) {
        // A stored token that no longer works (revoked, or never valid) —
        // send the user back to reconnect rather than showing a dead list.
        await clearStoredToken();
        setView({ status: "connect", error: err.message });
      } else {
        setView({ status: "error", message: "Network error. Try again." });
      }
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) await load();
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    // Picks up a token the moment the one-click "Connect extension" flow
    // on the settings page finishes (see connect.content.ts) — the side
    // panel stays open throughout that handshake (unlike a popup, it
    // doesn't close when you click into the page), so without this
    // listener it would keep showing "not connected" until manually
    // closed and reopened.
    const listener = (
      changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
      areaName: string
    ) => {
      if (areaName === "local" && TOKEN_STORAGE_KEY in changes) {
        load();
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, []);

  // Proactively checks whether Insert would actually work right now,
  // instead of the user only finding out after clicking it.
  const checkTarget = async (): Promise<TargetStatus> => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return "no-tab";
    if (!tab.url?.includes("linkedin.com")) return "not-linkedin";
    try {
      const response = await browser.tabs.sendMessage(tab.id, { type: "CAPTIONCRAFT_PING" });
      if (!response?.ok) return "no-content-script";
      return response.hasComposeBox ? "ready" : "no-compose-box";
    } catch {
      // No listener on that tab — almost always means the extension was
      // installed/reloaded after this LinkedIn tab was opened, and it
      // hasn't been refreshed since.
      return "no-content-script";
    }
  };

  useEffect(() => {
    if (view.status !== "ready") return;
    let cancelled = false;

    const poll = async () => {
      const status = await checkTarget();
      if (!cancelled) setTargetStatus(status);
    };

    poll();
    const interval = setInterval(poll, TARGET_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [view.status]);

  const handleConnect = async () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    setConnecting(true);
    await setStoredToken(trimmed);
    setTokenInput("");
    setConnecting(false);
    setView({ status: "loading" });
    await load();
  };

  const handleDisconnect = async () => {
    await clearStoredToken();
    setView({ status: "connect" });
  };

  const handleInsert = async (g: Generation) => {
    setInsertStatus((s) => ({ ...s, [g.id]: "inserting" }));

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setTargetStatus("no-tab");
      setInsertStatus((s) => ({ ...s, [g.id]: "failed" }));
      return;
    }
    if (!tab.url?.includes("linkedin.com")) {
      setTargetStatus("not-linkedin");
      setInsertStatus((s) => ({ ...s, [g.id]: "failed" }));
      return;
    }

    try {
      const response = await browser.tabs.sendMessage(tab.id, {
        type: "CAPTIONCRAFT_INSERT_POST",
        text: fullPostText(g),
      });
      if (response?.ok) {
        setTargetStatus("ready");
        setInsertStatus((s) => ({ ...s, [g.id]: "done" }));
      } else {
        setTargetStatus("no-compose-box");
        setInsertStatus((s) => ({ ...s, [g.id]: "failed" }));
      }
    } catch {
      // No content script listening — most often means the LinkedIn tab
      // was open before the extension was installed/reloaded and hasn't
      // been refreshed yet.
      setTargetStatus("no-content-script");
      setInsertStatus((s) => ({ ...s, [g.id]: "failed" }));
    }
  };

  return (
    <div className="cc-sidepanel">
      <header className="cc-header">
        <span className="cc-brand">CaptionCraft</span>
        {view.status === "ready" && (
          <button type="button" className="cc-link-button" onClick={handleDisconnect}>
            Disconnect
          </button>
        )}
      </header>

      {view.status === "loading" && <p className="cc-muted">Loading…</p>}

      {view.status === "connect" && (
        <div className="cc-connect">
          <p className="cc-body">
            Connect your CaptionCraft account to see your recent posts here.
          </p>
          {view.error && <p className="cc-error">{view.error}</p>}
          <a
            href={tokenSettingsUrl()}
            target="_blank"
            rel="noreferrer"
            className="cc-button cc-button-link"
          >
            Connect account →
          </a>
          <p className="cc-muted">
            Opens captioncraft.xyz — sign in if you need to, and it connects
            automatically.
          </p>
          <details>
            <summary className="cc-link cc-summary">
              Paste a token manually instead
            </summary>
            <div className="cc-connect cc-manual-connect">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="cc_..."
                className="cc-input"
              />
              <button
                type="button"
                className="cc-button"
                disabled={!tokenInput.trim() || connecting}
                onClick={handleConnect}
              >
                {connecting ? "Connecting…" : "Connect"}
              </button>
            </div>
          </details>
        </div>
      )}

      {view.status === "error" && (
        <div className="cc-connect">
          <p className="cc-error">{view.message}</p>
          <button type="button" className="cc-button" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {view.status === "ready" && (
        <div className="cc-list">
          {TARGET_STATUS_COPY[targetStatus] && (
            <p className="cc-hint" role="status">
              {TARGET_STATUS_COPY[targetStatus]}
            </p>
          )}
          {view.generations.length === 0 && (
            <p className="cc-muted">
              No posts yet — generate one on captioncraft.xyz first.
            </p>
          )}
          {view.generations.map((g) => {
            const v = variationToUse(g);
            const status = insertStatus[g.id];
            return (
              <div key={g.id} className="cc-card">
                <p className="cc-preview">{v.text}</p>
                <div className="cc-card-footer">
                  <span className="cc-chip">{g.tone}</span>
                  <button
                    type="button"
                    className="cc-button cc-button-small"
                    disabled={status === "inserting"}
                    onClick={() => handleInsert(g)}
                  >
                    {status === "inserting"
                      ? "Inserting…"
                      : status === "done"
                        ? "Inserted"
                        : "Insert"}
                  </button>
                </div>
                {status === "failed" && (
                  <p className="cc-error cc-error-small">
                    Didn&apos;t insert — see the notice above.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
