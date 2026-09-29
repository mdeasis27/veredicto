"""Judge interface + deterministic lexical judge (demo mode).

Mirrors lib/eval/demo-judge.ts. A production judge is any callable that maps
(answer, source) -> {"correccion": int, "completitud": int, "confidence": float};
the harness scores whatever Judge it is handed, so the calibration math is
independent of the judge implementation.
"""

from __future__ import annotations

from typing import Protocol

STOP = {
    "de", "la", "el", "los", "las", "un", "una", "unos", "unas",
    "es", "son", "por", "para", "con", "en", "y", "o", "a", "al",
    "del", "se", "que", "no", "su", "sus", "lo", "este", "esta",
}


class Judge(Protocol):
    def score(self, answer: str, source: str) -> dict:
        """Return {'correccion': int, 'completitud': int, 'confidence': float}."""


def _tokens(text: str) -> list[str]:
    import re
    import unicodedata

    folded = "".join(
        c for c in unicodedata.normalize("NFD", text.lower()) if not unicodedata.combining(c)
    )
    return [t for t in re.split(r"[^a-z0-9]+", folded) if t and t not in STOP]


def _to_ordinal(value: float, high: float, low: float) -> int:
    if value >= high:
        return 3
    if value >= low:
        return 2
    return 1


class LexicalJudge:
    """Deliberately naive lexical-overlap judge used only by the offline demo."""

    def score(self, answer: str, source: str) -> dict:
        answer_tokens = set(_tokens(answer))
        source_tokens = set(_tokens(source))
        supported = sum(1 for t in answer_tokens if t in source_tokens)
        coverage = 0.0 if not answer_tokens else supported / len(answer_tokens)
        completeness = 0.0 if not source_tokens else supported / len(source_tokens)
        return {
            "correccion": _to_ordinal(coverage, 0.5, 0.2),
            "completitud": _to_ordinal(completeness, 0.35, 0.12),
            "confidence": min(0.95, 0.5 + 0.45 * coverage),
        }
