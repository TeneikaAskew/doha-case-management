"""Build all portal demo JSON. Deterministic; run from anywhere.

Usage: python portal/data_gen/generate_demo_data.py [--out portal/public/data]
"""
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import corpus
import cv_feed
import schemas
from documents import PROVIDER_IDS
from hero_cases import build_hero_cases, TODAY
from roster import build_roster_cases

DEFAULT_OUT = Path(__file__).resolve().parents[1] / "public" / "data"

PROVIDERS = [
    ("fbi-cjis", "FBI CJIS / NCIC + Rap Back", "Criminal history", ["INVESTIGATION", "CV"],
     ["J", "D", "G", "H"], "HEALTHY", 84210556),
    ("equifax", "Equifax", "Credit bureau", ["INVESTIGATION", "CV"], ["F"], "HEALTHY", 22483901),
    ("experian", "Experian", "Credit bureau", ["INVESTIGATION"], ["F"], "HEALTHY", 21077344),
    ("transunion", "TransUnion", "Credit bureau (CV provider)", ["INVESTIGATION", "CV"],
     ["F"], "HEALTHY", 23910287),
    ("lexisnexis", "LexisNexis", "Public records", ["INVESTIGATION", "CV"],
     ["F", "J", "E"], "HEALTHY", 156733208),
    ("fincen", "FinCEN / Treasury", "Financial intelligence", ["CV"], ["F", "B"],
     "HEALTHY", 3402118),
    ("cbp-i94", "CBP I-94 Foreign Travel", "Border crossing records", ["INVESTIGATION", "CV"],
     ["B", "C", "E"], "HEALTHY", 48120022),
    ("courts", "State & local courts", "Dockets and dispositions", ["INVESTIGATION"],
     ["J", "D", "G", "H", "F"], "DEGRADED", 9822411),
    ("dmv", "DMV records", "Driver records", ["INVESTIGATION"], ["G", "J"], "HEALTHY", 61208443),
    ("irs", "IRS / tax records", "Tax compliance", ["INVESTIGATION"], ["F"], "HEALTHY", 1120733),
    ("sead5", "SEAD-5 Social media (PAEI)", "Publicly available electronic information",
     ["INVESTIGATION"], ["A", "D", "E", "J"], "HEALTHY", 448210),
    ("diss", "DISS / prior adjudications", "Eligibility and adjudication history",
     ["INVESTIGATION", "CV"], ["E"], "HEALTHY", 4211809),
]

# providerId -> (uptimePct, syncCadence, recordsGrowthQtr, matchErrorRate)
PROVIDER_HEALTH = {
    "fbi-cjis": (99.98, "Continuous (Rap Back push)", "+0.6% this quarter", 0.3),
    "equifax": (99.95, "Nightly 06:00Z", "+0.9% this quarter", 0.7),
    "experian": (99.93, "Nightly 06:00Z", "+0.8% this quarter", 0.9),
    "transunion": (99.97, "Nightly 06:00Z", "+1.1% this quarter", 0.8),
    "lexisnexis": (99.9, "Nightly 04:30Z", "+1.4% this quarter", 1.2),
    "fincen": (99.99, "Daily 12:00Z", "+2.3% this quarter", 0.2),
    "cbp-i94": (99.96, "Hourly", "+1.8% this quarter", 0.5),
    "courts": (97.1, "Weekly Mon 06:00Z", "+0.4% this quarter", 3.6),
    "dmv": (99.88, "Nightly 05:00Z", "+0.5% this quarter", 1.1),
    "irs": (99.94, "Weekly Fri 06:00Z", "+0.3% this quarter", 0.6),
    "sead5": (99.8, "On request", "+4.2% this quarter", 2.4),
    "diss": (99.99, "Continuous (event push)", "+1.0% this quarter", 0.4),
}

TIMELINESS = [("Initiation", 18, 25), ("Investigation", 73, 90),
              ("Adjudication", 32, 30), ("CV alert triage", 4, 7)]


def risk_band(score: int) -> str:
    return "high" if score >= 75 else "moderate" if score >= 40 else "low"


def main(out_dir: Path = DEFAULT_OUT) -> dict:
    out_dir = Path(out_dir)
    (out_dir / "cases").mkdir(parents=True, exist_ok=True)
    (out_dir / "documents").mkdir(parents=True, exist_ok=True)

    df = corpus.load_corpus()
    _precedent_cache = {}

    def precedents(code):
        if code not in _precedent_cache:
            _precedent_cache[code] = corpus.find_precedents(df, code)
        return _precedent_cache[code]

    cases = build_hero_cases(precedents) + build_roster_cases(precedents)
    cv_feed.extend_cases(cases)

    # Canonical provider ids + computed open-alert counts.
    for c in cases:
        for a in c["alerts"]:
            a.setdefault("providerId", PROVIDER_IDS[a["provider"]])
        c["subject"]["openAlerts"] = sum(
            1 for a in c["alerts"] if a["state"] not in ("ADJUDICATED", "CLOSED"))

    # One real DOHA record kept for reference; typed per-subject documents
    # are authored in hero_cases/roster and written below.
    df_full = corpus.load_full_corpus()
    doc = corpus.get_source_document(df_full)
    source_document = schemas.SourceDocument.model_validate(doc)

    source_documents = {}
    for c in cases:
        source_documents.update(c.pop("sourceDocuments", {}))

    # Every case's Documents tab leads with a real DOHA decision - a distinct
    # one per case, matched to the case's primary flagged guideline (clean
    # cases get a granted decision). Offline fallback shares doha-record.json.
    used_numbers = set()
    doha_documents = {}
    for c in cases:
        codes = c["subject"]["flaggedGuidelines"]
        code = codes[0] if codes else None
        pick = corpus.get_source_document(
            df_full, code=code, exclude=used_numbers,
            prefer_outcome="DENIED" if code else "GRANTED")
        sd = schemas.SourceDocument.model_validate(pick)
        if df_full is None:
            url = "documents/doha-record.json"
        else:
            used_numbers.add(sd.caseNumber)
            slug = re.sub(r"[^A-Za-z0-9]+", "-", sd.caseNumber).strip("-").lower()
            url = f"documents/doha/{slug}.json"
            # original decision PDF, when scripts/fetch_doha_pdfs.mjs has
            # downloaded it (committed under the output tree)
            pdf_rel = f"documents/doha/pdf/{slug}.pdf"
            if (out_dir / pdf_rel).exists():
                sd = sd.model_copy(update={"pdfUrl": pdf_rel})
            doha_documents[url] = sd
        c["documents"].insert(0, dict(
            title=f"DOHA decision {sd.caseNumber}",
            type="DOHA precedent",
            description=(f"Published DOHA {sd.caseType} decision "
                         f"({sd.outcome.title()}) - "
                         + (f"Guideline {code} precedent" if code
                            else "reference precedent")),
            url=url))

    validated_cases = [schemas.CaseDetail.model_validate(c) for c in cases]
    subjects = [schemas.SubjectSummary.model_validate(c["subject"]) for c in cases]
    all_alerts = [a for c in validated_cases for a in c.alerts]

    def dump(model, path: Path):
        path.write_text(json.dumps(model, indent=2, ensure_ascii=False) + "\n",
                        encoding="utf-8")

    dump(source_document.model_dump(), out_dir / "documents" / "doha-record.json")
    for url, sd in doha_documents.items():
        path = out_dir / url
        path.parent.mkdir(parents=True, exist_ok=True)
        dump(sd.model_dump(), path)
    for url, d in source_documents.items():
        gd = schemas.GeneratedDocument.model_validate(d)
        path = out_dir / url
        path.parent.mkdir(parents=True, exist_ok=True)
        dump(gd.model_dump(), path)
    dump(schemas.SubjectsFile(subjects=subjects).model_dump(), out_dir / "subjects.json")
    for c in validated_cases:
        dump(c.model_dump(), out_dir / "cases" / f"{c.subject.id}.json")
    dump(schemas.AlertsFile(alerts=all_alerts).model_dump(), out_dir / "alerts.json")

    # Per-provider activity index: alerts received, record checks and
    # documents delivered - powers the provider drill-down pages.
    by_subject_name = {c.subject.id: c.subject.name for c in validated_cases}
    activity = {pid: schemas.ProviderActivity() for pid, _, *_ in PROVIDERS}
    for c in validated_cases:
        for a in c.alerts:
            activity[a.providerId].alertIds.append(a.id)
        for rc in c.investigation.recordChecks:
            rc_pid = PROVIDER_IDS.get(rc.provider)
            if rc_pid:
                activity[rc_pid].recordChecks.append(schemas.ProviderCheckRef(
                    caseId=c.subject.id, subjectName=c.subject.name,
                    item=rc.item, category=rc.category, status=rc.status,
                    completedDate=rc.completedDate, documentUrl=rc.documentUrl))
    for url, d in source_documents.items():
        gd = schemas.GeneratedDocument.model_validate(d)
        doc_pid = PROVIDER_IDS.get(gd.provider)
        if doc_pid:
            activity[doc_pid].documents.append(schemas.ProviderDocRef(
                caseId=gd.subjectId,
                subjectName=by_subject_name[gd.subjectId],
                title=gd.title, url=url, receivedDate=gd.receivedDate))
    dump(schemas.ProviderActivityFile(providers=activity).model_dump(),
         out_dir / "provider-activity.json")

    precedent_case_numbers = {
        p.caseNumber for c in validated_cases for g in c.guidelines for p in g.precedents
    }
    precedent_case_numbers.add(source_document.caseNumber)
    precedent_case_numbers.update(used_numbers)
    case_links = corpus.build_case_links(df, sorted(precedent_case_numbers))
    case_links_file = schemas.CaseLinksFile(links=case_links)
    dump(case_links_file.model_dump(), out_dir / "case-links.json")

    providers = [schemas.ProviderInfo(
        id=pid, name=name, category=cat, usedIn=used, guidelines=gls,
        status=status, recordCount=count, lastSync=f"{TODAY}T06:00:00Z",
        uptimePct=PROVIDER_HEALTH[pid][0], syncCadence=PROVIDER_HEALTH[pid][1],
        recordsGrowthQtr=PROVIDER_HEALTH[pid][2],
        matchErrorRate=PROVIDER_HEALTH[pid][3])
        for pid, name, cat, used, gls, status, count in PROVIDERS]
    dump(schemas.ProvidersFile(providers=providers).model_dump(), out_dir / "providers.json")

    analytics = schemas.Analytics(
        corpus=schemas.CorpusStats.model_validate(corpus.corpus_analytics(df)),
        pipeline=schemas.PipelineStats(
            timeliness=[schemas.TimelinessStat(stage=s, avgDays=a, targetDays=t)
                        for s, a, t in TIMELINESS],
            alertVolume=[schemas.AlertVolume(category=k, count=v) for k, v in
                         sorted(Counter(a.category for a in all_alerts).items())],
            triageDistribution=[schemas.TriageBand(band=b, count=n) for b, n in
                                sorted(Counter(risk_band(s.riskScore)
                                               for s in subjects).items())],
        ))
    dump(analytics.model_dump(), out_dir / "analytics.json")

    return {"subjects": len(subjects), "cases": len(validated_cases),
            "alerts": len(all_alerts)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    counts = main(args.out)
    print(f"Wrote {counts} to {args.out}")
