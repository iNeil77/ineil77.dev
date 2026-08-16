// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static output — deployed to Cloudflare Pages as plain files (dist/).
export default defineConfig({
  site: "https://ineil77.dev",
  integrations: [sitemap()],
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
});
