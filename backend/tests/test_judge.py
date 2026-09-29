from veredicto.judge import LexicalJudge

SOURCE = "La tasa de interés de mora para créditos de consumo es del 12 por ciento efectivo anual."


def test_lexical_judge_rewards_a_faithful_answer():
    scores = LexicalJudge().score("La tasa de interés de mora es 12 por ciento anual.", SOURCE)
    assert scores["correccion"] == 3
    assert scores["confidence"] >= 0.8


def test_lexical_judge_flags_an_empty_answer():
    scores = LexicalJudge().score("No tengo esa información.", SOURCE)
    assert scores["correccion"] == 1
    assert scores["completitud"] == 1


def test_lexical_judge_is_consistent_with_ts_interface():
    scores = LexicalJudge().score("tasa de mora", SOURCE)
    assert set(scores) == {"correccion", "completitud", "confidence"}
    assert all(isinstance(v, (int, float)) for v in scores.values())
