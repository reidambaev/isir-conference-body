import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import bundledSpeakerSeed from "./src/speakersSeed.js";

/** Vite has no Worker/D1: stub GET /api/speaker-profiles/public so the Speakers tab works in dev. */
function splitNameParts(fullName) {
  const normalized = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!normalized) return { first_names: "", last_name: "" };
  const parts = normalized.split(" ");
  if (parts.length === 1) {
    return { first_names: "", last_name: parts[0] };
  }
  return {
    first_names: parts.slice(0, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

function sortByLastNameAsc(a, b) {
  const byLast = String(a.last_name || "").localeCompare(
    String(b.last_name || ""),
    undefined,
    { sensitivity: "base" },
  );
  if (byLast !== 0) return byLast;
  const byFirst = String(a.first_names || "").localeCompare(
    String(b.first_names || ""),
    undefined,
    { sensitivity: "base" },
  );
  if (byFirst !== 0) return byFirst;
  return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
    sensitivity: "base",
  });
}

function devSpeakerProfilesPublicBody() {
  const plenary = [];
  const congress = [];
  for (const s of bundledSpeakerSeed) {
    const name = String(s.name || "");
    const { first_names, last_name } = splitNameParts(name);
    const row = {
      id: `dev-seed-${s.key}`,
      key: s.key,
      name,
      first_names,
      last_name,
      affiliation: s.affiliation,
      image: s.image || null,
      r2_key: null,
      image_position: s.imagePosition || null,
    };
    if (s.tier === "plenary") plenary.push(row);
    else congress.push(row);
  }
  plenary.sort(sortByLastNameAsc);
  congress.sort(sortByLastNameAsc);
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
