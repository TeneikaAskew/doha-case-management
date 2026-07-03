"""Read the real DOHA corpus (parquet) for precedents and analytics, with fallbacks."""
import re
from collections import Counter
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
PARQUET_PATHS = [
    REPO_ROOT / "doha_parsed_cases" / "all_cases_1.parquet",
    REPO_ROOT / "doha_parsed_cases" / "all_cases_2.parquet",
]
COLUMNS = ["case_number", "date", "outcome", "guidelines", "case_type"]
FULL_COLUMNS = ["case_number", "date", "outcome", "case_type", "guidelines",
                "full_text", "judge", "source_url"]

GUIDELINE_NAMES = {
    "A": "Allegiance to the United States", "B": "Foreign Influence",
    "C": "Foreign Preference", "D": "Sexual Behavior", "E": "Personal Conduct",
    "F": "Financial Considerations", "G": "Alcohol Consumption",
    "H": "Drug Involvement and Substance Misuse", "I": "Psychological Conditions",
    "J": "Criminal Conduct", "K": "Handling Protected Information",
    "L": "Outside Activities", "M": "Use of Information Technology",
}

FALLBACK_PRECEDENTS = {
    code: [
        dict(caseNumber=f"ISCR 20-0{i}000", outcome=outcome, year=2020 + i,
             relevance=f"Sample DOHA decision involving Guideline {code} (offline placeholder)")
        for i, outcome in ((1, "DENIED"), (2, "GRANTED"))
    ]
    for code in GUIDELINE_NAMES
}

FALLBACK_SOURCE_DOCUMENT = dict(
    caseNumber="ISCR 20-01000",
    title="Sample DOHA decision (offline placeholder)",
    caseType="hearing",
    date="January 1, 2021",
    outcome="DENIED",
    judge=None,
    sourceUrl=None,
    fullText=(
        "DEPARTMENT OF DEFENSE\n"
        "DEFENSE OFFICE OF HEARINGS AND APPEALS\n\n"
        "This is an offline placeholder decision used when the underlying DOHA case "
        "corpus (doha_parsed_cases/all_cases_*.parquet) is not present in this "
        "environment. It stands in for a real hearing decision so the document "
        "viewer has representative content to render during a demo.\n\n"
        "In a real case, this section would summarize the Statement of Reasons, "
        "the government's evidence under the relevant Adjudicative Guidelines, "
        "and the applicant's response, including any mitigating evidence offered "
        "at hearing regarding the security concerns raised.\n\n"
        "Based on the placeholder record above, and applying the whole-person "
        "concept, it is not clearly consistent with the interests of national "
        "security to grant Applicant eligibility for access to classified "
        "information in this offline sample. Eligibility for access to classified "
        "information is denied."
    ),
)

FALLBACK_CORPUS_STATS = dict(
    totalCases=36700,
    byOutcome={"DENIED": 19800, "GRANTED": 13200, "OTHER": 3700},
    byYear=[dict(year=y, granted=1200 + (y % 5) * 90, denied=1800 + (y % 4) * 110)
            for y in range(2016, 2026)],
    byGuideline=[dict(code=c, name=GUIDELINE_NAMES[c], cases=800, deniedPct=60.0)
                 for c in GUIDELINE_NAMES],
    byCaseType={"hearing": 28650, "appeal": 8050},
)


def load_corpus() -> pd.DataFrame | None:
    frames = [pd.read_parquet(p, columns=COLUMNS) for p in PARQUET_PATHS if p.exists()]
    if not frames:
        return None
    return pd.concat(frames, ignore_index=True)


def load_full_corpus() -> pd.DataFrame | None:
    """Like load_corpus, but includes full_text/judge/source_url for the document viewer."""
    frames = [pd.read_parquet(p, columns=FULL_COLUMNS) for p in PARQUET_PATHS if p.exists()]
    if not frames:
        return None
    return pd.concat(frames, ignore_index=True)


def extract_year(date_str) -> int | None:
    m = re.search(r"(19|20)\d{2}", str(date_str))
    return int(m.group(0)) if m else None


def _has_guideline(guidelines, code: str) -> bool:
    # Parquet nulls arrive as None or NaN (float); values are lists/ndarrays of strings.
    if guidelines is None or isinstance(guidelines, float):
        return False
    return code in list(guidelines)


def find_precedents(df: pd.DataFrame | None, code: str, limit: int = 3) -> list[dict]:
    if df is None:
        return FALLBACK_PRECEDENTS[code][:limit]
    hits = df[df["guidelines"].apply(_has_guideline, code=code)
              & df["outcome"].isin(["DENIED", "GRANTED"])]
    if hits.empty:
        return FALLBACK_PRECEDENTS[code][:limit]
    # Deterministic mix: newest DENIED first, then newest GRANTED.
    hits = hits.assign(_year=hits["date"].map(extract_year)).sort_values(
        ["_year", "case_number"], ascending=[False, True], na_position="last")
    picks = pd.concat([hits[hits["outcome"] == "DENIED"].head(2),
                       hits[hits["outcome"] == "GRANTED"].head(1)]).head(limit)
    return [
        dict(caseNumber=str(r.case_number), outcome=str(r.outcome),
             year=extract_year(r.date),
             relevance=f"DOHA {r.case_type} decision involving Guideline {code} "
                       f"({GUIDELINE_NAMES[code]})")
        for r in picks.itertuples()
    ]


def get_source_document(df: pd.DataFrame | None) -> dict:
    """Pick one real DOHA record (with full_text) to back the demo's document viewer.

    Deterministic: Guideline F, DENIED/GRANTED outcome, full_text long enough to be
    representative; newest year first, then case_number, matching find_precedents'
    ordering. Falls back to a small synthetic placeholder when the corpus (or a
    full_text column) is unavailable.
    """
    if df is None or "full_text" not in df.columns:
        return dict(FALLBACK_SOURCE_DOCUMENT)
    full_text = df["full_text"].fillna("").astype(str)
    hits = df[df["guidelines"].apply(_has_guideline, code="F")
              & df["outcome"].isin(["DENIED", "GRANTED"])
              & (full_text.str.len() > 2000)]
    if hits.empty:
        return dict(FALLBACK_SOURCE_DOCUMENT)
    hits = hits.assign(_year=hits["date"].map(extract_year)).sort_values(
        ["_year", "case_number"], ascending=[False, True], na_position="last")
    row = hits.iloc[0]
    judge = getattr(row, "judge", None)
    source_url = getattr(row, "source_url", None)
    return dict(
        caseNumber=str(row.case_number),
        title=f"DOHA {row.case_type} decision {row.case_number}",
        caseType=str(row.case_type),
        date=str(row.date),
        outcome=str(row.outcome),
        judge=str(judge) if judge is not None and not pd.isna(judge) and str(judge).strip() else None,
        sourceUrl=str(source_url) if source_url is not None and not pd.isna(source_url)
                  and str(source_url).strip() else None,
        fullText=str(row.full_text)[:60_000],
    )


def corpus_analytics(df: pd.DataFrame | None) -> dict:
    if df is None:
        return FALLBACK_CORPUS_STATS
    outcomes = Counter(df["outcome"].fillna("UNKNOWN"))
    years = df["date"].map(extract_year)
    by_year = []
    # Some corpus rows carry regulatory-citation dates rather than decision
    # dates (e.g. "February 20, 1960" from E.O. 10865, "January 2, 1992" from
    # DoD Directive 5220.6), which show up as large false spikes in those
    # years. DOHA's modern electronic decision era starts around 1996, so
    # restrict the year-over-year chart to that range; totalCases and the
    # other aggregates below are unaffected.
    for y in sorted({int(v) for v in years.dropna().unique() if v >= 1996}):
        mask = years == y
        by_year.append(dict(year=int(y),
                            granted=int((df.loc[mask, "outcome"] == "GRANTED").sum()),
                            denied=int((df.loc[mask, "outcome"] == "DENIED").sum())))
    by_guideline = []
    for code, name in GUIDELINE_NAMES.items():
        mask = df["guidelines"].apply(_has_guideline, code=code)
        n = int(mask.sum())
        denied = int((df.loc[mask, "outcome"] == "DENIED").sum())
        decided = int(df.loc[mask, "outcome"].isin(["DENIED", "GRANTED"]).sum())
        by_guideline.append(dict(code=code, name=name, cases=n,
                                 deniedPct=round(100.0 * denied / decided, 1) if decided else 0.0))
    return dict(
        totalCases=int(len(df)),
        byOutcome={str(k): int(v) for k, v in outcomes.items()},
        byYear=by_year,
        byGuideline=by_guideline,
        byCaseType={str(k): int(v) for k, v in Counter(df["case_type"].fillna("unknown")).items()},
    )
