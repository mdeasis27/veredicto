// lib/eval/bias.ts
// Three biases every LLM judge has, measured rather than assumed:
// position bias, length bias and self-preference.
import { spearman } from "./agreement";

export type PairwiseVerdict = "first" | "second" | "tie";

export type JudgePair = { id: string; a: string; b: string };

export function positionBias(
  pairs: readonly JudgePair[],
  judge: (first: string, second: string) => PairwiseVerdict,
): { flips: number; total: number; flipRate: number; consistency: number; flippedIds: string[] } {
  const flippedIds: string[] = [];
  for (const pair of pairs) {
    const forward = judge(pair.a, pair.b);
    const reverse = judge(pair.b, pair.a);
    // Normalise both verdicts to "which argument, a or b, won".
    const winnerForward = forward === "first" ? "a" : forward === "second" ? "b" : "tie";
    const winnerReverse = reverse === "first" ? "b" : reverse === "second" ? "a" : "tie";
    if (winnerForward !== winnerReverse) flippedIds.push(pair.id);
  }
  const total = pairs.length;
  const flips = flippedIds.length;
  return {
    flips,
    total,
    flipRate: total === 0 ? 0 : flips / total,
    consistency: total === 0 ? 0 : 1 - flips / total,
    flippedIds,
  };
}

/** Rank correlation between a judge's score and the output length. */
export function lengthBias(
  items: readonly { score: number; length: number }[],
): number {
  if (items.length < 2) return 0;
  return spearman(
    items.map((i) => i.score),
    items.map((i) => i.length),
  );
}

export function selfPreference(
  selfScores: readonly number[],
  competitorScores: readonly number[],
): { meanSelf: number; meanCompetitor: number; delta: number; selfWinRate: number } {
  if (selfScores.length !== competitorScores.length || selfScores.length === 0) {
    throw new Error("selfPreference: arrays must be equal, non-empty length");
  }
  const n = selfScores.length;
  const meanSelf = selfScores.reduce((s, v) => s + v, 0) / n;
  const meanCompetitor = competitorScores.reduce((s, v) => s + v, 0) / n;
  let wins = 0;
  for (let i = 0; i < n; i += 1) if (selfScores[i] > competitorScores[i]) wins += 1;
  return {
    meanSelf,
    meanCompetitor,
    delta: meanSelf - meanCompetitor,
    selfWinRate: wins / n,
  };
}
