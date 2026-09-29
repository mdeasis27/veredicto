"""Retrieval metrics: precision@k, recall@k, MRR, nDCG@k, average precision.

Mirrors lib/eval/retrieval.ts.
"""

from __future__ import annotations

import math
from typing import Sequence


def precision_at_k(retrieved: Sequence, relevant: set, k: int) -> float:
    if k <= 0:
        return 0.0
    hits = sum(1 for cid in retrieved[:k] if cid in relevant)
    return hits / k


def recall_at_k(retrieved: Sequence, relevant: set, k: int) -> float:
    if not relevant:
        return 0.0
    hits = sum(1 for cid in retrieved[:k] if cid in relevant)
    return hits / len(relevant)


def reciprocal_rank(retrieved: Sequence, relevant: set, k: int | None = None) -> float:
    top_k = retrieved if k is None else retrieved[:k]
    for i, cid in enumerate(top_k):
        if cid in relevant:
            return 1.0 / (i + 1)
    return 0.0


def mean_reciprocal_rank(queries: Sequence, k: int | None = None) -> float:
    if not queries:
        return 0.0
    total = sum(reciprocal_rank(q["retrieved"], q["relevant"], k) for q in queries)
    return total / len(queries)


def _dcg(gains: Sequence, k: int) -> float:
    total = 0.0
    for i, g in enumerate(gains[:k]):
        total += g / math.log2(i + 2)
    return total


def ndcg_at_k(retrieved: Sequence, relevant: set, k: int) -> float:
    gains = [1 if cid in relevant else 0 for cid in retrieved[:k]]
    ideal_hits = min(len(relevant), k)
    if ideal_hits == 0:
        return 0.0
    ideal = [1] * ideal_hits
    idcg = _dcg(ideal, k)
    if idcg == 0:
        return 0.0
    return _dcg(gains, k) / idcg


def average_precision(retrieved: Sequence, relevant: set) -> float:
    if not relevant:
        return 0.0
    hits = 0
    total = 0.0
    for i, cid in enumerate(retrieved):
        if cid in relevant:
            hits += 1
            total += hits / (i + 1)
    return total / len(relevant)
