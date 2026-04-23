import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import bundledSpeakerSeed from "./src/speakersSeed.js";

/** Vite has no Worker/D1: stub GET /api/speaker-profiles/public so the Speakers tab works in dev. */
function devSpeakerProfilesPublicBody() {
  const plenary = [];
  const congress = [];
  for (const s of bundledSpeakerSeed) {
    const row = {
      id: `dev-seed-${s.key}`,
      key: s.key,
      name: s.name,
      affiliation: s.affiliation,
      image: s.image || null,
      r2_key: null,
      image_position: s.imagePosition || null,
    };
    if (s.tier === "plenary") plenary.push(row);
    else congress.push(row);
  }
  const byName = (a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      sensitivity: "base",
    });
  plenary.sort(byName);
  congress.sort(byName);
  return JSON.stringify({ success: true, plenary, congress });
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "dev-speaker-profiles-public",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split("?")[0] || "";
          if (path === "/api/speaker-profiles/public" && req.method === "GET") {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Cache-Control", "private, no-store, max-age=0");
            res.end(devSpeakerProfilesPublicBody());
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    watch: {
      usePolling: true,
    },
  },
});
