// scripts/seed.mjs
// Creates the veredicto schema + scores table and seeds sample history rows.
// Run: node scripts/seed.mjs  (requires DATABASE_URL in env or .env.local)

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* no .env.local */
  }
}

loadEnv();

const sql = neon(process.env.DATABASE_URL);

const SCORES = [
  [3, 2, 0.72, 5],
  [3, 3, 0.95, 6],
  [2, 1, 0.45, 3],
  [1, 1, 0.38, 2],
];

async function main() {
  await sql`CREATE SCHEMA IF NOT EXISTS veredicto`;
  await sql`DROP TABLE IF EXISTS veredicto.scores`;

  await sql`
    CREATE TABLE veredicto.scores (
      id serial PRIMARY KEY,
      correccion integer NOT NULL,
      completitud integer NOT NULL,
      confidence numeric NOT NULL,
      total integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;

  for (const [correccion, completitud, confidence, total] of SCORES) {
    await sql`INSERT INTO veredicto.scores (correccion, completitud, confidence, total) VALUES (${correccion}, ${completitud}, ${confidence}, ${total})`;
  }

  const [{ c }] = await sql`SELECT count(*)::int AS c FROM veredicto.scores`;
  console.log(`Seeded veredicto schema: ${c} scores`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
