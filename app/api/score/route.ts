import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { demoJudgeScore, judgeTotal } from "@/lib/eval/demo-judge";

export async function POST(request: Request) {
  let answer: string;
  let source: string;
  try {
    const body = await request.json();
    answer = typeof body.answer === "string" ? body.answer.trim() : "";
    source = typeof body.source === "string" ? body.source.trim() : "";
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  if (!answer || !source) {
    return NextResponse.json({ error: "Escribe una fuente y una respuesta" }, { status: 400 });
  }

  const scores = demoJudgeScore(answer, source);
  const total = judgeTotal(scores);

  let persisted = true;
  try {
    const db = getSql();
    await db`INSERT INTO veredicto.scores (correccion, completitud, confidence, total) VALUES (${scores.correccion}, ${scores.completitud}, ${scores.confidence}, ${total})`;
  } catch {
    persisted = false;
  }

  return NextResponse.json({
    correccion: scores.correccion,
    completitud: scores.completitud,
    confidence: scores.confidence,
    total,
    persisted,
  });
}
