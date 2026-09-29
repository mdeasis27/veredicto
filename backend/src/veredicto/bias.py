"""Judge bias audit: position bias, length bias, self-preference.

Mirrors lib/eval/bias.ts.
"""

from __future__ import annotations

from typing import Callable, Sequence

from .agreement import spearman

PairwiseVerdict = str  # "first" | "second" | "tie"


def position_bias(
    pairs: Sequence,
    judge: Callable[[str, str], PairwiseVerdict],
) -> dict:
    flipped: list[str] = []
    for pair in pairs:
        forward = judge(pair["a"], pair["b"])
        reverse = judge(pair["b"], pair["a"])
        winner_forward = "a" if forward == "first" else ("b" if forward == "second" else "tie")
        winner_reverse = "b" if reverse == "first" else ("a" if reverse == "second" else "tie")
        if winner_forward != winner_reverse:
            flipped.append(pair["id"])
    total = len(pairs)
    flips = len(flipped)
    return {
        "flips": flips,
        "total": total,
        "flipRate": flips / total if total else 0.0,
        "consistency": 1 - flips / total if total else 0.0,
        "flippedIds": flipped,
    }


def length_bias(items: Sequence) -> float:
    if len(items) < 2:
        return 0.0
    return spearman([i["score"] for i in items], [i["length"] for i in items])


def self_preference(self_scores: Sequence, competitor_scores: Sequence) -> dict:
    if len(self_scores) != len(competitor_scores) or len(self_scores) == 0:
        raise ValueError("self_preference: equal, non-empty arrays required")
    n = len(self_scores)
    mean_self = sum(self_scores) / n
    mean_competitor = sum(competitor_scores) / n
    wins = sum(1 for s, c in zip(self_scores, competitor_scores) if s > c)
    return {
        "meanSelf": mean_self,
        "meanCompetitor": mean_competitor,
        "delta": mean_self - mean_competitor,
        "selfWinRate": wins / n,
    }
