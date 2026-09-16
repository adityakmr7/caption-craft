import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "CaptionCraft for LinkedIn",
    description:
      "Insert a CaptionCraft-generated post into LinkedIn's compose box without switching tabs. Never posts on your behalf — you still review and click Post yourself.",
    permissions: ["storage"],
    host_permissions: [
      "https://captioncraft.xyz/*",
      // Local dev only — remove before a Chrome Web Store submission.
      "http://localhost:3000/*",
    ],
    // No popup entrypoint anymore (see entrypoints/sidepanel/ + background.ts,
    // which makes the toolbar icon open the side panel instead) — WXT only
    // sets the `action` manifest key itself when a popup entrypoint exists,
    // so the icon's tooltip is declared here directly.
    action: {
      default_title: "CaptionCraft",
    },
  },
});
