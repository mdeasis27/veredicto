import { describe, expect, it } from "vitest";

import { lengthBias, positionBias, selfPreference, type PairwiseVerdict } from "./bias";

const orderBlindJudge =
  (a: string, b: string): PairwiseVerdict =>
    a.length < b.length ? "first" : a.length > b.length ? "second" : "tie";

describe("position bias", () => {
  const pairs = [
    { id: "p1", a: "alpha", b: "beta" },
    { id: "p2", a: "gamma", b: "delta" },
  ];

  it("an always-first judge flips on every swapped pair", () => {
    const result = positionBias(pairs, () => "first");
    expect(result.flipRate).toBe(1);
    expect(result.flips).toBe(2);
    expect(result.flippedIds).toEqual(["p1", "p2"]);
  });

  it("an order-blind judge never flips", () => {
    const result = positionBias(pairs, orderBlindJudge);
    expect(result.flipRate).toBe(0);
  });
});

describe("length bias", () => {
  it("detects a judge that rewards longer outputs", () => {
    const correlation = lengthBias([
      { score: 1, length: 10 },
      { score: 2, length: 20 },
      { score: 3, length: 30 },
    ]);
    expect(correlation).toBeCloseTo(1, 10);
  });
});

describe("self preference", () => {
  it("measures the judge's preference for its own model family", () => {
    const result = selfPreference([4, 5, 4], [3, 3, 2]);
    expect(result.meanSelf).toBeCloseTo(13 / 3, 10);
    expect(result.meanCompetitor).toBeCloseTo(8 / 3, 10);
    expect(result.selfWinRate).toBe(1);
  });
});
