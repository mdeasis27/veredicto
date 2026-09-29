// lib/eval/retrieval.ts
// Retrieval metrics: precision@k, recall@k, MRR, nDCG@k, average precision.
// Binary relevance (a chunk is relevant or not) — see lib/eval/golden/.

/** Fraction of the top-k slots that are relevant. */
export function precisionAtK(
  retrieved: readonly string[],
  relevant: ReadonlySet<string>,
  k: number,
): number {
  if (k <= 0) return 0;
  const topK = retrieved.slice(0, k);
  const hits = topK.filter((id) => relevant.has(id)).length;
  return hits / k;
}

/** Fraction of relevant chunks that appear in the top-k. */
export function recallAtK(
  retrieved: readonly string[],
  relevant: ReadonlySet<string>,
  k: number,
): number {
  if (relevant.size === 0) return 0;
  const topK = retrieved.slice(0, k);
  const hits = topK.filter((id) => relevant.has(id)).length;
  return hits / relevant.size;
}

/** Reciprocal rank of the first relevant chunk (0 if none in the top-k). */
export function reciprocalRank(
  retrieved: readonly string[],
  relevant: ReadonlySet<string>,
  k = Infinity,
): number {
  const topK = retrieved.slice(0, k);
  for (let i = 0; i < topK.length; i += 1) {
    if (relevant.has(topK[i])) return 1 / (i + 1);
  }
  return 0;
}

/** Mean reciprocal rank across queries. */
export function meanReciprocalRank(
  queries: readonly { retrieved: readonly string[]; relevant: ReadonlySet<string> }[],
  k = Infinity,
): number {
  if (queries.length === 0) return 0;
  const sum = queries.reduce((acc, q) => acc + reciprocalRank(q.retrieved, q.relevant, k), 0);
  return sum / queries.length;
}

function dcg(gains: readonly number[], k: number): number {
  let total = 0;
  const n = Math.min(k, gains.length);
  for (let i = 0; i < n; i += 1) {
    total += gains[i] / Math.log2(i + 2);
  }
  return total;
}

/** Normalized discounted cumulative gain at k (binary relevance). */
export function ndcgAtK(
  retrieved: readonly string[],
  relevant: ReadonlySet<string>,
  k: number,
): number {
  const gains = retrieved.slice(0, k).map((id) => (relevant.has(id) ? 1 : 0));
  const idealHits = Math.min(relevant.size, k);
  if (idealHits === 0) return 0;
  const ideal = Array.from({ length: idealHits }, () => 1);
  const idcg = dcg(ideal, k);
  if (idcg === 0) return 0;
  return dcg(gains, k) / idcg;
}

/** Average precision across all ranked results. */
export function averagePrecision(
  retrieved: readonly string[],
  relevant: ReadonlySet<string>,
): number {
  if (relevant.size === 0) return 0;
  let hits = 0;
  let sum = 0;
  retrieved.forEach((id, i) => {
    if (relevant.has(id)) {
      hits += 1;
      sum += hits / (i + 1);
    }
  });
  return sum / relevant.size;
}
