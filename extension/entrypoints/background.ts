// Only job: make clicking the toolbar icon open the side panel instead of
// a transient popup. A popup auto-closes the instant it loses focus, which
// is exactly wrong for this extension's workflow — open a LinkedIn compose
// box, click into it, then use CaptionCraft without losing your place. The
// side panel stays open alongside the page for that reason.
export default defineBackground(() => {
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error("Failed to set side panel behavior:", error));
});
