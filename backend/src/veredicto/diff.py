"""Regression detection between two eval runs.

Mirrors lib/eval/diff.ts.
"""

from __future__ import annotations

from typing import Mapping, Sequence

DEFAULT_THRESHOLDS = {"warningPct": 3.0, "criticalPct": 8.0}


def compare_runs(
    baseline: Mapping[str, bool],
    current: Mapping[str, bool],
    thresholds: Mapping[str, float] | None = None,
) -> dict:
    t = dict(DEFAULT_THRESHOLDS if thresholds is None else thresholds)
    regressions = sorted(cid for cid, ok in current.items() if baseline.get(cid) is True and not ok)
    improvements = sorted(
        cid for cid, ok in current.items() if baseline.get(cid) is False and ok
    )
    base_rate = sum(1 for ok in baseline.values() if ok) / len(baseline) if baseline else 0.0
    curr_rate = sum(1 for ok in current.values() if ok) / len(current) if current else 0.0
    delta_points = (curr_rate - base_rate) * 100
    if delta_points <= -t["criticalPct"]:
        severity = "critical"
    elif delta_points <= -t["warningPct"]:
        severity = "warning"
    else:
        severity = "ok"
    return {
        "passRateBaseline": base_rate,
        "passRateCurrent": curr_rate,
        "deltaPoints": delta_points,
        "regressions": regressions,
        "improvements": improvements,
        "severity": severity,
    }
