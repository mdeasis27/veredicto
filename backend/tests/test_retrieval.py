from veredicto.retrieval import (
    average_precision,
    mean_reciprocal_rank,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)


def test_precision_at_k():
    assert precision_at_k(["a", "b", "c", "d"], {"a", "c"}, 2) == 0.5
    assert precision_at_k(["a", "b", "c", "d"], set(), 4) == 0.0


def test_recall_at_k():
    assert recall_at_k(["a", "b", "c", "d"], {"a", "c"}, 2) == 0.5
    assert recall_at_k(["a", "b", "c", "d"], {"a", "c"}, 4) == 1.0


def test_reciprocal_rank():
    assert reciprocal_rank(["a", "b", "c"], {"a"}) == 1.0
    assert reciprocal_rank(["a", "b", "c"], {"b"}) == 0.5
    assert reciprocal_rank(["a", "b", "c"], {"d"}) == 0.0
    assert reciprocal_rank(["a", "b", "c"], {"c"}, k=2) == 0.0


def test_mean_reciprocal_rank():
    mrr = mean_reciprocal_rank(
        [
            {"retrieved": ["a"], "relevant": {"a"}},
            {"retrieved": ["b", "a"], "relevant": {"a"}},
            {"retrieved": ["x"], "relevant": {"a"}},
        ]
    )
    assert mrr == pytest_approx((1 + 0.5 + 0) / 3)


def test_ndcg_at_k():
    import math

    assert ndcg_at_k(["a", "b", "c"], {"a"}, 3) == pytest_approx(1.0)
    assert ndcg_at_k(["b", "a"], {"a"}, 2) == pytest_approx(1 / math.log2(3))
    assert ndcg_at_k(["a", "b"], set(), 2) == 0.0


def test_average_precision():
    assert average_precision(["b", "a", "c"], {"a"}) == pytest_approx(0.5)


def pytest_approx(value, rel=1e-9, abs=1e-9):
    from pytest import approx

    return approx(value, rel=rel, abs=abs)
