import corpus from "@/lib/eval/golden/corpus.json";
import questions from "@/lib/eval/golden/questions.json";
import { bm25Retriever, tfidfRetriever, reciprocalRankFusion } from "@/lib/eval/retrievers";
import { recallAtK } from "@/lib/eval/retrieval";
import type { DemoAdapter, TraceEvent } from "./types";

type Question = { id: string; query: string; relevantChunkIds: string[] };
export type QuestionStatus = "served" | "rerouted" | "lost";
/** evidenceAt: 1-based positions, among the k passages read, that hold labelled evidence. */
export type CheckedQuestion = { id: string; status: QuestionStatus; evidenceAt: number[] };
export type MissionInput = { k: number };
export type MissionResult = { items: CheckedQuestion[]; missed: number; comparison: { mine: number; wide: number } };

const WIDE_K = 8;
const STEP = 6;
const docs = corpus as { id: string; text: string }[];
const hybrid = reciprocalRankFusion([bm25Retriever(docs), tfidfRetriever(docs)], docs);

/** Every benchmark question through the hybrid retriever: evidence found, no labelled evidence to score, or missed. */
export function checkQuestions(k: number): CheckedQuestion[] {
  if (!Number.isSafeInteger(k) || k < 1 || k > docs.length) throw new Error("k must be within the corpus size.");
  return (questions as Question[]).map(q => {
    if (q.relevantChunkIds.length === 0) return { id: q.id, status: "rerouted", evidenceAt: [] };
    const read = hybrid(q.query, k).slice(0, k);
    const relevant = new Set(q.relevantChunkIds);
    const evidenceAt = read.flatMap((id, i) => relevant.has(id) ? [i + 1] : []);
    return { id: q.id, status: recallAtK(read, relevant, k) >= .5 ? "served" : "lost", evidenceAt };
  });
}

const missedIn = (items: CheckedQuestion[]) => items.filter(i => i.status === "lost").length;

export const runMission: DemoAdapter<MissionInput, MissionResult> = async (input, signal, onEvent) => {
  const startedAt = performance.now();
  const items = checkQuestions(input.k);
  const trace: TraceEvent[] = [];
  for (let i = 0; i < items.length; i += STEP) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const event: TraceEvent = { id: `batch-${i / STEP + 1}`, step: i / STEP + 1, kind: "retrieval", messageKey: `batch.${i / STEP + 1}`, timestampMs: performance.now() - startedAt, evidenceIds: items.slice(i, i + STEP).map(q => q.id) };
    trace.push(event);
    onEvent(event);
  }
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const missed = missedIn(items);
  return { input, result: { items, missed, comparison: { mine: missed, wide: missedIn(checkQuestions(WIDE_K)) } }, trace, executionMs: performance.now() - startedAt, mode: "local" };
};
