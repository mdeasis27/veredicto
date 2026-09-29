// lib/eval/types.ts
// Core types for the Veredicto evaluation harness.

export type EvalCase = {
  id: string;
  /** Natural-language question asked over the corpus. */
  query: string;
  /** Chunk ids that are relevant to the query (golden relevance judgements). */
  relevantChunkIds: string[];
  /** Stratification bucket: single-hop, multi-hop, aggregation, out-of-scope. */
  difficulty: "single" | "multi" | "aggregation" | "out-of-scope";
  /** Out-of-scope cases must be refused, not answered. */
  answerable: boolean;
};

export type CorpusChunk = {
  id: string;
  docId: string;
  section: string;
  text: string;
};

export type RetrievalConfig = {
  name: string;
  retrieve: (query: string, k: number) => string[];
};

export type CaseOutcome = {
  id: string;
  difficulty: EvalCase["difficulty"];
  passed: boolean;
  /** Retrieval quality for this case at the configured k. */
  recall: number;
  reciprocalRank: number;
  ndcg: number;
};

export type RunResult = {
  runId: string;
  label: string;
  createdAt: string;
  k: number;
  cases: CaseOutcome[];
  metrics: {
    passRate: number;
    recallAtK: number;
    mrr: number;
    ndcgAtK: number;
  };
  byDifficulty: Record<string, { passRate: number; count: number }>;
};

export type Diff = {
  passRateBaseline: number;
  passRateCurrent: number;
  /** Percentage-point delta (current − baseline). Negative is a regression. */
  deltaPoints: number;
  regressions: string[];
  improvements: string[];
  severity: "ok" | "warning" | "critical";
};
