import { expect, it } from "vitest";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { questionCells, revealedQuestions } from "./scene-state";
import { runMission } from "./mission";

it("hides the questions not revealed yet", () => {
  expect(questionCells([{ id: "a", status: "served" }, { id: "b", status: "lost" }], 1)).toEqual(["served", "pending"]);
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
