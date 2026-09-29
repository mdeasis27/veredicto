import { describe, expect, it } from "vitest";

import { bm25Retriever, reciprocalRankFusion, tfidfRetriever } from "./retrievers";

const corpus = [
  { id: "c1", text: "La tasa de interés de mora para créditos de consumo es 12 por ciento anual." },
  { id: "c2", text: "El plazo máximo para un crédito hipotecario es de veinte años." },
  { id: "c3", text: "La verificación de identidad usa biometría facial y consulta de listas de sanciones." },
];

describe("bm25Retriever", () => {
  const retrieve = bm25Retriever(corpus);

  it("surfaces the chunk that mentions the exact term", () => {
    const result = retrieve("tasa de interés mora", 3);
    expect(result[0]).toBe("c1");
  });

  it("is deterministic", () => {
    const a = retrieve("verificación de identidad", 3);
    const b = retrieve("verificación de identidad", 3);
    expect(a).toEqual(b);
  });
});

describe("tfidfRetriever", () => {
  it("returns ranked ids without crashing on unknown terms", () => {
    const retrieve = tfidfRetriever(corpus);
    const result = retrieve("biometría facial", 3);
    expect(result[0]).toBe("c3");
    expect(retrieve("zzzzz", 3)).toEqual([]);
  });
});

describe("reciprocalRankFusion", () => {
  it("merges results from multiple retrievers without duplicates", () => {
    const sparse = bm25Retriever(corpus);
    const dense = tfidfRetriever(corpus);
    const hybrid = reciprocalRankFusion([sparse, dense], corpus);
    const result = hybrid("crédito", 3);
    expect(new Set(result).size).toBe(result.length);
    expect(result.length).toBeLessThanOrEqual(3);
  });
});
