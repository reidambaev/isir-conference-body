import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const sql = `SELECT id, invited_speaker_email, passport_name, nationality, guest_count, address_physical, contact_email, phone, arrival_date, departure_date, created_at, updated_at FROM speaker_hotel_registrations ORDER BY updated_at DESC`;

const raw = execSync(
  `npx wrangler d1 execute isir-registrations --remote --command ${JSON.stringify(sql)} --json`,
  { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
);

const data = JSON.parse(raw);
const rows = data[0]?.results ?? [];

const headers = [
  "id",
  "invited_speaker_email",
  "passport_name",
  "nationality",
  "guest_count",
  "address_physical",
  "contact_email",
  "phone",
  "arrival_date",
  "departure_date",
  "created_at",
  "updated_at",
];

const esc = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const lines = [headers.join(",")];
for (const row of rows) {
  lines.push(headers.map((h) => esc(row[h])).join(","));
}

const date = new Date().toISOString().slice(0, 10);
const outDir = path.join(root, "exports");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `speaker-hotel-registrations-${date}.csv`);
fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");

console.log(`Exported ${rows.length} registration(s) to ${outPath}`);
