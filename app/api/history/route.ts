import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";

export async function GET() {
  try {
    const db = getSql();
    const rows = await db`SELECT id, correccion, completitud, confidence, total, created_at FROM veredicto.scores ORDER BY id DESC LIMIT 20`;
    return NextResponse.json({ scores: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error leyendo historial" },
      { status: 500 },
    );
  }
}
