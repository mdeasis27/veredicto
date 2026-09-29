import { describe, expect, it } from "vitest";

import {
  brierScore,
  cohenKappa,
  expectedCalibrationError,
  meanAbsoluteError,
  pearson,
  spearman,
  weightedKappa,
} from "./agreement";

describe("cohen kappa", () => {
  it("is 1 for perfect agreement", () => {
    expect(cohenKappa([1, 1, 0, 0], [1, 1, 0, 0])).toBeCloseTo(1, 10);
  });

  it("is -1 for total disagreement on a balanced binary task", () => {
    expect(cohenKappa([1, 0, 1, 0], [0, 1, 0, 1])).toBeCloseTo(-1, 10);
  });

  it("matches a hand-computed partial agreement", () => {
    // po = 5/6, pe = 1/2, kappa = 2/3
    expect(cohenKappa([1, 1, 1, 0, 0, 0], [1, 1, 0, 0, 0, 0])).toBeCloseTo(2 / 3, 10);
  });
});

describe("weighted kappa (ordinal)", () => {
  it("is 1 for identical ordinal labels", () => {
    expect(weightedKappa([1, 2, 3], [1, 2, 3], "quadratic")).toBeCloseTo(1, 10);
  });

  it("penalises a full rotation", () => {
    expect(weightedKappa([1, 2, 3], [2, 3, 1], "quadratic")).toBeCloseTo(-0.5, 10);
  });

  it("rewards adjacent disagreement more than distant disagreement", () => {
    const adjacent = weightedKappa([1, 2, 3, 3], [2, 2, 3, 3], "quadratic");
    const distant = weightedKappa([1, 2, 3, 3], [3, 2, 3, 3], "quadratic");
    expect(adjacent).toBeGreaterThan(distant);
  });
});

describe("correlation and error", () => {
  it("pearson is 1 for a positive linear relationship", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 10);
  });

  it("spearman is 1 for any monotonic relationship", () => {
    expect(spearman([1, 2, 3, 4], [1, 4, 9, 16])).toBeCloseTo(1, 10);
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1, 10);
  });

  it("mean absolute error is the mean of absolute differences", () => {
    expect(meanAbsoluteError([1, 2, 3], [1, 3, 5])).toBeCloseTo(1, 10);
  });
});

describe("calibration", () => {
  it("a perfectly calibrated judge has ~0 ECE", () => {
    // Two bins: 8 items at 0.9 confidence (7 right), 2 items at 0.5 (1 right).
    const confidences = [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.5, 0.5];
    const correct = [true, true, true, true, true, true, true, false, true, false];
    // Bin 0.9: conf 0.9, acc 7/8 = 0.875 -> |0.025|
    // Bin 0.5: conf 0.5, acc 1/2 = 0.5   -> |0.0|
    // Weighted: (8/10)*0.025 + (2/10)*0 = 0.02
    expect(expectedCalibrationError(confidences, correct)).toBeCloseTo(0.02, 10);
  });

  it("brier score is the mean squared forecast error", () => {
    expect(brierScore([1, 0], [true, false])).toBeCloseTo(0, 10);
    expect(brierScore([0.5, 0.5], [true, false])).toBeCloseTo(0.25, 10);
  });
});
