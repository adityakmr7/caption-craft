// Smart-paste helper: inserts a CaptionCraft post into LinkedIn's compose
// box on request from the popup. Deliberately does nothing else — never
// reads LinkedIn's page content, never clicks Post, never runs
// automatically. It only acts when the user explicitly clicks "Insert"
// in the extension popup, which is functionally the same as the user
// pasting their own clipboard content — not automated posting, which is
// the LinkedIn ToS risk this extension is designed to stay well clear of.

interface InsertPostMessage {
  type: "CAPTIONCRAFT_INSERT_POST";
  text: string;
}

export default defineContentScript({
  matches: ["*://*.linkedin.com/*"],
  main() {
    browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
      if (!isInsertPostMessage(message)) return;
      sendResponse({ ok: insertIntoComposeBox(message.text) });
    });
  },
});

function isInsertPostMessage(message: unknown): message is InsertPostMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: unknown }).type === "CAPTIONCRAFT_INSERT_POST" &&
    typeof (message as { text?: unknown }).text === "string"
  );
}

// LinkedIn's post, comment, and message editors are all built on Quill,
// whose editable surface is `.ql-editor[contenteditable="true"]` — there
// is no documented, stable way to tell which one is "the post composer"
// from the outside, so this is inherently best-effort against
// undocumented DOM that LinkedIn can change at any time:
//  1. Prefer whichever editor currently has focus (the user's own click
//     into the box they want text inserted into).
//  2. Otherwise fall back to the largest visible editor on the page —
//     the main post composer is reliably taller than a comment or
//     message box.
function findComposeBox(): HTMLElement | null {
  const active = document.activeElement as HTMLElement | null;
  if (active?.matches?.('.ql-editor[contenteditable="true"]')) {
    return active;
  }

  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('.ql-editor[contenteditable="true"]')
  ).filter((el) => el.offsetParent !== null);

  if (candidates.length === 0) return null;

  return candidates.reduce((largest, el) =>
    el.getBoundingClientRect().height > largest.getBoundingClientRect().height ? el : largest
  );
}

function insertIntoComposeBox(text: string): boolean {
  const target = findComposeBox();
  if (!target) return false;

  target.focus();

  // Select all existing content first so inserting replaces rather than
  // appends after whatever was already there — matches what a user
  // pasting fresh text into a box would expect.
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // execCommand is deprecated but remains the most reliable way to
  // insert text into a framework-controlled contenteditable such that
  // the framework's own input listeners fire correctly. Directly
  // mutating textContent/innerHTML does not trigger the events
  // Quill/React listen for, which leaves the visible text out of sync
  // with the framework's internal state (LinkedIn would still think the
  // box is empty even though text is visibly there).
  const inserted = document.execCommand("insertText", false, text);
  if (!inserted) {
    // Fallback for a browser without execCommand support: dispatch the
    // standard Input Events that a framework's beforeinput/input
    // listeners are built to react to.
    target.dispatchEvent(
      new InputEvent("beforeinput", {
        data: text,
        inputType: "insertText",
        bubbles: true,
        cancelable: true,
      })
    );
    target.textContent = text;
    target.dispatchEvent(
      new InputEvent("input", { data: text, inputType: "insertText", bubbles: true })
    );
  }

  return true;
}
