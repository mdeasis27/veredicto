"use client";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { OutcomeTape, useReducedMotion } from "@/design-system/demo/project-story";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { FlowDiagram, type FlowTone } from "@/design-system/demo/flow-diagram";
import type { MissionResult } from "./mission";
import { questionCells, revealedQuestions } from "./scene-state";
import { STORY } from "./story";

const POS = { questions: { x: 10, y: 95 }, searcher: { x: 230, y: 95 }, found: { x: 470, y: 20 }, outside: { x: 470, y: 170 } } as const;

export function VeredictoStoryScene({ frame, result, locale }: { frame: PlaybackFrame<TraceEvent>; result: MissionResult; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const reduced = useReducedMotion();
  const cells = questionCells(result.items, revealedQuestions(frame, result.items.length, reduced));
  const c = tapeCounts(cells);
  const tone: Record<keyof typeof POS, FlowTone> = {
    questions: "idle",
    searcher: "active",
    found: c.lost > 0 ? "danger" : c.served > 0 ? "success" : "idle",
    outside: c.rerouted > 0 ? "active" : "idle",
  };
  const nodes = (Object.keys(POS) as (keyof typeof POS)[]).map(id => ({ id, ...POS[id], ...copy.nodes[id], tone: tone[id] }));
  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <FlowDiagram nodes={nodes} width={640} height={260} ariaLabel={copy.missedOf(c.lost)} statusLabels={copy.statusLabels} edges={[
      { from: "questions", to: "searcher" },
      { from: "searcher", to: "found", tone: c.lost > 0 ? "danger" : c.served > 0 ? "success" : "idle" },
      { from: "searcher", to: "outside" },
    ]} />
    <div className="mt-6">
      <OutcomeTape cells={cells} labels={copy.tape} ariaLabel={copy.tapeLabel} columns={12} />
      <p className="mt-4 font-mono text-2xl font-semibold tracking-tight">{copy.missedOf(c.lost)}</p>
    </div>
  </StoryStage>;
}
