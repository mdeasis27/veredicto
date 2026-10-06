import { expect, it } from "vitest";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { examGrade, focusQuestion, questionCells, revealedQuestions, revealWindow } from "./scene-state";
import { runMission } from "./mission";

it("hides the questions not revealed yet", () => {
  expect(questionCells([{ id: "a", status: "served", evidenceAt: [1] }, { id: "b", status: "lost", evidenceAt: [] }], 1)).toEqual(["served", "pending"]);
});

it("final tape counts equal the mission totals", async () => {
  const { result } = await runMission({ k: 3 }, new AbortController().signal, () => {});
  expect(tapeCounts(questionCells(result.items, result.items.length))).toEqual({ served: 20, rerouted: 3, lost: result.missed, pending: 0 });
});

it("reveals in proportion to playback, all of it when complete or under reduced motion", () => {
  expect(revealedQuestions({ visible: 1, total: 4, complete: false }, 24, false)).toBe(6);
  expect(revealedQuestions({ visible: 4, total: 4, complete: true }, 24, false)).toBe(24);
  expect(revealedQuestions({ visible: 1, total: 4, complete: false }, 24, true)).toBe(24);
  expect(revealedQuestions({ visible: 0, total: 0, complete: false }, 24, false)).toBe(24);
});

it("grades out of the answerable questions only", async () => {
  const { result } = await runMission({ k: 3 }, new AbortController().signal, () => {});
  expect(examGrade(result.items)).toEqual({ found: 20, answerable: 21, missed: 1, offSyllabus: 3 });
});

it("reveals one batch per frame, everything at once when complete from the start or reduced", () => {
  expect(revealWindow({ visible: 3, total: 4, complete: false }, 24, false)).toEqual({ from: 12, to: 18 });
  expect(revealWindow({ visible: 4, total: 4, complete: true }, 24, false)).toEqual({ from: 18, to: 24 });
  expect(revealWindow({ visible: 2, total: 4, complete: false }, 24, true)).toEqual({ from: 0, to: 24 });
  expect(revealWindow({ visible: 0, total: 0, complete: true }, 24, false)).toEqual({ from: 0, to: 24 });
});

it("puts the most telling question of the batch in the book: a miss, then off the syllabus, then the last one", async () => {
  const { result } = await runMission({ k: 3 }, new AbortController().signal, () => {});
  const id = (w: { from: number; to: number }) => { const i = focusQuestion(result.items, w); return i === null ? null : result.items[i].id; };
  expect(id({ from: 0, to: 6 })).toBe("q06");
  expect(id({ from: 12, to: 18 })).toBe("q14");
  expect(id({ from: 18, to: 24 })).toBe("q20");
  expect(id({ from: 0, to: 24 })).toBe("q14");
  expect(id({ from: 0, to: 0 })).toBeNull();
});
