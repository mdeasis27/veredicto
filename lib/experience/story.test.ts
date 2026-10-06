import { describe, expect, it } from "vitest";
import { STORY } from "./story";
import { lintStory, storyStrings as strings } from "@/design-system/demo/copy-lint";

describe("Veredicto story copy", () => {
  it("has the same shape in English and Spanish", () => {
    const keys = (o: unknown): string[] => o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).filter(([k]) => k !== "before" && k !== "after").flatMap(([k, v]) => [k, ...keys(v).map(x => `${k}.${x}`)]) : [];
    expect(keys(STORY.es)).toEqual(keys(STORY.en));
    expect(STORY.es.analogy.dictionary).toHaveLength(STORY.en.analogy.dictionary.length);
  });

  it("has no empty strings except the owner-supplied why note", () => {
    for (const locale of ["en", "es"] as const) {
      const { why, ...rest } = STORY[locale];
      expect(why.title.trim()).not.toBe("");
      for (const s of strings(rest)) expect(s.trim(), `${locale}: empty string`).not.toBe("");
    }
  });

  it("avoids AI-sounding patterns and brand names", () => {
    for (const locale of ["en", "es"] as const) expect(lintStory(STORY[locale]), locale).toEqual([]);
  });

  it("states the comparison truthfully at a gap, one, a tie, zero and the reverse case", () => {
    expect(STORY.es.compare.sentence(1, 0)).toBe("Con tu ajuste se perdió 1 pregunta. Leyendo 8 pasajes, ninguna.");
    expect(STORY.en.compare.sentence(3, 0)).toBe("With your setting, 3 questions were missed. Reading 8 passages, none.");
    expect(STORY.en.compare.sentence(0, 0)).toContain("every answerable question");
    expect(STORY.es.compare.sentence(2, 2)).toBe("Los dos ajustes perdieron 2 preguntas.");
    expect(STORY.en.compare.sentence(0, 1)).toContain("reading less did better");
  });

  it("asks the bet about the passages the visitor chose and states the graded quantity", () => {
    expect(STORY.en.tryIt.question(3)).toContain("reading 3 passages per question");
    expect(STORY.es.tryIt.question(1)).toContain("leyendo 1 pasaje por pregunta");
    expect([0, 1, 2].map(STORY.es.compare.verdict)).toEqual(["No se perdió ninguna pregunta con respuesta", "Se perdió 1 pregunta con respuesta", "Se perdieron 2 preguntas con respuesta"]);
  });

  it("words the grading scene correctly in both languages and passes the copy lint", () => {
    expect(STORY.en.scene.notes.served(1, 3)).toBe("Passages 1 and 3 hold the evidence");
    expect(STORY.es.scene.notes.served(1, 2, 4)).toBe("Los pasajes 1, 2 y 4 tienen la evidencia");
    expect(STORY.es.scene.notes.served(6)).toBe("El pasaje 6 tiene la evidencia");
    expect(STORY.en.scene.reads(1)).toBe("The student reads 1 passage");
    expect(STORY.es.scene.missedOf(1, 21)).toBe("Preguntas con respuesta perdidas: 1 de 21");
    expect(STORY.en.scene.sheetLabel(20, 21, 3, 14)).toContain("missed: question 14");
    for (const locale of ["en", "es"] as const) {
      const sc = STORY[locale].scene;
      const generated = [sc.reads(3), sc.question(14), sc.notes.served(1), sc.notes.served(1, 2), sc.sheetLabel(21, 21, 3), sc.sheetLabel(20, 21, 3, 14), sc.missedOf(0, 21)];
      expect(lintStory(generated), locale).toEqual([]);
    }
  });
});
