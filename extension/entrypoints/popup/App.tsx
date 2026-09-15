import { useEffect, useState } from "react";
import {
  ApiError,
  fetchGenerations,
  tokenSettingsUrl,
  type Generation,
  type Variation,
} from "./api";
import { clearStoredToken, getStoredToken, setStoredToken } from "./storage";
import "./App.css";

type View =
  | { status: "loading" }
  | { status: "connect"; error?: string }
  | { status: "ready"; generations: Generation[] }
  | { status: "error"; message: string };

const EMPTY_VARIATION: Variation = { text: "", hashtags: [] };

// Generations always have 3 variations per the /api/generate schema, but
// this reads arbitrary JSON over the network — fall back to an empty
// variation rather than crashing the popup on malformed data.
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
    load();
  }, []);

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
    if (!tab?.id || !tab.url?.includes("linkedin.com")) {
      setInsertStatus((s) => ({ ...s, [g.id]: "failed" }));
      return;
    }

    try {
      const response = await browser.tabs.sendMessage(tab.id, {
        type: "CAPTIONCRAFT_INSERT_POST",
        text: fullPostText(g),
      });
      setInsertStatus((s) => ({ ...s, [g.id]: response?.ok ? "done" : "failed" }));
    } catch {
      // No content script listening — most often means the LinkedIn tab
      // was open before the extension was installed/reloaded and hasn't
      // been refreshed yet.
      setInsertStatus((s) => ({ ...s, [g.id]: "failed" }));
    }
  };

  return (
    <div className="cc-popup">
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
            Paste a personal access token from your CaptionCraft account to see your
            recent posts here.
          </p>
          {view.error && <p className="cc-error">{view.error}</p>}
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
          <a
            href={tokenSettingsUrl()}
            target="_blank"
            rel="noreferrer"
            className="cc-link"
          >
            Get a token →
          </a>
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
                    Open a LinkedIn post/comment box, click into it, then try again.
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
