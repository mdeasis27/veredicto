"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { StatusBadge } from "@/design-system/components/status-badge";
import { getBenchmark, getCalibration } from "@/lib/eval/demo";
import { demoJudgeScore, judgeTotal, type JudgeScores } from "@/lib/eval/demo-judge";

const BENCH = getBenchmark();
const CAL = getCalibration();

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

const SOURCE_PRE =
  "El crédito de consumo se aprueba si el puntaje crediticio supera 650 y el ingreso mensual duplica el valor de la cuota. La morosidad histórica se revisa en los últimos doce meses y no debe superar el cinco por ciento.";

const ANSWER_PRE =
  "El crédito se aprueba cuando el puntaje supera 650 y el ingreso mensual duplica la cuota.";

export default function AppPage() {
  const [source, setSource] = useState(SOURCE_PRE);
  const [answer, setAnswer] = useState(ANSWER_PRE);
  const [result, setResult] = useState<JudgeScores | null>(null);

  function run() {
    setResult(demoJudgeScore(answer, source));
  }

  const confidenceTone = result
    ? result.confidence >= 0.7
      ? ("success" as const)
      : result.confidence >= 0.4
        ? ("warning" as const)
        : ("danger" as const)
    : ("neutral" as const);

  const ordinalTone = (v: number): "success" | "warning" | "danger" =>
    v >= 3 ? "success" : v >= 2 ? "warning" : "danger";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Inicio
            </Link>
            <div className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-tight">Veredicto</h1>
                <p className="text-xs text-muted-foreground">Eval harness</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="info" dot className="px-3 py-1">
              Demo mode
            </StatusBadge>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* ── SUMMARY ─────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Queries" value={BENCH.nQueries} />
          <MetricCard label="Chunks" value={BENCH.nCorpus} />
          <MetricCard label="Judge κ human" value={CAL.judgeHumanKappa.toFixed(3)} tone={
            CAL.judgeHumanKappa >= 0.61 ? "success" : CAL.judgeHumanKappa >= 0.41 ? "warning" : "danger"
          } />
          <MetricCard label="ECE" value={CAL.ece.toFixed(3)} tone={CAL.ece < 0.15 ? "success" : "warning"} />
        </div>

        {/* ── PLAYGROUND ──────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Juez en vivo</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Puntúa una respuesta frente a su fuente de referencia. El juez de demo es un proxy
            léxico deliberadamente naive: mide solapamiento de palabras entre respuesta y fuente.
          </p>

          <Card className="p-4 space-y-4">
            <div>
              <label htmlFor="source" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fuente de referencia
              </label>
              <textarea
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                rows={4}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </div>
            <div>
              <label htmlFor="answer" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Respuesta del candidato
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </div>
            <button
              onClick={run}
              className="w-full rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-medium text-[#ffffff] hover:bg-accent/90 transition-colors"
            >
              Puntuar respuesta
            </button>
          </Card>

          {result && (
            <Card className="mt-4 p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusBadge tone={confidenceTone} dot>
                  Confianza {pct(result.confidence)}
                </StatusBadge>
                <span className="text-sm text-muted-foreground">
                  Puntuación total: <span className="font-semibold text-foreground">{judgeTotal(result)}/6</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricCard label="Corrección" value={`${result.correccion}/3`} tone={ordinalTone(result.correccion)} />
                <MetricCard label="Completitud" value={`${result.completitud}/3`} tone={ordinalTone(result.completitud)} />
                <MetricCard label="Confianza" value={pct(result.confidence)} tone={confidenceTone} />
              </div>
            </Card>
          )}
        </section>

        {/* ── RULE NOTE ───────────────────────── */}
        <section>
          <Alert tone="info" title="Cómo puntúa el juez">
            Corrección y completitud son ordinales (1–3) derivados del solapamiento léxico; la
            confianza crece con la cobertura de la respuesta. El total (0–6) es la suma de ambos
            criterios — el mismo número que el harness usa para medir acuerdo con humanos.
          </Alert>
        </section>

        <footer className="pt-8 border-t border-[var(--border)] flex items-center justify-between text-xs text-muted-foreground">
          <span>Veredicto · Eval harness · Demo mode</span>
          <a href="https://github.com/mdeasis27/veredicto" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">GitHub</a>
        </footer>
      </div>
    </div>
  );
}
