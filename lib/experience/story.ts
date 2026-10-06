import type { Heading } from "@/design-system/demo/project-story";

export interface VeredictoStory {
  name: string;
  oneLiner: string;
  chips: string[];
  analogy: { heading: Heading; paragraphs: string[]; dictionaryLabel: string; dictionary: { term: string; means: string }[] };
  why: { title: string; text: string };
  tryIt: { heading: Heading; lead: string; question: (k: number) => string; yes: string; no: string; kLabel: string; note: string; simulate: string; cancel: string; reset: string; error: string; idle: string };
  compare: { heading: Heading; lead: string; mine: (k: number) => string; wide: string; missed: string; sentence: (mine: number, wide: number) => string; verdict: (missed: number) => string };
  fit: { heading: Heading; worthLabel: string; worth: string; notLabel: string; not: string };
  proves: { heading: Heading; text: string };
  engineers: { summary: string; points: string[]; repoLabel: string };
  scene: {
    title: string; caption: string; reads: (k: number) => string; question: (n: number) => string; waiting: string; passage: string;
    notes: { served: (...pages: number[]) => string; partial: string; lost: string; rerouted: string };
    exam: string; sameExam: string; offSyllabus: string; sheetLabel: (found: number, answerable: number, offSyllabus: number, ...missed: number[]) => string; missedOf: (n: number, of: number) => string;
  };
}

export const STORY: Record<"en" | "es", VeredictoStory> = {
  en: {
    name: "Retrieval evaluation",
    oneLiner: "If the exam stays the same, every new score tells you whether the search got better or worse.",
    chips: ["Search evaluation", "2 min", "Live demo"],
    analogy: {
      heading: { before: "The", accent: "analogy" },
      paragraphs: [
        "A teacher who gives the same exam every term can tell whether the class improved. Change the questions each time and a good grade could just mean an easier exam.",
        "Here the student is a search system and the exam is 24 fixed questions whose right passages are known. The slider decides how many passages the search reads per question before it answers.",
      ],
      dictionaryLabel: "In the diagram below",
      dictionary: [
        { term: "the exam", means: "24 fixed questions" },
        { term: "the student", means: "the search system" },
        { term: "the pages it reads", means: "passages read per question" },
        { term: "a question off the syllabus", means: "one with no answer in the documents" },
      ],
    },
    why: { title: "Why I built it", text: "" },
    tryIt: {
      heading: { before: "Try", accent: "it" },
      lead: "Twenty-four questions about a set of policy documents. Twenty-one have their answer somewhere in the documents; three don't.",
      question: (k) => `Before you run it, place a bet: reading ${k} ${k === 1 ? "passage" : "passages"} per question, do all 21 answerable questions find their evidence?`,
      yes: "Yes, all 21",
      no: "No, some are missed",
      kLabel: "Passages read per question",
      note: "Each line on the exam sheet is one question, in order. Read more passages and the search finds more, but it also hands more text to whoever reads the answer.",
      simulate: "Run it",
      cancel: "Cancel",
      reset: "Start over",
      error: "The exam could not be graded. Try another number of passages.",
      idle: "Place your bet and press Run it.",
    },
    compare: {
      heading: { before: "Your setting", accent: "or reading 8" },
      lead: "Same exam, same search. The only change is how many passages it reads per question.",
      mine: (k) => `Your setting (${k})`,
      wide: "Reading 8 passages",
      missed: "questions missed",
      sentence: (mine, wide) => {
        if (mine === wide) return mine === 0 ? "Both settings found the evidence for every answerable question." : `Both settings missed ${mine} ${mine === 1 ? "question" : "questions"}.`;
        if (mine < wide) return `This time reading less did better: ${mine} missed against ${wide}.`;
        return `With your setting, ${mine} ${mine === 1 ? "question was" : "questions were"} missed. Reading 8 passages, ${wide === 0 ? "none" : wide}.`;
      },
      verdict: (n) => n === 0 ? "No answerable question was missed" : n === 1 ? "1 answerable question was missed" : `${n} answerable questions were missed`,
    },
    fit: {
      heading: { before: "Where it", accent: "fits" },
      worthLabel: "Worth it",
      worth: "Before changing anything in a search that feeds answers to customers or staff. I picture an internal help desk that answers from policy manuals.",
      notLabel: "Not needed",
      not: "For a one-off prototype nobody depends on yet, or when nobody can say which passages are the right ones for each question.",
    },
    proves: {
      heading: { before: "What it", accent: "proves" },
      text: "I didn't trust a good result on one question. I set a fixed exam first, so every change to the search could be measured against the same ruler.",
    },
    engineers: {
      summary: "For engineers",
      points: [
        "Hybrid retrieval: BM25 and TF-IDF merged by reciprocal rank fusion over a 16-passage corpus. A question passes when recall at k is 0.5 or more.",
        "Three questions have no labelled evidence and are left unscored on purpose, so the exam can't reward an answer that isn't in the documents.",
        "Recall, regression diffs, judge agreement and calibration are shared with the Python backend; the retrievers and this exam run are TypeScript only.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Source code",
    },
    scene: {
      title: "The teacher grades the exam",
      caption: "Each question gets a tick when the passages read hold at least half of its evidence, a cross when it is missed, and a blue note when its answer is not in the documents.",
      reads: (k) => `The student reads ${k} ${k === 1 ? "passage" : "passages"}`,
      question: (n) => `Question ${n}`,
      waiting: "Grading starts",
      passage: "passage",
      notes: {
        served: (...pages) => pages.length === 1 ? `Passage ${pages[0]} holds the evidence` : `Passages ${pages.slice(0, -1).join(", ")} and ${pages[pages.length - 1]} hold the evidence`,
        partial: "Only part of its evidence was in these passages",
        lost: "None of these passages holds its evidence",
        rerouted: "Not in the documents, so it is not graded",
      },
      exam: "Exam",
      sameExam: "same exam every time",
      offSyllabus: "off the syllabus",
      sheetLabel: (found, answerable, off, ...missed) => `Exam sheet: ${found} of ${answerable} answerable questions found their evidence, ${off} off the syllabus${missed.length ? `, missed: ${missed.length === 1 ? "question" : "questions"} ${missed.join(", ")}` : ", none missed"}.`,
      missedOf: (n, of) => `Answerable questions missed: ${n} of ${of}`,
    },
  },
  es: {
    name: "Veredicto",
    oneLiner: "Si el examen es siempre el mismo, cada calificación nueva te dice si el buscador mejoró o empeoró.",
    chips: ["Evaluación de búsqueda", "2 min", "Demo en vivo"],
    analogy: {
      heading: { accent: "La analogía" },
      paragraphs: [
        "Una maestra que pone el mismo examen cada semestre puede saber si el grupo mejoró. Si cambia las preguntas cada vez, una buena calificación podría ser solo un examen más fácil.",
        "Aquí el alumno es un buscador y el examen son 24 preguntas fijas cuyos pasajes correctos ya se conocen. El slider decide cuántos pasajes lee el buscador por pregunta antes de responder.",
      ],
      dictionaryLabel: "En el diagrama de abajo",
      dictionary: [
        { term: "el examen", means: "24 preguntas fijas" },
        { term: "el alumno", means: "el buscador" },
        { term: "las páginas que lee", means: "pasajes leídos por pregunta" },
        { term: "una pregunta fuera del temario", means: "una sin respuesta en los documentos" },
      ],
    },
    why: { title: "Por qué lo hice", text: "" },
    tryIt: {
      heading: { accent: "Pruébalo" },
      lead: "Veinticuatro preguntas sobre un conjunto de documentos de políticas. Veintiuna tienen su respuesta en algún documento; tres no.",
      question: (k) => `Antes de correrlo, apuesta: leyendo ${k} ${k === 1 ? "pasaje" : "pasajes"} por pregunta, ¿las 21 preguntas con respuesta encuentran su evidencia?`,
      yes: "Sí, las 21",
      no: "No, se pierde alguna",
      kLabel: "Pasajes leídos por pregunta",
      note: "Cada renglón de la hoja es una pregunta del examen, en orden. Si lee más pasajes, el buscador encuentra más, pero también le pasa más texto a quien lee la respuesta.",
      simulate: "Correr",
      cancel: "Cancelar",
      reset: "Empezar de nuevo",
      error: "No se pudo calificar el examen. Prueba con otro número de pasajes.",
      idle: "Haz tu apuesta y presiona Correr.",
    },
    compare: {
      heading: { before: "Tu ajuste", accent: "o leer 8" },
      lead: "Mismo examen, mismo buscador. Lo único que cambia es cuántos pasajes lee por pregunta.",
      mine: (k) => `Tu ajuste (${k})`,
      wide: "Leyendo 8 pasajes",
      missed: "preguntas perdidas",
      sentence: (mine, wide) => {
        if (mine === wide) return mine === 0 ? "Los dos ajustes encontraron la evidencia de todas las preguntas con respuesta." : `Los dos ajustes perdieron ${mine} ${mine === 1 ? "pregunta" : "preguntas"}.`;
        if (mine < wide) return `Esta vez leer menos salió mejor: ${mine} perdidas contra ${wide}.`;
        return `Con tu ajuste se ${mine === 1 ? "perdió 1 pregunta" : `perdieron ${mine} preguntas`}. Leyendo 8 pasajes, ${wide === 0 ? "ninguna" : wide}.`;
      },
      verdict: (n) => n === 0 ? "No se perdió ninguna pregunta con respuesta" : n === 1 ? "Se perdió 1 pregunta con respuesta" : `Se perdieron ${n} preguntas con respuesta`,
    },
    fit: {
      heading: { before: "¿Dónde", accent: "sirve", after: "?" },
      worthLabel: "Vale la pena",
      worth: "Antes de cambiar cualquier cosa en un buscador que da respuestas a clientes o empleados. Pienso en una mesa de ayuda interna que responde con manuales de políticas.",
      notLabel: "No hace falta",
      not: "En un prototipo de una sola vez del que nadie depende todavía, o cuando nadie puede decir cuáles son los pasajes correctos de cada pregunta.",
    },
    proves: {
      heading: { before: "Lo que", accent: "demuestra" },
      text: "No me fié de un buen resultado en una pregunta. Primero armé un examen fijo, para medir cada cambio al buscador con la misma regla.",
    },
    engineers: {
      summary: "Para ingenieros",
      points: [
        "Búsqueda híbrida: BM25 y TF-IDF combinados con reciprocal rank fusion sobre un corpus de 16 pasajes. Una pregunta pasa cuando el recall en k es 0.5 o más.",
        "Tres preguntas no tienen evidencia etiquetada y a propósito no se califican, para que el examen no premie una respuesta que no está en los documentos.",
        "Recall, comparación de corridas, acuerdo del juez y calibración se comparten con el backend en Python; los buscadores y esta corrida del examen son solo TypeScript.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Código fuente",
    },
    scene: {
      title: "La maestra califica el examen",
      caption: "Cada pregunta recibe una palomita si los pasajes leídos tienen al menos la mitad de su evidencia, una × si se pierde y una nota azul si su respuesta no está en los documentos.",
      reads: (k) => `El alumno lee ${k} ${k === 1 ? "pasaje" : "pasajes"}`,
      question: (n) => `Pregunta ${n}`,
      waiting: "Empieza la calificación",
      passage: "pasaje",
      notes: {
        served: (...pages) => pages.length === 1 ? `El pasaje ${pages[0]} tiene la evidencia` : `Los pasajes ${pages.slice(0, -1).join(", ")} y ${pages[pages.length - 1]} tienen la evidencia`,
        partial: "Solo parte de su evidencia estaba en estos pasajes",
        lost: "Ninguno de estos pasajes tiene su evidencia",
        rerouted: "No está en los documentos, así que no se califica",
      },
      exam: "Examen",
      sameExam: "mismo examen cada vez",
      offSyllabus: "fuera del temario",
      sheetLabel: (found, answerable, off, ...missed) => `Hoja del examen: ${found} de ${answerable} preguntas con respuesta encontraron su evidencia, ${off} fuera del temario${missed.length ? `, perdidas: ${missed.length === 1 ? "pregunta" : "preguntas"} ${missed.join(", ")}` : ", ninguna perdida"}.`,
      missedOf: (n, of) => `Preguntas con respuesta perdidas: ${n} de ${of}`,
    },
  },
};
