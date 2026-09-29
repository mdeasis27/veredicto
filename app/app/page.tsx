"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { buttonVariants } from "@/design-system/components/button";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { Meter } from "@/design-system/components/meter";
import { StatusBadge } from "@/design-system/components/status-badge";
import { cn } from "@/design-system/utils";
import { getBenchmark, getCalibration, getBias, getRegressionDemo } from "@/lib/eval/demo";

const BENCH = getBenchmark();
const CAL = getCalibration();
const BIAS = getBias();
const REG = getRegressionDemo();

const bestConfig = BENCH.configs.reduce((best, c) => (c.recallAtK > best.recallAtK ? c : best)).name;

export default function AppPage() {
  const [showRegression, setShowRegression] = useState(false);
  const diff = showRegression ? REG.diff : null;
  const severityTone =
    diff?.severity === "critical" ? "danger" as const :
    diff?.severity === "warning" ? "warning" as const : "success" as const;

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

        {/* ── SUMMARY BAR ─────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Queries" value={BENCH.nQueries} />
          <MetricCard label="Chunks" value={BENCH.nCorpus} />
          <MetricCard label="Judge κ human" value={CAL.judgeHumanKappa.toFixed(3)} tone={
            CAL.judgeHumanKappa >= 0.61 ? "success" : CAL.judgeHumanKappa >= 0.41 ? "warning" : "danger"
          } />
          <MetricCard label="ECE" value={CAL.ece.toFixed(3)} tone={CAL.ece < 0.15 ? "success" : "warning"} />
        </div>

        {/* ── RETRIEVAL BENCHMARK ─────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Retrieval benchmark</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Three deterministic retrievers over {BENCH.nCorpus} chunks at k={BENCH.k}. The
            dense column uses a TF‑IDF proxy because the public demo runs with zero model downloads
            (see <em>Tradeoffs</em> in the README).
          </p>
          <div className="overflow-x-auto rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Config</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recall@{BENCH.k}</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">MRR@{BENCH.k}</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">nDCG@{BENCH.k}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {BENCH.configs.map((cfg) => (
                  <tr key={cfg.name} className={cn(cfg.name === bestConfig && "bg-accent/5")}>
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {cfg.name === "sparse" ? "Sparse (BM25)" : cfg.name === "dense" ? "Dense (TF-IDF proxy)" : "Hybrid (RRF)"}
                      {cfg.name === bestConfig && <span className="ml-2 text-xs text-accent">best</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-foreground">{(cfg.recallAtK * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-foreground">{cfg.mrr.toFixed(4)}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-foreground">{cfg.ndcgAtK.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── JUDGE CALIBRATION ───────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Judge calibration</h2>
          <p className="text-sm text-muted-foreground mb-5">
            A deterministic lexical judge (demo mode) scored the two-human gold set against its
            rubric. The judge is deliberately naive so the calibration numbers are meaningful.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">Cohen κ (weighted, quadratic)</span>
                <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{CAL.judgeHumanKappa.toFixed(3)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Judge vs. human (pooled). The ceiling is human↔human agreement,
                reported per criterion on the right.
                {CAL.judgeHumanKappa >= 0.61 ? (
                  <span className="text-success ml-1">Sustancial</span>
                ) : CAL.judgeHumanKappa >= 0.41 ? (
                  <span className="text-warning ml-1">Moderado</span>
                ) : (
                  <span className="text-danger ml-1">Bajo</span>
                )}
              </p>
            </Card>
            <Card className="p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Por criterio (juez / humano)</p>
              {CAL.byCriterion.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground">{c.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.kappa.toFixed(3)}</span>
                    {" / "}
                    {c.humanKappa.toFixed(3)}
                  </span>
                </div>
              ))}
              <hr className="border-[var(--border)]" />
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>ECE (10 bins)</span>
                <span>{CAL.ece.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Brier score</span>
                <span>{CAL.brier.toFixed(4)}</span>
              </div>
            </Card>
          </div>
        </section>

        {/* ── BIAS AUDIT ──────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Bias audit</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Three measured biases. Position is demonstrated with a simulated order-biased
            judge; length and self-preference are measured on the deterministic judge.
          </p>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Posición</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{(BIAS.positionFlipRate * 100).toFixed(0)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">flip rate</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Longitud</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{BIAS.lengthCorrelation.toFixed(3)}</p>
              <p className="mt-1 text-xs text-muted-foreground">ρ score↔len</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Auto-pref (ilustrativo)</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{(BIAS.selfPreference.selfWinRate * 100).toFixed(0)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">self win rate</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Δ</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{BIAS.selfPreference.meanSelf.toFixed(1)} vs {BIAS.selfPreference.meanOther.toFixed(1)}</p>
              <p className="mt-1 text-xs text-muted-foreground">self vs other mean</p>
            </Card>
          </div>
        </section>

        {/* ── CI REGRESSION GATE ──────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">CI regression gate</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Simulate a &quot;broken&quot; retriever that drops the top result — the gate flags the regression.
          </p>

          {!showRegression ? (
            <button
              type="button"
              onClick={() => setShowRegression(true)}
              className={cn(buttonVariants({ variant: "outline", size: "default" }))}
            >
              Simular cambio de prompt →
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge tone={severityTone}>
                  {diff?.severity === "critical" ? "BLOCKED" : diff?.severity === "warning" ? "WARNING" : "OK"}
                </StatusBadge>
                <span className="text-sm text-muted-foreground">
                  Pass rate: {(diff!.passRateBaseline * 100).toFixed(0)}% → {(diff!.passRateCurrent * 100).toFixed(0)}%
                  (<span className={severityTone === "danger" ? "text-danger font-semibold" : severityTone === "warning" ? "text-warning font-semibold" : "text-success font-semibold"}>{diff!.deltaPoints > 0 ? "+" : ""}{diff!.deltaPoints.toFixed(1)}pp</span>)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-border">
                <div className={cn("h-full rounded-[var(--radius-pill)]", diff!.deltaPoints >= 0 ? "bg-success" : "bg-danger")} style={{ width: `${Math.min(100, Math.max(5, Math.abs(diff!.deltaPoints) * 3))}%` }} />
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {diff!.regressions.length > 0 && (
                  <Alert tone="danger" title={`${diff!.regressions.length} regressions`} items={diff!.regressions.slice(0, 6)} />
                )}
                {diff!.improvements.length > 0 && (
                  <Alert tone="success" title={`${diff!.improvements.length} improvements`} items={diff!.improvements.slice(0, 6)} />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Gate thresholds: warning ≤ −3% · critical ≤ −8%. The simulated &quot;prompt change&quot; drops the first retrieval result on half the queries.
              </p>
            </div>
          )}
        </section>

        <footer className="pt-8 border-t border-[var(--border)] flex items-center justify-between text-xs text-muted-foreground">
          <span>Veredicto · Eval harness · Demo mode</span>
          <a href="https://github.com/mdeasis27/veredicto" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">GitHub</a>
        </footer>
      </div>
    </div>
  );
}
