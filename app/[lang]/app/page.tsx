"use client";
import { useState } from "react";
import { useLocale } from "@/design-system/i18n/context";
import { useDemoRun } from "@/design-system/demo/use-demo-run";
import { TracePlayer } from "@/design-system/demo/trace-player";
import { MissionBrief, MissionPrompt, MissionComparison, DecisionNotes } from "@/design-system/demo/mission-lab";
import { ScenarioPicker } from "@/design-system/demo/decision-lab";
import { traceCopy } from "@/lib/experience/trace-copy";
import { runMission } from "@/lib/experience/mission";
import story from "@/docs/quality/business-story.json";
import { englishQuestionLabels } from "@/lib/experience/question-labels";
import questions from "@/lib/eval/golden/questions.json";
import type { ExperienceInput, ExperienceResult } from "@/lib/experience/adapter";
import { VeredictoScene } from "@/lib/experience/veredicto-scene";
const defaults: ExperienceInput = { queryId: questions[0].id, retriever: "hybrid", k: 3 };
export default function Page() {
  const locale = useLocale(); const es = locale === "es"; const s = story[locale];
  const [input, setInput] = useState(defaults); const [scenario, setScenario] = useState("a");
  const [prediction, setPrediction] = useState<string | null>(null);
  const demo = useDemoRun(runMission); const run = demo.run;
  const change = (next: ExperienceInput, id = "") => { setInput(next); setScenario(id); setPrediction(null); demo.reset(); };
  const choose = (id: string) => change({ ...defaults, retriever: id === "a" ? "hybrid" : "degraded" }, id);
  const verdict = (result: ExperienceResult) => result.gate;
  const label = (result: ExperienceResult) => verdict(result) === "unscored" ? (es ? "Sin evidencia etiquetada" : "No labeled evidence") : verdict(result) === "pass" ? (es ? "Pasa la compuerta" : "Gate passes") : (es ? "Compuerta bloqueada" : "Gate blocks");
  const detail = (result: ExperienceResult) => result.gate === "unscored" ? (es ? "Sin etiquetas relevantes; recall no evaluable." : "No relevant labels; recall cannot be evaluated.") : `${es ? "Precisión" : "Precision"}: ${(result.precision * 100).toFixed(0)}% · Recall: ${(result.recall * 100).toFixed(0)}% · ${result.ranking.join(" → ") || (es ? "Sin pasajes" : "No passages")}`;
  return <main className="min-h-screen bg-background px-5 py-12 text-foreground sm:px-6"><div className="mx-auto max-w-5xl">
    <MissionBrief locale={locale} name="Veredicto" title={es ? "¿Liberarías esta búsqueda para soporte?" : "Would you release this support search?"} context={s.problem} role={s.user} stakes={s.value}/>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]"><section className="min-w-0 rounded-xl border border-border p-5">
      <button data-mission-challenge className="mb-5 min-h-11 rounded border border-accent px-4 text-sm" onClick={() => choose("b")}>{es ? "Reto: recuperación vacía" : "Challenge: empty retrieval"}</button>
      <ScenarioPicker locale={locale} selected={scenario} onSelect={choose} options={[{id:"a",label:s.scenarioA.title,description:s.scenarioA.input},{id:"b",label:s.scenarioB.title,description:s.scenarioB.input}]}/>
      <label className="block text-sm">{es ? "Pregunta de referencia" : "Benchmark question"}<select className="mt-2 w-full rounded border bg-background p-3" value={input.queryId} onChange={e => change({...input,queryId:e.target.value})}>{questions.map(q => <option key={q.id} value={q.id}>{es ? q.query : englishQuestionLabels[q.id] ?? q.id}</option>)}</select></label>
      <label className="mt-4 block text-sm">{es ? "Recuperador" : "Retriever"}<select className="mt-2 w-full rounded border bg-background p-3" value={input.retriever} onChange={e => change({...input,retriever:e.target.value as ExperienceInput["retriever"]})}>{["bm25","tfidf","hybrid","degraded"].map(id => <option key={id} value={id}>{id === "hybrid" ? (es ? "Híbrido" : "Hybrid") : id === "degraded" ? (es ? "Control negativo: vacío" : "Negative control: empty") : id.toUpperCase()}</option>)}</select></label>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{es ? "Top 3 sobre el corpus local comprometido. Las traducciones mantienen intacta la consulta original del conjunto en español. La compuerta compara recall con BM25 para una sola pregunta." : "Top 3 on the committed local corpus. Display translations keep the original Spanish benchmark query unchanged. The gate compares recall with BM25 for one question."}</p>
      <MissionPrompt locale={locale} question={es ? "¿Pasará la configuración seleccionada?" : "Will the selected configuration pass?"} options={[{id:"pass",label:es?"Pasará":"Pass"},{id:"block",label:es?"Se bloqueará":"Block"},{id:"unscored",label:es?"Sin evidencia etiquetada":"No labeled evidence"}]} prediction={prediction} onPredict={setPrediction} locked={demo.running || !!run}/>
      <div className="flex flex-wrap gap-2"><button data-run-experiment disabled={demo.running} className="min-h-11 flex-1 rounded bg-accent px-4 text-white disabled:opacity-50" onClick={() => demo.execute(input)}>{es ? "Evaluar" : "Evaluate"}</button><button className="rounded border px-3" onClick={demo.cancel}>{es?"Cancelar":"Cancel"}</button><button className="rounded border px-3" onClick={() => change(defaults,"a")}>{es?"Reiniciar":"Reset"}</button></div>
      {demo.error && <p role="alert" className="mt-3 text-danger">{es ? "No se pudo evaluar la pregunta." : "The query could not be evaluated."}</p>}
    </section><section className="min-w-0">{run ? <TracePlayer collapsible locale={locale} trace={run.trace} executionMs={run.executionMs} translate={key => traceCopy(locale,key)} renderStage={frame => <><VeredictoScene frame={frame} input={run.input} result={run.result} locale={locale}/>{frame.complete && <MissionComparison locale={locale} sides={[{label:es?"Tu configuración":"Selected configuration",value:label(run.result.comparison.selected),detail:detail(run.result.comparison.selected)},{label:es?"Referencia BM25":"BM25 reference",value:label(run.result.comparison.reference),detail:detail(run.result.comparison.reference)}]} explanation={es ? "Misma pregunta, corpus y top 3; solo cambia el recuperador. Precisión = pasajes relevantes recuperados / 3; recall = relevantes recuperados / relevantes etiquetados. Un empate no identifica un ganador. Una pregunta sin etiquetas relevantes no puede aprobar esta compuerta." : "Same question, corpus and top 3; only the retriever changes. Precision = relevant retrieved passages / 3; recall = relevant retrieved passages / labeled relevant passages. A tie identifies no winner. A query without relevant labels cannot pass this quality gate."} prediction={prediction} actual={verdict(run.result)} actualLabel={label(run.result)}/>}</>}/> : <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">{es ? "Inspecciona los datos y ejecuta para revelar el ranking." : "Inspect the inputs and evaluate to reveal the ranking."}</p>}</section></div>
    <DecisionNotes locale={locale} implementation={es ? "BM25, TF-IDF y fusión de rankings calculados localmente; sin modelo en vivo." : "Local BM25, TF-IDF and rank fusion; no live model."} rationale={es ? "Una pregunta hace la aritmética inspeccionable, pero no certifica un lanzamiento. El control degradado devuelve cero pasajes por diseño. La calibración existente es referencia, no resultado de esta ejecución." : "One question makes the arithmetic inspectable, but cannot certify a release. The degraded control returns no passages by design. Existing calibration is reference data, not evidence from this run."} production={es ? "Evaluar un conjunto representativo etiquetado, regresiones por segmento, privacidad y calidad de citas antes de liberar." : "Evaluate a representative labeled set, segment regressions, privacy and citation quality before release."}/>
  </div></main>;
}
