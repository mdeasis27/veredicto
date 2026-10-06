import type { TapeStatus } from "@/design-system/demo/outcome-tape";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import type { CheckedQuestion } from "./mission";

export function questionCells(items: readonly CheckedQuestion[], revealed: number): TapeStatus[] {
  return items.map((c, i) => (i >= revealed ? "pending" : c.status));
}

export function revealedQuestions(frame: { visible: number; total: number; complete: boolean }, n: number, reducedMotion: boolean): number {
  if (reducedMotion || frame.complete || frame.total === 0) return n;
  return Math.ceil((n * frame.visible) / frame.total);
}

export const COMPLETE_FRAME: PlaybackFrame<TraceEvent> = { visible: 0, total: 0, event: undefined, complete: true };

export type RevealWindow = { from: number; to: number };

/** Questions graded in this frame: [from, to). Without a played trace, or under reduced motion, the whole exam lands at once. */
export function revealWindow(frame: { visible: number; total: number; complete: boolean }, n: number, reducedMotion: boolean): RevealWindow {
  if (reducedMotion || frame.total === 0) return { from: 0, to: n };
  return { from: Math.ceil((n * Math.max(frame.visible - 1, 0)) / frame.total), to: revealedQuestions(frame, n, false) };
}

/** The question the book opens for a window: the first miss, else the first one off the syllabus, else the last one graded. */
export function focusQuestion(items: readonly CheckedQuestion[], { from, to }: RevealWindow): number | null {
  if (to <= from) return null;
  const range = items.slice(from, to);
  for (const status of ["lost", "rerouted"] as const) {
    const i = range.findIndex(q => q.status === status);
    if (i >= 0) return from + i;
  }
  return to - 1;
}

export function examGrade(items: readonly CheckedQuestion[]) {
  const offSyllabus = items.filter(q => q.status === "rerouted").length;
  const missed = items.filter(q => q.status === "lost").length;
  const answerable = items.length - offSyllabus;
  return { found: answerable - missed, answerable, missed, offSyllabus };
}
