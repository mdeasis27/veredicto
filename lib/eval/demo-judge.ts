// lib/eval/demo-judge.ts
// Deterministic lexical judge used ONLY by the offline demo.
//
// It is deliberately naive — a lexical-overlap proxy — because the point of the
// demo is to measure a judge's agreement with humans, and a weak judge is what
// makes that measurement non-trivial. The production judge is an LLM behind the
// same interface; the harness does not care which one it scores.

export type JudgeScores = {
  correccion: number;
  completitud: number;
  confidence: number;
};

const STOP = new Set([
  "de", "la", "el", "los", "las", "un", "una", "unos", "unas",
  "es", "son", "por", "para", "con", "en", "y", "o", "a", "al",
  "del", "se", "que", "no", "su", "sus", "lo", "este", "esta",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOP.has(t));
}

function toOrdinal(value: number, high: number, low: number): number {
  if (value >= high) return 3;
  if (value >= low) return 2;
  return 1;
}

export function demoJudgeScore(answer: string, source: string): JudgeScores {
  const answerTokens = new Set(tokens(answer));
  const sourceTokens = new Set(tokens(source));
  const supported = [...answerTokens].filter((t) => sourceTokens.has(t)).length;
  const coverage = answerTokens.size === 0 ? 0 : supported / answerTokens.size;
  const completeness = sourceTokens.size === 0 ? 0 : supported / sourceTokens.size;
  return {
    correccion: toOrdinal(coverage, 0.5, 0.2),
    completitud: toOrdinal(completeness, 0.35, 0.12),
    confidence: Math.min(0.95, 0.5 + 0.45 * coverage),
  };
}

export function judgeTotal(scores: JudgeScores): number {
  return scores.correccion + scores.completitud;
}
