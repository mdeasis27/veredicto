// lib/eval/agreement.ts
// Inter-rater agreement + judge calibration statistics.
// Implements the measurement protocol described in the README:
// Cohen's kappa (nominal), weighted kappa (ordinal), Spearman, MAE,
// expected calibration error and Brier score.

export type KappaWeights = "linear" | "quadratic";

type Label = number | string;

function buildConfusion(a: readonly Label[], b: readonly Label[]) {
  if (a.length !== b.length) {
    throw new Error("agreement: label arrays must have equal length");
  }
  const n = a.length;
  const labels = Array.from(new Set<Label>([...a, ...b]));
  const index = new Map<Label, number>();
  labels.forEach((label, i) => index.set(label, i));
  const m = labels.length;
  const observed: number[][] = Array.from({ length: m }, () => new Array<number>(m).fill(0));
  for (let i = 0; i < n; i += 1) {
    const ia = index.get(a[i]);
    const ib = index.get(b[i]);
    if (ia === undefined || ib === undefined) throw new Error("agreement: unknown label");
    observed[ia][ib] += 1;
  }
  const rowSum = observed.map((row) => row.reduce((s, v) => s + v, 0));
  const colSum = new Array<number>(m).fill(0);
  observed.forEach((row) => row.forEach((v, j) => (colSum[j] += v)));
  return { n, m, observed, rowSum, colSum };
}

/** Cohen's kappa for nominal labels (chance-corrected agreement). */
export function cohenKappa(a: readonly Label[], b: readonly Label[]): number {
  const { n, m, observed, rowSum, colSum } = buildConfusion(a, b);
  if (n === 0) return 0;
  let po = 0;
  for (let i = 0; i < m; i += 1) po += observed[i][i];
  po /= n;
  let pe = 0;
  for (let i = 0; i < m; i += 1) pe += (rowSum[i] / n) * (colSum[i] / n);
  if (Math.abs(1 - pe) < 1e-12) return po >= 1 ? 1 : 0;
  return (po - pe) / (1 - pe);
}

/** Weighted kappa for ordinal labels (linear or quadratic weights). */
export function weightedKappa(
  a: readonly number[],
  b: readonly number[],
  weights: KappaWeights = "quadratic",
): number {
  const { n, m, observed, rowSum, colSum } = buildConfusion(a, b);
  if (m <= 1) return 1;
  const maxDistance = m - 1;
  const weight = (i: number, j: number): number => {
    const d = Math.abs(i - j) / maxDistance;
    return weights === "quadratic" ? d * d : d;
  };
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < m; i += 1) {
    for (let j = 0; j < m; j += 1) {
      numerator += weight(i, j) * (observed[i][j] / n);
      denominator += weight(i, j) * ((rowSum[i] * colSum[j]) / (n * n));
    }
  }
  if (denominator === 0) return 1;
  return 1 - numerator / denominator;
}

function averageRanks(values: readonly number[]): number[] {
  const order = values.map((value, i) => ({ value, i })).sort((p, q) => p.value - q.value);
  const ranks = new Array<number>(values.length).fill(0);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1].value === order[i].value) j += 1;
    const rank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) ranks[order[k].i] = rank;
    i = j + 1;
  }
  return ranks;
}

/** Pearson correlation coefficient. */
export function pearson(x: readonly number[], y: readonly number[]): number {
  if (x.length !== y.length || x.length === 0) {
    throw new Error("pearson: arrays must be equal, non-empty length");
  }
  const n = x.length;
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) return 0;
  return cov / Math.sqrt(varX * varY);
}

/** Spearman rank correlation (Pearson on average ranks, tie-aware). */
export function spearman(x: readonly number[], y: readonly number[]): number {
  return pearson(averageRanks(x), averageRanks(y));
}

/** Mean absolute error between two score vectors. */
export function meanAbsoluteError(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) {
    throw new Error("meanAbsoluteError: arrays must be equal, non-empty length");
  }
  const sum = a.reduce((acc, v, i) => acc + Math.abs(v - b[i]), 0);
  return sum / a.length;
}

/** Expected calibration error over confidence bins. */
export function expectedCalibrationError(
  confidences: readonly number[],
  correct: readonly boolean[],
  bins = 10,
): number {
  if (confidences.length !== correct.length) {
    throw new Error("expectedCalibrationError: arrays must be equal length");
  }
  const n = confidences.length;
  if (n === 0) return 0;
  const buckets = Array.from({ length: bins }, () => ({ conf: 0, acc: 0, count: 0 }));
  for (let i = 0; i < n; i += 1) {
    const b = Math.min(bins - 1, Math.max(0, Math.floor(confidences[i] * bins)));
    buckets[b].conf += confidences[i];
    buckets[b].acc += correct[i] ? 1 : 0;
    buckets[b].count += 1;
  }
  let ece = 0;
  for (const bucket of buckets) {
    if (bucket.count === 0) continue;
    const avgConf = bucket.conf / bucket.count;
    const avgAcc = bucket.acc / bucket.count;
    ece += (bucket.count / n) * Math.abs(avgConf - avgAcc);
  }
  return ece;
}

/** Brier score (mean squared error of probabilistic forecasts). */
export function brierScore(
  confidences: readonly number[],
  correct: readonly boolean[],
): number {
  if (confidences.length !== correct.length) {
    throw new Error("brierScore: arrays must be equal length");
  }
  if (confidences.length === 0) return 0;
  const sum = confidences.reduce(
    (acc, c, i) => acc + (c - (correct[i] ? 1 : 0)) ** 2,
    0,
  );
  return sum / confidences.length;
}
