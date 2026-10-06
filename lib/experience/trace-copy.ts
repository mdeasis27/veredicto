const COPY: Record<string, { en: string; es: string }> = {
  "batch.1": { en: "questions 1 to 6 graded", es: "preguntas 1 a 6 calificadas" },
  "batch.2": { en: "questions 7 to 12 graded", es: "preguntas 7 a 12 calificadas" },
  "batch.3": { en: "questions 13 to 18 graded", es: "preguntas 13 a 18 calificadas" },
  "batch.4": { en: "questions 19 to 24 graded", es: "preguntas 19 a 24 calificadas" },
};
export function traceCopy(locale: "en" | "es", key: string) { return COPY[key]?.[locale] ?? key; }
