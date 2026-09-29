// lib/eval/diff.ts
// Regression detection between two eval runs — the core value of the harness.
import type { Diff, RunResult } from "./types";

export type DiffThresholds = {
  /** Percentage-point drop that raises a warning. */
  warningPct: number;
  /** Percentage-point drop that blocks the release. */
  criticalPct: number;
};

export const DEFAULT_THRESHOLDS: DiffThresholds = { warningPct: 3, criticalPct: 8 };

export function compareRuns(
  baseline: RunResult,
  current: RunResult,
  thresholds: DiffThresholds = DEFAULT_THRESHOLDS,
): Diff {
  const previous = new Map(baseline.cases.map((c) => [c.id, c.passed]));
  const regressions: string[] = [];
  const improvements: string[] = [];

  for (const outcome of current.cases) {
    const before = previous.get(outcome.id);
    if (before === undefined) continue;
    if (before && !outcome.passed) regressions.push(outcome.id);
    if (!before && outcome.passed) improvements.push(outcome.id);
  }

  const passRateBaseline = baseline.metrics.passRate;
  const passRateCurrent = current.metrics.passRate;
  const deltaPoints = (passRateCurrent - passRateBaseline) * 100;

  let severity: Diff["severity"] = "ok";
  if (deltaPoints <= -thresholds.criticalPct) severity = "critical";
  else if (deltaPoints <= -thresholds.warningPct) severity = "warning";

  return {
    passRateBaseline,
    passRateCurrent,
    deltaPoints,
    regressions: regressions.sort(),
    improvements: improvements.sort(),
    severity,
  };
}
