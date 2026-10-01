// lib/db/client.ts
// Real Postgres access (Neon serverless) for the Veredicto demo. The schema is
// isolated under the "veredicto" Postgres schema so sibling projects can share
// the same database without table collisions.

import { neon } from "@neondatabase/serverless";

export const DB_SCHEMA = "veredicto";
export const TABLES = ["scores"] as const;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}
