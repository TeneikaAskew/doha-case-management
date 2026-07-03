import pandas as pd
import pytest

import corpus
import schemas


@pytest.fixture
def tiny_df():
    return pd.DataFrame([
        dict(case_number="20-01001", date="March 5, 2021", outcome="DENIED",
             guidelines=["F", "B"], case_type="hearing"),
        dict(case_number="19-02002", date="July 12, 2019", outcome="GRANTED",
             guidelines=["F"], case_type="hearing"),
        dict(case_number="21-03003", date="unknown", outcome="DENIED",
             guidelines=["J"], case_type="appeal"),
        dict(case_number="18-04004", date="May 1, 2018", outcome="REMANDED",
             guidelines=["F"], case_type="appeal"),
    ])


def test_extract_year():
    assert corpus.extract_year("March 5, 2021") == 2021
    assert corpus.extract_year("garbage") is None


def test_find_precedents_filters_and_validates(tiny_df):
    hits = corpus.find_precedents(tiny_df, "F", limit=3)
    assert 1 <= len(hits) <= 3
    assert all(h["outcome"] in ("GRANTED", "DENIED") for h in hits)
    for h in hits:
        schemas.Precedent.model_validate(h)


def test_find_precedents_fallback_without_corpus():
    hits = corpus.find_precedents(None, "F")
    assert hits and all("sample" in h["relevance"].lower() for h in hits)
    for h in hits:
        schemas.Precedent.model_validate(h)


def test_corpus_analytics_shape(tiny_df):
    stats = corpus.corpus_analytics(tiny_df)
    validated = schemas.CorpusStats.model_validate(stats)
    assert validated.totalCases == 4
    assert validated.byCaseType == {"hearing": 2, "appeal": 2}
    f_stat = next(g for g in validated.byGuideline if g.code == "F")
    assert f_stat.cases == 3


def test_corpus_analytics_fallback():
    stats = corpus.corpus_analytics(None)
    schemas.CorpusStats.model_validate(stats)
