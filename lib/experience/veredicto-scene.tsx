import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { OutcomeBlock, StoryStage } from "@/design-system/demo/decision-lab";
import type { ExperienceInput, ExperienceResult } from "./adapter";

export function VeredictoScene({ frame, input, result, locale }: { frame: PlaybackFrame<TraceEvent>; input: ExperienceInput; result: ExperienceResult; locale: "en" | "es" }) {
  const es = locale === "es";
  const gate = result.gate;

  return <StoryStage locale={locale} title={es ? "Ranking calculado" : "Computed ranking"} caption={es ? "Cada peldaño es un fragmento recuperado por la configuración elegida." : "Each rung is a chunk retrieved by the selected configuration."} step={frame.visible} total={frame.total}>
    <svg role="img" aria-label={es ? "Escalera de ranking" : "Ranking ladder"} viewBox="0 0 440 190" className="h-56 w-full">
      {result.ranking.map((id, index) => {
        const active = index < frame.visible;
        return <g key={id} transform={`translate(${30 + index * 18},${22 + index * 48})`} className="transition-transform duration-500">
          <rect width={310 - index * 36} height="31" rx="8" className={active ? "fill-accent/25 stroke-accent" : "fill-muted stroke-border"} />
          {active && <text x="12" y="20" className="fill-foreground text-[11px]">#{index + 1} · {id}</text>}
        </g>;
      })}
      {frame.complete && <line x1="365" y1="20" x2="365" y2="168" className={gate === "unscored" ? "stroke-info" : gate === "pass" ? "stroke-success" : "stroke-danger"} strokeWidth="4" />}
    </svg>
    {frame.complete && <OutcomeBlock tone={gate === "unscored" ? "info" : gate === "pass" ? "success" : "danger"} title={gate === "unscored" ? (es ? "Sin evidencia etiquetada para evaluar" : "No labeled evidence to evaluate") : gate === "pass" ? (es ? "Compuerta local aprobada" : "Local gate passes") : (es ? "Compuerta local bloqueada" : "Local gate blocks")} explanation={gate === "unscored" ? (es ? "Esta pregunta no tiene pasajes relevantes etiquetados; no puede evaluarse con esta compuerta." : "This query has no labeled relevant passages and cannot be evaluated by this gate.") : es ? `Cambio de la tasa de aprobación de una pregunta frente a BM25: ${result.regression.deltaPoints.toFixed(0)} puntos. La compuerta también exige recall mínimo de 0.5.` : `Single-query pass-rate change against BM25: ${result.regression.deltaPoints.toFixed(0)} points. The gate also requires recall of at least 0.5.`} />}
  </StoryStage>;
}
