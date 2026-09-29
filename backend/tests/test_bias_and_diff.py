from veredicto.bias import length_bias, position_bias, self_preference
from veredicto.diff import compare_runs


def _order_blind(a: str, b: str) -> str:
    if len(a) < len(b):
        return "first"
    if len(a) > len(b):
        return "second"
    return "tie"


def test_position_bias_detects_always_first_judge():
    pairs = [
        {"id": "p1", "a": "alpha", "b": "beta"},
        {"id": "p2", "a": "gamma", "b": "delta"},
    ]
    result = position_bias(pairs, lambda *_: "first")
    assert result["flipRate"] == 1.0
    assert result["flippedIds"] == ["p1", "p2"]


def test_position_bias_order_blind_never_flips():
    pairs = [
        {"id": "p1", "a": "alpha", "b": "beta"},
        {"id": "p2", "a": "gamma", "b": "delta"},
    ]
    assert position_bias(pairs, _order_blind)["flipRate"] == 0.0


def test_length_bias_detects_longer_wins():
    correlation = length_bias(
        [{"score": 1, "length": 10}, {"score": 2, "length": 20}, {"score": 3, "length": 30}]
    )
    assert abs(correlation - 1.0) < 1e-9


def test_self_preference():
    result = self_preference([4, 5, 4], [3, 3, 2])
    assert result["selfWinRate"] == 1.0
    assert abs(result["delta"] - (13 / 3 - 8 / 3)) < 1e-9


def test_compare_runs_detects_regression():
    diff = compare_runs({"a": True, "b": True}, {"a": True, "b": False})
    assert diff["regressions"] == ["b"]
    assert diff["deltaPoints"] == pytest_approx(-50.0)
    assert diff["severity"] == "critical"


def pytest_approx(value, rel=1e-9, abs=1e-9):
    from pytest import approx

    return approx(value, rel=rel, abs=abs)
