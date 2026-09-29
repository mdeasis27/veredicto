"""Inter-rater agreement + judge calibration statistics.

Mirrors lib/eval/agreement.ts. Reference values for the unit tests are generated
with scikit-learn and committed in tests/fixtures/agreement.json so the two
implementations are pinned to the same ground truth.
"""

from __future__ import annotations

from typing import Sequence


def _confusion(a: Sequence, b: Sequence):
    if len(a) != len(b):
        raise ValueError("label arrays must have equal length")
    labels = sorted(set(a) | set(b))
    index = {label: i for i, label in enumerate(labels)}
    m = len(labels)
    observed = [[0] * m for _ in range(m)]
    for x, y in zip(a, b):
        observed[index[x]][index[y]] += 1
    row_sum = [sum(row) for row in observed]
    col_sum = [sum(observed[i][j] for i in range(m)) for j in range(m)]
    return len(a), m, observed, row_sum, col_sum


def cohen_kappa(a: Sequence, b: Sequence) -> float:
    """Cohen's kappa for nominal labels (chance-corrected agreement)."""
    n, m, observed, row_sum, col_sum = _confusion(a, b)
    if n == 0:
        return 0.0
    po = sum(observed[i][i] for i in range(m)) / n
    pe = sum((row_sum[i] / n) * (col_sum[i] / n) for i in range(m))
    if abs(1 - pe) < 1e-12:
        return 1.0 if po >= 1 else 0.0
    return (po - pe) / (1 - pe)


def weighted_kappa(a: Sequence, b: Sequence, weights: str = "quadratic") -> float:
    """Weighted kappa for ordinal labels (linear or quadratic weights)."""
    n, m, observed, row_sum, col_sum = _confusion(a, b)
    if m <= 1:
        return 1.0
    max_distance = m - 1

    def w(i: int, j: int) -> float:
        d = abs(i - j) / max_distance
        return d * d if weights == "quadratic" else d

    numerator = sum(w(i, j) * observed[i][j] / n for i in range(m) for j in range(m))
    denominator = sum(
        w(i, j) * (row_sum[i] * col_sum[j]) / (n * n) for i in range(m) for j in range(m)
    )
    if denominator == 0:
        return 1.0
    return 1 - numerator / denominator


def _ranks(values: Sequence) -> list[float]:
    order = sorted(range(len(values)), key=lambda i: values[i])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
            j += 1
        avg = (i + j) / 2 + 1
        for k in range(i, j + 1):
            ranks[order[k]] = avg
        i = j + 1
    return ranks


def pearson(x: Sequence, y: Sequence) -> float:
    n = len(x)
    if n == 0:
        raise ValueError("pearson: empty input")
    mx = sum(x) / n
    my = sum(y) / n
    cov = var_x = var_y = 0.0
    for xi, yi in zip(x, y):
        dx = xi - mx
        dy = yi - my
        cov += dx * dy
        var_x += dx * dx
        var_y += dy * dy
    if var_x == 0 or var_y == 0:
        return 0.0
    return cov / (var_x * var_y) ** 0.5


def spearman(x: Sequence, y: Sequence) -> float:
    """Spearman rank correlation (Pearson on average ranks, tie-aware)."""
    return pearson(_ranks(x), _ranks(y))


def mean_absolute_error(a: Sequence, b: Sequence) -> float:
    if len(a) != len(b) or len(a) == 0:
        raise ValueError("mean_absolute_error: equal, non-empty arrays required")
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a)


def expected_calibration_error(
    confidences: Sequence, correct: Sequence, bins: int = 10
) -> float:
    n = len(confidences)
    if n == 0:
        return 0.0
    buckets = [(0.0, 0.0, 0) for _ in range(bins)]
    for c, ok in zip(confidences, correct):
        b = min(bins - 1, max(0, int(c * bins)))
        conf, acc, count = buckets[b]
        buckets[b] = (conf + c, acc + (1 if ok else 0), count + 1)
    ece = 0.0
    for conf, acc, count in buckets:
        if count == 0:
            continue
        ece += (count / n) * abs(conf / count - acc / count)
    return ece


def brier_score(confidences: Sequence, correct: Sequence) -> float:
    if len(confidences) == 0:
        return 0.0
    return sum((c - (1 if ok else 0)) ** 2 for c, ok in zip(confidences, correct)) / len(
        confidences
    )
