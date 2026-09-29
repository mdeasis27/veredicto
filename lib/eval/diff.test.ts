import { describe, expect, it } from "vitest";

import { compareRuns } from "./diff";
import type { RunResult } from "./types";

function run(passed: Record<string, boolean>): RunResult {
  const cases = Object.entries(passed).map(([id, ok]) => ({
    id,
    difficulty: "single" as const,
    passed: ok,
    recall: ok ? 1 : 0,
    reciprocalRank: ok ? 1 : 0,
    ndcg: ok ? 1 : 0,
  }));
  const passRate = cases.filter((c) => c.passed).length / cases.length;
  return {
    runId: "r",
    label: "run",
    createdAt: "2026-01-01T00:00:00Z",
    k: 5,
    cases,
    metrics: { passRate, recallAtK: passRate, mrr: passRate, ndcgAtK: passRate },
    byDifficulty: {},
  };
}

describe("compareRuns", () => {
  it("flags regressions and computes the pass-rate delta", () => {
    const baseline = run({ a: true, b: true, c: true, d: true });
    const current = run({ a: true, b: false, c: true, d: false });
    const diff = compareRuns(baseline, current);
    expect(diff.deltaPoints).toBeCloseTo(-50, 10);
    expect(diff.regressions).toEqual(["b", "d"]);
    expect(diff.severity).toBe("critical");
  });

  it("records improvements symmetrically", () => {
    const baseline = run({ a: false, b: true });
    const current = run({ a: true, b: true });
    const diff = compareRuns(baseline, current);
    expect(diff.improvements).toEqual(["a"]);
    expect(diff.deltaPoints).toBeCloseTo(50, 10);
  });

  it("a small drop below the warning threshold raises a warning", () => {
    // 3 of 100 cases regress → -3 points → warning (threshold 3, critical 8)
    const baselineCases: Record<string, boolean> = {};
    const currentCases: Record<string, boolean> = {};
    for (let i = 0; i < 100; i += 1) {
      baselineCases[`c${i}`] = true;
      currentCases[`c${i}`] = i < 3 ? false : true;
    }
    const diff = compareRuns(run(baselineCases), run(currentCases));
    expect(diff.severity).toBe("warning");
    expect(diff.deltaPoints).toBeCloseTo(-3, 10);
  });
});
