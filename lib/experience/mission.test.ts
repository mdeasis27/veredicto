import { expect, it } from "vitest";
import { checkQuestions, runMission } from "./mission";

const count = (k: number) => {
  const items = checkQuestions(k);
  return { served: items.filter(i => i.status === "served").length, rerouted: items.filter(i => i.status === "rerouted").length, lost: items.filter(i => i.status === "lost").length };
};

it("at 3 passages per question, 20 of the 21 answerable questions find their evidence and q14 is missed", () => {
  expect(count(3)).toEqual({ served: 20, rerouted: 3, lost: 1 });
  expect(checkQuestions(3).filter(i => i.status === "lost").map(i => i.id)).toEqual(["q14"]);
});

it("flips the bet between 5 and 6 passages", () => {
  expect(count(5).lost).toBeGreaterThan(0);
  expect(count(6)).toEqual({ served: 21, rerouted: 3, lost: 0 });
});

it("sweep: both bet answers are reachable on the slider, and the default says no", () => {
  const answers = new Set<boolean>();
  for (let k = 1; k <= 8; k++) answers.add(count(k).lost === 0);
  expect([...answers].sort()).toEqual([false, true]);
  expect(count(3).lost === 0).toBe(false);
});

it("runs the mission against reading 8 passages, reveals in groups and stops when cancelled", async () => {
  const ids: string[] = [];
  const run = await runMission({ k: 3 }, new AbortController().signal, e => ids.push(e.id));
  expect(run.result.items).toHaveLength(24);
  expect(run.result.comparison).toEqual({ mine: 1, wide: 0 });
  expect(ids).toEqual(run.trace.map(e => e.id));
  expect(ids).toHaveLength(4);
  const c = new AbortController(); c.abort();
  await expect(runMission({ k: 3 }, c.signal, () => {})).rejects.toThrow();
});

it("says which of the passages read held labelled evidence for each question", () => {
  const at = (k: number, id: string) => checkQuestions(k).find(i => i.id === id)?.evidenceAt;
  expect(at(3, "q14")).toEqual([]);
  expect(at(8, "q14")).toEqual([6]);
  expect(at(3, "q13")).toEqual([1, 3]);
  expect(at(3, "q20")).toEqual([]);
  expect(at(1, "q19")).toEqual([1]);
  expect(checkQuestions(1).find(i => i.id === "q19")?.status).toBe("lost");
  for (const k of [1, 3, 8]) for (const q of checkQuestions(k)) expect(q.evidenceAt.every(p => p >= 1 && p <= k)).toBe(true);
});
