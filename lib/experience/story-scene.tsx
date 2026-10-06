"use client";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { useReducedMotion } from "@/design-system/demo/project-story";
import type { CheckedQuestion, MissionResult } from "./mission";
import { examGrade, focusQuestion, revealWindow } from "./scene-state";
import { STORY } from "./story";

const TONE = { served: "var(--success)", rerouted: "var(--info)", lost: "var(--danger)" } as const;
const STAGGER_MS = 110;
const FADE = "transition-opacity duration-300 motion-reduce:transition-none";

/** The teacher grades the same exam question by question; the book shows the passages the student read for one of them. */
export function VeredictoStoryScene({ frame, result, k, locale }: { frame: PlaybackFrame<TraceEvent>; result: MissionResult; k: number; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const reduced = useReducedMotion();
  const items = result.items;
  const win = revealWindow(frame, items.length, reduced);
  const done = win.to >= items.length;
  // Once graded, the book returns to the most telling question of the whole exam (the miss, if any).
  const focus = focusQuestion(items, done ? { from: 0, to: items.length } : win);
  const grade = examGrade(items);
  const revealed = items.slice(0, win.to);
  const missedNumbers = revealed.flatMap((q, i) => q.status === "lost" ? [i + 1] : []);
  const sheetLabel = copy.sheetLabel(revealed.filter(q => q.status === "served").length, grade.answerable, revealed.filter(q => q.status === "rerouted").length, ...missedNumbers);

  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" data-veredicto-scene data-graded={win.to}>
      <Book copy={copy} k={k} question={focus === null ? null : items[focus]} number={focus === null ? null : focus + 1} />
      <Sheet copy={copy} items={items} win={win} focus={focus} done={done} grade={grade} label={sheetLabel} reduced={reduced} />
    </div>
    <p className="mt-6 font-mono text-2xl font-semibold tracking-tight" data-scene-result>{copy.missedOf(done ? grade.missed : missedNumbers.length, grade.answerable)}</p>
  </StoryStage>;
}

type SceneCopy = (typeof STORY)["en"]["scene"];

function noteFor(copy: SceneCopy, q: CheckedQuestion): string {
  if (q.status === "served") return copy.notes.served(...q.evidenceAt);
  if (q.status === "rerouted") return copy.notes.rerouted;
  return q.evidenceAt.length ? copy.notes.partial : copy.notes.lost;
}

function Book({ copy, k, question, number }: { copy: SceneCopy; k: number; question: CheckedQuestion | null; number: number | null }) {
  const gap = 6;
  const h = Math.min(54, (236 - (k - 1) * gap) / k);
  const height = k * h + (k - 1) * gap;
  const evidence = new Set(question?.evidenceAt ?? []);
  const status = question?.status;
  return <div className="min-w-0" data-book>
    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{copy.reads(k)}</p>
    <p className="mt-1 text-xl font-semibold tracking-tight" data-book-question>{number === null ? copy.waiting : copy.question(number)}</p>
    <svg viewBox={`0 0 220 ${height}`} className="mt-3 block h-auto w-full max-w-[240px]" aria-hidden="true">
      {Array.from({ length: k }, (_, p) => {
        const y = p * (h + gap);
        const lit = evidence.has(p + 1);
        const stroke = lit ? TONE.served : status === "lost" ? TONE.lost : status === "rerouted" ? TONE.rerouted : "var(--border)";
        return <g key={p} opacity={status === "rerouted" ? .5 : 1} className="transition-opacity duration-300 motion-reduce:transition-none">
          <rect x="2" y={y + 1} width="216" height={h - 2} rx="5" fill="var(--background)" stroke={stroke} strokeWidth={lit ? 3 : 2} strokeDasharray={status === "lost" && !lit ? "6 4" : undefined} className="transition-[stroke] duration-300 motion-reduce:transition-none" />
          <line x1="40" y1={y + h / 2} x2="150" y2={y + h / 2} stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
          {lit ? <path d={`M12 ${y + h / 2} l6 6 l11 -12`} fill="none" stroke={TONE.served} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
          <text x="210" y={y + h / 2 + 5} textAnchor="end" fontSize="13" fill="var(--muted-foreground)">{p + 1}</text>
        </g>;
      })}
    </svg>
    <p className="mt-3 text-sm leading-6" style={{ color: status ? TONE[status] : undefined }} data-book-note>{question ? noteFor(copy, question) : ""}</p>
  </div>;
}

function Sheet({ copy, items, win, focus, done, grade, label, reduced }: { copy: SceneCopy; items: CheckedQuestion[]; win: { from: number; to: number }; focus: number | null; done: boolean; grade: ReturnType<typeof examGrade>; label: string; reduced: boolean }) {
  const rows = Math.ceil(items.length / 2);
  const height = 72 + rows * 24;
  const gradeTone = grade.missed > 0 ? TONE.lost : TONE.served;
  return <svg viewBox={`0 0 340 ${height}`} className="block h-auto w-full min-w-0" role="img" aria-label={label} data-sheet>
    <rect x="1" y="1" width="338" height={height - 2} rx="8" fill="var(--background)" stroke="var(--border)" />
    <text x="16" y="30" fontSize="17" fontWeight="700" fill="var(--foreground)">{copy.exam}</text>
    <text x="16" y="48" fontSize="12" fill="var(--muted-foreground)">{copy.sameExam}</text>
    <g opacity={done ? 1 : 0} className={FADE} style={{ transitionDelay: done && !reduced ? `${(win.to - win.from) * STAGGER_MS}ms` : undefined }} data-grade>
      <circle cx="296" cy="36" r="25" fill="none" stroke={gradeTone} strokeWidth="3" />
      <text x="296" y="41" textAnchor="middle" fontSize="15" fontWeight="700" fill={gradeTone}>{grade.found}/{grade.answerable}</text>
    </g>
    {items.map((q, i) => {
      const x = 14 + (i < rows ? 0 : 166);
      const y = 84 + (i % rows) * 24;
      const shown = i < win.to;
      const delay = !reduced && i >= win.from && i < win.to ? (i - win.from) * STAGGER_MS : 0;
      return <g key={q.id} data-sheet-row={shown ? q.status : "pending"}>
        {i === focus ? <rect x={x - 6} y={y - 16} width="160" height="22" rx="4" fill="var(--accent)" opacity=".14" /> : null}
        <text x={x} y={y} fontSize="14" fill="var(--foreground)" fontFamily="var(--font-mono, monospace)">{i + 1}.</text>
        <line x1={x + 30} y1={y + 3} x2={x + 118} y2={y + 3} stroke="var(--border)" />
        <g opacity={shown ? 1 : 0} className={FADE} style={{ transitionDelay: shown && delay ? `${delay}ms` : undefined }}>
          {q.status === "served" ? <path d={`M${x + 126} ${y - 5} l6 6 l11 -12`} fill="none" stroke={TONE.served} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {q.status === "lost" ? <>
            <path d={`M${x + 127} ${y - 12} l13 13 M${x + 140} ${y - 12} l-13 13`} stroke={TONE.lost} strokeWidth="3.5" strokeLinecap="round" />
            <line x1={x + 30} y1={y - 4} x2={x + 118} y2={y - 4} stroke={TONE.lost} strokeWidth="2" />
          </> : null}
          {q.status === "rerouted" ? <text x={x + 32} y={y - 1} fontSize="12" fontWeight="600" fill={TONE.rerouted}>{copy.offSyllabus}</text> : null}
        </g>
      </g>;
    })}
  </svg>;
}
