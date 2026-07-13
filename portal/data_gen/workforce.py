"""Deterministic vetting workforce roster and case-to-staff assignment.

Builds staff.json (investigators, analysts, adjudicators, and managers - federal
or contractor) and assigns the demo cases to eligible staff by stage and tier,
stamping each subject with an `assignee`. No randomness; all metrics derive from
fixed per-person fixtures and the fixed reference date TODAY.
"""
from datetime import date, timedelta

from hero_cases import TODAY

# Which worker role owns a case at each lifecycle stage.
STAGE_ROLE = {
    "INITIATION": "INVESTIGATOR",
    "INVESTIGATION": "INVESTIGATOR",
    "ADJUDICATION": "ADJUDICATOR",
    "CONTINUOUS_VETTING": "ANALYST",
}

# Roster fixture. Each row is fully deterministic. `baseLoad` is the person's
# standing (non-demo) caseload; demo-case assignments add to it. `out` marks a
# person on leave (excluded from assignment, status OUT). Managers carry no
# caseload (capacity 0) - they assign work rather than take it.
# (id, name, role, employmentType, team, location, tierCoverage, specialties,
#  capacity, baseLoad, medianTurnaroundDays, onTimePct, out)
STAFF_FIXTURE = [
    # Investigators
    ("STAFF-001", "K. Rivas", "INVESTIGATOR", "FEDERAL",
     "DCSA Field Operations", "Northern Virginia", ["T1", "T2", "T3"], ["E"],
     6, 3, 71.0, 88.0, False),
    ("STAFF-002", "M. Delgado", "INVESTIGATOR", "FEDERAL",
     "DCSA Field Operations", "Mid-Atlantic", ["T3", "T5"], ["F", "E"],
     5, 2, 78.0, 91.0, False),
    ("STAFF-003", "S. Whitfield", "INVESTIGATOR", "FEDERAL",
     "DCSA Field Operations", "Washington DC", ["T5"], ["B", "F"],
     4, 2, 84.0, 82.0, False),
    ("STAFF-004", "J. Ramos", "INVESTIGATOR", "CONTRACTOR",
     "Sentinel Investigative Services", "National Capital Region",
     ["T2", "T3", "T5"], ["J", "H"], 6, 4, 66.0, 94.0, False),
    ("STAFF-005", "D. Foley", "INVESTIGATOR", "FEDERAL",
     "DCSA Field Operations", "Tidewater", ["T1", "T2", "T3"], ["G", "J"],
     6, 3, 69.0, 90.0, False),
    ("STAFF-006", "A. Okonkwo", "INVESTIGATOR", "CONTRACTOR",
     "Vanguard Background Services", "Southeast", ["T3", "T5"], ["M", "E"],
     5, 2, 74.0, 86.0, True),
    # Analysts (continuous vetting)
    ("STAFF-007", "R. Chen", "ANALYST", "FEDERAL",
     "CV Analysis Cell - East", "National Capital Region", ["T3", "T5"],
     ["F", "B"], 8, 4, 4.0, 96.0, False),
    ("STAFF-008", "P. Nguyen", "ANALYST", "CONTRACTOR",
     "Sentinel Investigative Services", "Western Region", ["T3", "T5"],
     ["J", "G"], 8, 5, 5.0, 89.0, False),
    ("STAFF-009", "T. Bauer", "ANALYST", "FEDERAL",
     "CV Analysis Cell - West", "Western Region", ["T3", "T5"], ["K", "E"],
     8, 3, 6.0, 92.0, False),
    # Adjudicators
    ("STAFF-010", "L. Ortiz", "ADJUDICATOR", "FEDERAL",
     "DoD CAF Adjudications", "National Capital Region",
     ["T1", "T2", "T3", "T5"], ["F", "B"], 10, 6, 27.0, 90.0, False),
    ("STAFF-011", "C. Yamamoto", "ADJUDICATOR", "FEDERAL",
     "DoD CAF Adjudications", "National Capital Region", ["T3", "T5"],
     ["H", "G"], 10, 7, 31.0, 84.0, False),
    ("STAFF-012", "M. Abara", "ADJUDICATOR", "FEDERAL",
     "DoD CAF Adjudications", "National Capital Region", ["T1", "T5"],
     ["J", "E"], 9, 5, 24.0, 93.0, False),
    # Managers (assign work; carry no caseload)
    ("STAFF-013", "D. Okoye", "MANAGER", "FEDERAL",
     "DCSA Field Operations", "National Capital Region",
     ["T1", "T2", "T3", "T5"], [], 0, 0, 0.0, 100.0, False),
    ("STAFF-014", "R. Feldman", "MANAGER", "FEDERAL",
     "DoD CAF Adjudications", "National Capital Region",
     ["T1", "T2", "T3", "T5"], [], 0, 0, 0.0, 100.0, False),
]


def _status_from_util(util: float) -> str:
    if util >= 100:
        return "AT_CAPACITY"
    if util >= 75:
        return "LIMITED"
    return "AVAILABLE"


def _next_available(status: str) -> str:
    days = {"AVAILABLE": 0, "LIMITED": 5, "AT_CAPACITY": 14, "OUT": 21}[status]
    return (date.fromisoformat(TODAY) + timedelta(days=days)).isoformat()


def build_staff(cases: list[dict]) -> list[dict]:
    """Build the staff roster and assign each case to an eligible worker,
    stamping subject['assignee']. Returns staff dicts ready for StaffFile."""
    staff = []
    for (sid, name, role, emp, team, loc, tiers, specs, cap, base,
         turnaround, ontime, out) in STAFF_FIXTURE:
        staff.append(dict(
            id=sid, name=name, role=role, employmentType=emp, team=team,
            location=loc, tierCoverage=list(tiers), specialties=list(specs),
            capacity=cap, medianTurnaroundDays=turnaround, onTimePct=ontime,
            assignedCaseIds=[], _baseLoad=base, _out=out))

    assigned = {s["id"]: 0 for s in staff}
    # Deterministic order: by subject id, so assignment never depends on input order.
    for case in sorted(cases, key=lambda c: c["subject"]["id"]):
        subj = case["subject"]
        # Newly-initiated cases stay unassigned - they populate the manager's
        # assignment queue in the portal.
        if subj["stage"] == "INITIATION":
            subj["assignee"] = None
            continue
        role = STAGE_ROLE[subj["stage"]]
        tier = subj["tier"]
        codes = set(subj["flaggedGuidelines"])
        eligible = [s for s in staff if s["role"] == role
                    and tier in s["tierCoverage"] and not s["_out"]]
        # Prefer specialty overlap, then lightest current load, then stable id.
        eligible.sort(key=lambda s: (-len(codes & set(s["specialties"])),
                                     assigned[s["id"]], s["id"]))
        pick = eligible[0]
        pick["assignedCaseIds"].append(subj["id"])
        assigned[pick["id"]] += 1
        subj["assignee"] = dict(staffId=pick["id"], name=pick["name"],
                                role=pick["role"])

    result = []
    for s in staff:
        open_cases = s.pop("_baseLoad") + len(s["assignedCaseIds"])
        out = s.pop("_out")
        util = min(100.0, round(100 * open_cases / s["capacity"], 1)) \
            if s["capacity"] else 0.0
        status = "OUT" if out else _status_from_util(util)
        s["openCases"] = open_cases
        s["utilizationPct"] = util
        s["status"] = status
        s["nextAvailable"] = _next_available(status)
        result.append(s)
    return result
