import pandas as pd
import pytest

import corpus
import schemas


@pytest.fixture
def tiny_df():
    return pd.DataFrame([
        dict(case_number="20-01001", date="March 5, 2021", outcome="DENIED",
             guidelines=["F", "B"], case_type="hearing",
             source_url="https://doha.example/hearing/FileId/1001/"),
        dict(case_number="19-02002", date="July 12, 2019", outcome="GRANTED",
             guidelines=["F"], case_type="hearing",
             source_url="https://doha.example/hearing/FileId/2002/"),
        dict(case_number="21-03003", date="unknown", outcome="DENIED",
             guidelines=["J"], case_type="appeal",
             source_url="https://doha.example/appeal/FileId/3003/"),
        dict(case_number="18-04004", date="May 1, 2018", outcome="REMANDED",
             guidelines=["F"], case_type="appeal",
             source_url="https://doha.example/appeal/FileId/4004/"),
        dict(case_number="05-05005", date="June 3, 2005", outcome="DENIED",
             guidelines=["G"], case_type="hearing",
             source_url="https://doha.example/hearing/FileId/5005/"),
        dict(case_number="60-00001", date="February 20, 1960", outcome="DENIED",
             guidelines=["J"], case_type="hearing",
             source_url="https://doha.example/hearing/FileId/6001/"),
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
    assert all(h.get("sourceUrl") for h in hits)


def test_find_precedents_fallback_without_corpus():
    hits = corpus.find_precedents(None, "F")
    assert hits and all("sample" in h["relevance"].lower() for h in hits)
    for h in hits:
        schemas.Precedent.model_validate(h)
    assert all(h.get("sourceUrl") is None for h in hits)


def test_listing_url_strips_fileid_suffix():
    assert corpus.listing_url(
        "https://doha.ogc.osd.mil/foo/bar/FileId/245264/"
    ) == "https://doha.ogc.osd.mil/foo/bar"
    assert corpus.listing_url(
        "https://doha.ogc.osd.mil/foo/bar/fileid/245264/"
    ) == "https://doha.ogc.osd.mil/foo/bar"


def test_listing_url_none_for_missing_or_no_marker():
    assert corpus.listing_url(None) is None
    assert corpus.listing_url("") is None
    assert corpus.listing_url("https://doha.ogc.osd.mil/no-marker-here/") is None


def test_build_case_links_none_df():
    assert corpus.build_case_links(None, ["20-01001"]) == []


def test_build_case_links_shapes_and_dedupes(tiny_df):
    links = corpus.build_case_links(tiny_df, ["20-01001", "20-01001", "18-04004"])
    for link in links:
        schemas.CaseLink.model_validate(link)
    case_numbers = {link["caseNumber"] for link in links}
    assert case_numbers == {"20-01001", "18-04004"}
    hearing = next(l for l in links if l["caseNumber"] == "20-01001")
    assert hearing["listingUrl"] == "https://doha.example/hearing"
    assert hearing["pdfUrl"] == "https://doha.example/hearing/FileId/1001/"
    assert hearing["year"] == 2021
    assert hearing["outcome"] == "DENIED"
    assert hearing["caseType"] == "hearing"


def test_corpus_analytics_shape(tiny_df):
    stats = corpus.corpus_analytics(tiny_df)
    validated = schemas.CorpusStats.model_validate(stats)
    assert validated.totalCases == 6
    assert validated.byCaseType == {"hearing": 4, "appeal": 2}
    f_stat = next(g for g in validated.byGuideline if g.code == "F")
    assert f_stat.cases == 3
    years = [y.year for y in validated.byYear]
    assert 2005 in years
    assert all(y.year >= 1996 for y in validated.byYear)


def test_corpus_analytics_fallback():
    stats = corpus.corpus_analytics(None)
    schemas.CorpusStats.model_validate(stats)


def test_get_source_document_fallback_without_corpus():
    doc = corpus.get_source_document(None)
    validated = schemas.SourceDocument.model_validate(doc)
    assert validated.fullText
    assert len(validated.fullText) > 200


def test_get_source_document_picks_real_record():
    df = pd.DataFrame([
        dict(case_number="20-01001", date="March 5, 2021", outcome="DENIED",
             guidelines=["F", "B"], case_type="hearing",
             full_text="x" * 2500, judge="Smith", source_url=None),
        dict(case_number="19-02002", date="July 12, 2019", outcome="GRANTED",
             guidelines=["F"], case_type="hearing",
             full_text="y" * 100, judge=None, source_url=None),
    ])
    doc = corpus.get_source_document(df)
    validated = schemas.SourceDocument.model_validate(doc)
    assert validated.caseNumber == "20-01001"
    assert validated.judge == "Smith"
    assert len(validated.fullText) == 2500
