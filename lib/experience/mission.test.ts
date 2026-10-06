import { describe, expect, it } from "vitest";
import questions from "@/lib/eval/golden/questions.json";
import { runMission } from "./mission";

const input = { queryId: questions[0].id, retriever: "degraded" as const, k: 3 };
describe("retrieval mission", () => {
  it("compares the selected negative control with the same-query BM25 reference", async () => {
    const run = await runMission(input, new AbortController().signal, () => {});
    expect(run.input).toEqual(input);
    expect(run.result.comparison.selected.ranking).toEqual([]);
    expect(run.result.comparison.reference.ranking.length).toBeGreaterThan(0);
    expect(run.result.comparison.selected.recall).toBe(0);
    expect(run.result.comparison.reference.recall).toBeGreaterThan(0);
    expect(run.result.regression.severity).toBe("critical");
  });
  it("keeps equal BM25 outcomes equal", async () => {
    const run = await runMission({ ...input, retriever: "bm25" }, new AbortController().signal, () => {});
    expect(run.result.comparison.selected).toEqual(run.result.comparison.reference);
  });
  it("does not publish after cancellation inside a callback", async () => {
    const controller = new AbortController(); const events: string[] = [];
    await expect(runMission({ ...input, retriever: "hybrid" }, controller.signal, event => { events.push(event.id); controller.abort(); })).rejects.toMatchObject({ name: "AbortError" });
    expect(events).toHaveLength(1);
  });
  it("rejects unsupported queries", async () => {
    await expect(runMission({ ...input, queryId: "missing" }, new AbortController().signal, () => {})).rejects.toThrow(/query/);
  });
  it("does not approve an unanswerable benchmark with no labeled evidence", async () => {
    const run = await runMission({ ...input, queryId: "q20" }, new AbortController().signal, () => {});
    expect(run.result.gate).toBe("unscored");
  });
  it("rejects invalid numeric retrieval limits", async () => {
    for (const k of [NaN, Infinity, 1.5]) {
      await expect(runMission({ ...input, k }, new AbortController().signal, () => {})).rejects.toThrow(/integer/);
    }
  });
});
