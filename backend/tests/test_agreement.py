import json
from pathlib import Path

import pytest

from veredicto.agreement import (
    cohen_kappa,
    mean_absolute_error,
    spearman,
    weighted_kappa,
)

FIXTURE = Path(__file__).parent / "fixtures" / "agreement.json"


def _load():
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def test_cohen_kappa_matches_sklearn_reference():
    for case in _load()["cohen"]:
        assert cohen_kappa(case["a"], case["b"]) == pytest.approx(case["expected"], abs=1e-9)


def test_weighted_kappa_matches_sklearn_reference():
    for case in _load()["weighted"]:
        assert weighted_kappa(case["a"], case["b"], "linear") == pytest.approx(
            case["linear"], abs=1e-9
        )
        assert weighted_kappa(case["a"], case["b"], "quadratic") == pytest.approx(
            case["quadratic"], abs=1e-9
        )


def test_spearman_matches_scipy_reference():
    for case in _load()["spearman"]:
        assert spearman(case["x"], case["y"]) == pytest.approx(case["expected"], abs=1e-9)


def test_mae_matches_sklearn_reference():
    for case in _load()["mae"]:
        assert mean_absolute_error(case["a"], case["b"]) == pytest.approx(
            case["expected"], abs=1e-9
        )
