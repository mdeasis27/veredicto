import { describe, expect, it } from "vitest";

import {
  averagePrecision,
  meanReciprocalRank,
  ndcgAtK,
  precisionAtK,
  recallAtK,
  reciprocalRank,
} from "./retrieval";

describe("retrieval metrics", () => {
  const retrieved = ["a", "b", "c", "d"];

  it("precision@k divides hits by k", () => {
    expect(precisionAtK(retrieved, new Set(["a", "c"]), 2)).toBe(0.5);
    expect(precisionAtK(retrieved, new Set(["a", "c"]), 4)).toBe(0.5);
    expect(precisionAtK(retrieved, new Set<string>(), 4)).toBe(0);
  });

  it("recall@k divides hits by number of relevant", () => {
    expect(recallAtK(retrieved, new Set(["a", "c"]), 2)).toBe(0.5);
    expect(recallAtK(retrieved, new Set(["a", "c"]), 4)).toBe(1);
  });

  it("reciprocal rank uses the first relevant position", () => {
    expect(reciprocalRank(retrieved, new Set(["a"]))).toBe(1);
    expect(reciprocalRank(retrieved, new Set(["b"]))).toBe(0.5);
    expect(reciprocalRank(["x", "y"], new Set(["a"]))).toBe(0);
    expect(reciprocalRank(retrieved, new Set(["d"]), 2)).toBe(0);
  });

  it("mean reciprocal rank averages over queries", () => {
    const mrr = meanReciprocalRank([
      { retrieved: ["a"], relevant: new Set(["a"]) },
      { retrieved: ["b", "a"], relevant: new Set(["a"]) },
      { retrieved: ["x"], relevant: new Set(["a"]) },
    ]);
    expect(mrr).toBeCloseTo((1 + 0.5 + 0) / 3, 10);
  });

  it("nDCG@k is 1 when the only relevant chunk is first", () => {
    expect(ndcgAtK(["a", "b", "c"], new Set(["a"]), 3)).toBeCloseTo(1, 10);
  });

  it("nDCG@k discounts a relevant chunk found later", () => {
    const expected = 1 / Math.log2(3);
    expect(ndcgAtK(["b", "a"], new Set(["a"]), 2)).toBeCloseTo(expected, 10);
  });

  it("nDCG@k is 0 for out-of-scope queries with no relevant chunk", () => {
    expect(ndcgAtK(["a", "b"], new Set<string>(), 2)).toBe(0);
  });

  it("average precision averages precision at each hit", () => {
    expect(averagePrecision(["b", "a", "c"], new Set(["a"]))).toBeCloseTo(0.5, 10);
    expect(averagePrecision(["a", "c", "b"], new Set(["a", "c"]))).toBeCloseTo(
      (1 + 1) / 2,
      10,
    );
  });
});
