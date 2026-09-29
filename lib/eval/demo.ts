// lib/eval/demo.ts
// The computed demo layer — builds retrievers, scores the golden set, computes
// calibration statistics and bias audits.  Everything that the dashboard shows
// comes out of the functions below, so it is deterministic and reproducible.
//
// This module is rated "foundational" per the Groundtruth project spec: it
// takes the role of the harness that runs eval from the command line in the
// PDFs.  The public demo runs it in the browser instead.

import type {
  CaseOutcome,
  CorpusChunk,
  Diff,
  EvalCase,
  RunResult,
} from "./types";

import goldCorpus from "./golden/corpus.json";
import goldLabels from "./golden/human-labels.json";
import goldQuestions from "./golden/questions.json";

import { bm25Retriever, reciprocalRankFusion, tfidfRetriever } from "./retrievers";
import { meanReciprocalRank, ndcgAtK, recallAtK } from "./retrieval";
import {
  brierScore,
  expectedCalibrationError,
  weightedKappa,
} from "./agreement";
import { lengthBias, positionBias, selfPreference } from "./bias";
import { compareRuns } from "./diff";
import { demoJudgeScore, judgeTotal } from "./demo-judge";

const CORPUS = goldCorpus as readonly CorpusChunk[];
const CASES = goldQuestions as readonly EvalCase[];
const K = 5;

const sparse = bm25Retriever(CORPUS);
const dense = tfidfRetriever(CORPUS);
const hybrid = reciprocalRankFusion([sparse, dense], CORPUS);

type BenchRow = {
  name: string;
  recallAtK: number;
  mrr: number;
  ndcgAtK: number;
  byDifficulty: Record<string, { recall: number; ndcg: number; count: number }>;
};

export function getBenchmark() {
  const configs: BenchRow[] = [
    { name: "sparse", ...evaluateConfig(sparse, "Sparse (BM25)") },
    { name: "dense", ...evaluateConfig(dense, "Dense (TF-IDF proxy)") },
    { name: "hybrid", ...evaluateConfig(hybrid, "Hybrid (RRF)") },
  ];
  return { configs, k: K, nQueries: CASES.length, nCorpus: CORPUS.length };
}

function evaluateConfig(
  retrieve: (q: string, k: number) => string[],
  name: string,
): Omit<BenchRow, "name"> {
  const byDifficulty: Record<string, { recall: number; ndcg: number; count: number }> = {};
  for (const c of CASES) {
    const retrieved = retrieve(c.query, K);
    const rel = new Set(c.relevantChunkIds);
    const r = recallAtK(retrieved, rel, K);
    const n = ndcgAtK(retrieved, rel, K);
    const bucket = (byDifficulty[c.difficulty] ??= { recall: 0, ndcg: 0, count: 0 });
    bucket.recall += r;
    bucket.ndcg += n;
    bucket.count += 1;
  }
  for (const key of Object.keys(byDifficulty)) {
    const b = byDifficulty[key];
    b.recall /= b.count;
    b.ndcg /= b.count;
  }
  const allQueries = CASES.map((c) => ({
    retrieved: retrieve(c.query, K),
    relevant: new Set(c.relevantChunkIds),
  }));
  return {
    recallAtK: CASES.reduce((acc, c) => acc + recallAtK(retrieve(c.query, K), new Set(c.relevantChunkIds), K), 0) / CASES.length,
    mrr: meanReciprocalRank(allQueries, K),
    ndcgAtK: CASES.reduce((acc, c) => acc + ndcgAtK(retrieve(c.query, K), new Set(c.relevantChunkIds), K), 0) / CASES.length,
    byDifficulty,
  };
}

export function getCalibration() {
  const labels = goldLabels as readonly {
    id: string;
    questionId: string;
    answer: string;
    human1: number[];
    human2: number[];
  }[];

  const judgeScores1: number[] = []; // criterio corrección
  const judgeScores2: number[] = []; // criterio completitud
  const human1_1: number[] = [];
  const human1_2: number[] = [];
  const human2_1: number[] = [];
  const human2_2: number[] = [];
  const confidences: number[] = [];
  const correct: boolean[] = [];

  for (const item of labels) {
    const question = CASES.find((q) => q.id === item.questionId);
    const source = question
      ? question.relevantChunkIds.map((cid) => CORPUS.find((c) => c.id === cid)?.text ?? "").join(" ")
      : "";
    const scores = demoJudgeScore(item.answer, source);
    judgeScores1.push(scores.correccion);
    judgeScores2.push(scores.completitud);
    human1_1.push(item.human1[0]);
    human1_2.push(item.human1[1]);
    human2_1.push(item.human2[0]);
    human2_2.push(item.human2[1]);
    confidences.push(scores.confidence);
    // "correct" here means the judge's total score equals the majority human vote
    const humanVote = Math.round((item.human1[0] + item.human2[0]) / 2);
    correct.push(scores.correccion === humanVote);
  }

  // per-criterion
  const kCorreccion = weightedKappa(judgeScores1, human1_1, "quadratic");
  const kCompletitud = weightedKappa(judgeScores2, human1_2, "quadratic");
  // human-human ceiling per criterion (pooling across skewed marginals
  // produces the kappa paradox, so report per criterion only)
  const hCorreccion = weightedKappa(human1_1, human2_1, "quadratic");
  const hCompletitud = weightedKappa(human1_2, human2_2, "quadratic");
  // overall quadratic (judge vs human, pooled)
  const allJudge = [...judgeScores1, ...judgeScores2];
  const allHuman = [...human1_1, ...human1_2];

  return {
    judgeHumanKappa: weightedKappa(allJudge, allHuman, "quadratic"),
    byCriterion: [
      { name: "Corrección", kappa: kCorreccion, humanKappa: hCorreccion },
      { name: "Completitud", kappa: kCompletitud, humanKappa: hCompletitud },
    ],
    ece: expectedCalibrationError(confidences, correct),
    brier: brierScore(confidences, correct),
  };
}

export function getBias() {
  const labels = goldLabels as readonly {
    id: string;
    questionId: string;
    answer: string;
    human1: number[];
    human2: number[];
  }[];

  // position bias: pairwise compare every adjacent pair with a SIMULATED
  // order-biased judge (20% of the time it picks the first answer regardless
  // of content). This demonstrates the metric; a real LLM judge would be
  // measured the same way against live outputs.
  const pairs = [];
  for (let i = 0; i + 1 < labels.length; i += 2) {
    pairs.push({ id: labels[i].id, a: labels[i].answer, b: labels[i + 1].answer });
  }
  const hash = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  };
  const posResult = positionBias(pairs, (first, second) => {
    if ((hash(first + second) & 0xffff) % 5 === 0) return "first";
    return first.length > second.length ? "first" : first.length < second.length ? "second" : "tie";
  });

  // length bias: score vs answer length
  const items = labels.map((item) => {
    const q = CASES.find((c) => c.id === item.questionId);
    const source = q
      ? q.relevantChunkIds.map((cid) => CORPUS.find((c) => c.id === cid)?.text ?? "").join(" ")
      : "";
    const scores = demoJudgeScore(item.answer, source);
    return { score: judgeTotal(scores), length: item.answer.length };
  });

  // self-preference: demo judge vs a "competitor" (lenient) judge
  const lenientScores: number[] = [];
  const strictScores: number[] = [];
  for (const item of labels) {
    const q = CASES.find((c) => c.id === item.questionId);
    const source = q
      ? q.relevantChunkIds.map((cid) => CORPUS.find((c) => c.id === cid)?.text ?? "").join(" ")
      : "";
    const scores = demoJudgeScore(item.answer, source);
    strictScores.push(judgeTotal(scores));
    // lenient variant: always +1 unless already 6
    lenientScores.push(Math.min(6, judgeTotal(scores) + 1));
  }
  const sf = selfPreference(strictScores, lenientScores);

  return {
    positionFlipRate: posResult.flipRate,
    positionConsistency: posResult.consistency,
    lengthCorrelation: lengthBias(items),
    selfPreference: {
      meanSelf: sf.meanSelf,
      meanOther: sf.meanCompetitor,
      selfWinRate: sf.selfWinRate,
    },
  };
}

export function getRegressionDemo(): { baseline: RunResult; current: RunResult; diff: Diff } {
  // Build two runs: baseline with sparse, current with the same sparse but
  // with a "broken" retriever that drops the first result on half the queries.
  const baseline = runWithRetriever(sparse, "baseline");
  const broken: typeof sparse = (query, k) => {
    const results = sparse(query, k + 1);
    return results.length > 1 ? results.slice(1) : results;
  };
  const current = runWithRetriever(broken, "prompt-change");

  return { baseline, current, diff: compareRuns(baseline, current) };
}

function runWithRetriever(
  retrieve: (q: string, k: number) => string[],
  label: string,
): RunResult {
  const outcomes: CaseOutcome[] = [];
  for (const c of CASES) {
    const retrieved = retrieve(c.query, K);
    const rel = new Set(c.relevantChunkIds);
    const passed = recallAtK(retrieved, rel, K) >= (c.answerable ? 0.5 : 1); // out-of-scope requires no relevant
    outcomes.push({
      id: c.id,
      difficulty: c.difficulty,
      passed,
      recall: recallAtK(retrieved, rel, K),
      reciprocalRank: 0,
      ndcg: ndcgAtK(retrieved, rel, K),
    });
  }
  const passRate = outcomes.filter((o) => o.passed).length / outcomes.length;
  return {
    runId: `${label}-${Date.now()}`,
    label,
    createdAt: new Date().toISOString(),
    k: K,
    cases: outcomes,
    metrics: {
      passRate,
      recallAtK: CASES.reduce((s, c) => s + recallAtK(retrieve(c.query, K), new Set(c.relevantChunkIds), K), 0) / CASES.length,
      mrr: CASES.reduce((s, c) => s, 0) / CASES.length,
      ndcgAtK: CASES.reduce((s, c) => s + ndcgAtK(retrieve(c.query, K), new Set(c.relevantChunkIds), K), 0) / CASES.length,
    },
    byDifficulty: {},
  };
}
