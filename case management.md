# Case Management Feature - Whole Person View

**Created:** 2026 (Prototype Phase)  
**Status:** Development (Mock Data)  
**Purpose:** Consolidated risk assessment and adjudication support for personnel security investigations

---

## Table of Contents

1. [Overview](#overview)
2. [Feature Capabilities](#feature-capabilities)
3. [Architecture](#architecture)
4. [Components](#components)
5. [Data Model](#data-model)
6. [Risk Scoring Algorithm](#risk-scoring-algorithm)
7. [SEAD Guidelines Integration](#sead-guidelines-integration)
8. [API Integration](#api-integration)
9. [Usage & Navigation](#usage--navigation)
10. [Design Decisions](#design-decisions)
11. [Dependencies](#dependencies)
12. [Future Enhancements](#future-enhancements)

---

## Overview

### What is Whole Person View?

The Whole Person View (WPV) is a comprehensive risk assessment dashboard that aggregates security alerts from multiple sources (FinCEN SARs, FBI criminal records, NSC education verification, medical records, foreign travel) into a single unified interface for adjudicators.

**Primary Users:**
- Security adjudicators
- Personnel security specialists
- Clearance review teams

**Key Value Proposition:**
- **360° risk visibility** - All alerts for a subject in one view
- **SEAD guideline mapping** - Automatic mapping of alerts to 13 adjudicative guidelines
- **Automated risk scoring** - ML-driven risk score (0-100) with trend analysis
- **Timeline reconstruction** - Chronological event history across all data sources
- **Actionable recommendations** - Auto-clear, conditional clear, or full review recommendations

### When to Use This Feature

- **Initial clearance adjudication** - First-time clearance decisions
- **Periodic reinvestigation** - 5-year or 10-year reviews
- **Continuous vetting alerts** - Responding to new alerts during active clearance
- **Incident response** - Reviewing subjects after security incidents

---

## Feature Capabilities

### 1. Subject Identity & Overview

**What it shows:**
- Subject demographics (name, SSN, DOB, age, organization)
- Clearance level and status (TOP SECRET, SECRET, CONFIDENTIAL)
- Investigation type and dates (SSBI, T5, Periodic Reinvestigation)
- Contact information (email, phone, address)
- Photo placeholder (with risk category border color)

**Why this matters:**
- Quick identification of subject
- Context for review (when was last investigation? When is next review due?)
- Organization/position helps assess access level

### 2. Risk Assessment Card

**Visual elements:**
- **Gauge chart** - Semicircle gauge showing risk score (0-100)
- **Risk category badge** - LOW / MODERATE / HIGH / CRITICAL
- **Trend indicator** - INCREASING ↗ / STABLE → / DECREASING ↘
- **SEAD flag badges** - Letters (A-M) for flagged guidelines
- **Alert counts** - Total alerts and high-priority count

**Why this design:**
- **Gauge visualization** - Intuitive at-a-glance risk understanding
- **Color-coded** - Green (LOW), Amber (MODERATE), Red (HIGH), Purple (CRITICAL)
- **Trend arrow** - Shows if risk is worsening or improving over time
- **SEAD badges** - Quick identification of which guidelines are triggered

**Risk categories:**
- **LOW (0-29):** Minimal risk, may qualify for auto-clear
- **MODERATE (30-59):** Some concerns, conditional clear possible
- **HIGH (60-79):** Significant concerns, full review required
- **CRITICAL (80-100):** Severe concerns, likely denial or suspension

### 3. SEAD 13 Adjudicative Guidelines Mapper

**What it is:**
SEAD 4 (Security Executive Agent Directive 4) establishes 13 adjudicative guidelines (A-M) used to evaluate security clearance eligibility.

**The 13 Guidelines:**

| Letter | Title | What it covers |
|--------|-------|----------------|
| **A** | Allegiance to the United States | Loyalty, foreign allegiance, treason |
| **B** | Foreign Influence | Foreign contacts, business, property |
| **C** | Foreign Preference | Dual citizenship, foreign passport |
| **D** | Sexual Behavior | Sexual misconduct, exploitation |
| **E** | Personal Conduct | Dishonesty, false statements, rule violations |
| **F** | Financial Considerations | Debt, bankruptcy, gambling, fraud, SARs |
| **G** | Alcohol Consumption | DUI/DWI, intoxication, treatment |
| **H** | Drug Involvement | Controlled substances, failed drug tests |
| **I** | Psychological Conditions | Mental health, treatment, behavior issues |
| **J** | Criminal Conduct | Arrests, convictions, FBI rap back |
| **K** | Handling Protected Information | Security violations, spillage, mishandling |
| **L** | Outside Activities | Conflicts of interest, foreign employment |
| **M** | Use of Information Technology | Hacking, unauthorized access, IT violations |

**Interactive grid:**
- **13 cards** - One per guideline (A-M)
- **Color-coded status** - Green ✓ (Clear) or Orange ⚠ (Flagged)
- **Click to expand** - Shows related alerts, risk level, summary
- **Alert count badges** - Number of alerts per guideline
- **Risk level indicators** - LOW / MODERATE / HIGH / CRITICAL per guideline

**Why this design:**
- **Standardized framework** - Maps to official federal adjudication standards
- **At-a-glance compliance** - See which guidelines pass/fail instantly
- **Drill-down capability** - Click any guideline to see details
- **Traceability** - Every flagged guideline links to specific alerts

**Example mapping:**
- FinCEN SAR (structured transactions) → SEAD-F (Financial)
- FBI arrest record (DUI) → SEAD-J (Criminal) + SEAD-G (Alcohol)
- Foreign travel to adversary nation → SEAD-B (Foreign Influence)

### 4. KPI Alert Summary Cards

**Six alert categories:**

| Category | Icon | Color | What it includes |
|----------|------|-------|------------------|
| **Foreign Travel** | 🌐 Globe | Blue (#1565C0) | Travel to adversary nations, high-risk regions |
| **Criminal** | ⚠ Alert | Orange (#E65100) | FBI rap back, arrests, convictions |
| **Financial** | 💰 Dollar | Gold (#D4AF37) | FinCEN SARs, debt, foreclosure, bankruptcy |
| **Medical** | ⚡ Activity | Purple (#7B1FA2) | Psychological treatment, hospitalizations |
| **Education** | 📖 Book | Green (#2E7D32) | NSC verification failures, degree fraud |
| **Substance** | 💧 Droplet | Red (#D32F2F) | Drug use, failed drug tests, treatment |

**Each card shows:**
- Total alert count
- High-priority alert count (red badge)
- Last alert date
- Associated SEAD guidelines

**Interaction:**
- Click card → Scrolls to alert details section
- Color-coded by category for quick recognition

### 5. Alert Details by Category (Tabbed View)

**Tab navigation:**
- 6 tabs (one per alert category)
- Badge shows alert count per category
- Red mini-badge shows high-priority count
- Disabled tabs (gray) if no alerts

**Data table columns:**
- **Alert ID** - Unique identifier
- **Date** - When alert was detected
- **Priority** - LOW / MODERATE / HIGH / CRITICAL
- **Status** - PENDING_REVIEW / REVIEWED / CLEARED / FLAGGED
- **Summary** - Brief description
- **Source** - Origin system (FinCEN, FBI, NSC, etc.)
- **Actions** - Expand button (chevron down/up)

**Expandable details:**
- Click chevron → Row expands below
- Shows all alert metadata fields
- Disposition section (if reviewed)
- Reviewer notes
- Related documents

**Why tabs:**
- Reduces cognitive load (focus one category at time)
- Allows deep-dive into specific concern areas
- Keeps table manageable (not overwhelming with 50+ rows)

### 6. Timeline View

**Chronological event history:**
- All security-relevant events in one timeline
- Sorted by date (most recent first)
- Includes: clearance grants, investigations, alerts, adjudications, incidents

**Event types:**
| Category | Color | Examples |
|----------|-------|----------|
| **CLEARANCE** | Blue | Initial clearance, reinvestigation, upgrade |
| **CRIMINAL** | Orange | Arrests, convictions, probation |
| **FINANCIAL** | Gold | FinCEN SAR, foreclosure, bankruptcy filing |
| **FOREIGN_TRAVEL** | Blue | Travel to China, Russia, Iran |
| **FOREIGN_CONTACT** | Purple | Contact with foreign nationals |
| **SECURITY** | Red | Security violations, spillage |
| **ADJUDICATION** | Blue | Clearance decisions, suspensions |
| **INVESTIGATION** | Purple | SSBI, T5, periodic reviews |

**Filtering:**
- **Category filters** - Show/hide specific event types
- **Severity filters** - INFO / MODERATE / HIGH / CRITICAL
- **Date range** - Custom start/end dates (future enhancement)

**Visual design:**
- Vertical timeline with colored left border
- Date on left, event details on right
- Badge for category, severity, source
- Expandable for full details

**Why timeline:**
- Reconstructs subject's history chronologically
- Identifies patterns (e.g., 3 DUIs in 18 months)
- Shows sequence of events (e.g., financial stress → criminal behavior)
- Critical for adjudication narrative

### 7. Disposition History

**Adjudication action log:**
- All past adjudication decisions
- Sorted by date (most recent first)

**Columns:**
- **Date** - Timestamp of action
- **Adjudicator** - Who made the decision
- **Action** - CLEARED / FLAGGED / PENDING / NEEDS_INFO / SUSPENDED
- **Alert ID** - Which alert was acted on (if specific)
- **Notes** - Adjudicator's rationale

**Action types & colors:**
| Action | Icon | Color | Meaning |
|--------|------|-------|---------|
| **CLEARED** | ✓ Check | Green | Alert resolved favorably |
| **FLAGGED** | ✗ X | Red | Alert confirmed as concern |
| **PENDING** | ⏱ Clock | Amber | Under review |
| **NEEDS_INFO** | ⚠ Alert | Blue | Awaiting additional information |
| **SUSPENDED** | ✗ X | Purple | Clearance suspended |

**Why this:**
- Audit trail - Who decided what and when
- Consistency checking - Are decisions aligned?
- Training tool - Learn from past adjudications
- Appeals support - Document decision rationale

---

## Architecture

### File Structure

```
case-management/
├── CaseManagementApp.jsx          # Root app component
├── CaseManagementApp.css          # App-level styles
├── index.js                       # Export entry point
│
├── pages/
│   └── WholePersonViewPage.jsx    # Main dashboard page
│
├── components/
│   ├── AppHeader.jsx              # Feature-specific header
│   ├── AppSidebar.jsx             # Feature-specific sidebar
│   ├── SubjectIdentityCard.jsx    # Subject demographics
│   ├── RiskScoreCard.jsx          # Risk gauge + metrics
│   ├── RiskScoreCard.css
│   ├── SEADGuidelineMapper.jsx    # 13 guideline grid
│   ├── KPICards.jsx               # Alert summary cards
│   ├── AlertSummaryCards.jsx      # 6 category cards
│   ├── AlertSummaryCards.css
│   ├── AlertCategoryTabs.jsx      # Tabbed alert tables
│   ├── TimelineView.jsx           # Event timeline
│   ├── DispositionTracker.jsx     # Adjudication history
│   ├── OverviewPanel.jsx          # Consolidated overview (legacy)
│   └── OverviewPanel.css
│
├── data/
│   ├── mockWholePersonData.js     # Mock subject data (3 profiles)
│   ├── riskScoringModel.js        # Risk calculation algorithms
│   └── seadGuidelineMapping.js    # SEAD-13 definitions
│
└── api/
    └── caseManagementApi.js       # API layer (currently mock)
```

### Component Hierarchy

```
CaseManagementApp
├── AppHeader
├── AppSidebar
└── WholePersonViewPage
    ├── SubjectIdentityCard
    ├── KPICards
    │   └── AlertSummaryCards (6 cards)
    ├── RiskScoreCard
    ├── SEADGuidelineMapper (13 guidelines)
    ├── TimelineView
    ├── AlertCategoryTabs (6 tabs)
    └── DispositionTracker
```

### Data Flow

```
User navigates to /case-management/whole-person
  ↓
WholePersonViewPage loads
  ↓
Calls fetchDefaultSubject() (or fetchSubject(id) if :subjectId param)
  ↓
caseManagementApi.js → mockWholePersonData.js (300ms delay)
  ↓
Returns complete subject data object:
  {
    subject: {...},          // Demographics
    overview: {...},         // Risk score, trend, recommendations
    alertSummary: {...},     // Category counts
    seadMapping: {...},      // Guideline flags
    alerts: {...},           // Full alert details
    timeline: [...],         // Event history
    dispositionHistory: [...] // Adjudication log
  }
  ↓
State set → Components render with data
  ↓
User interactions (expand alerts, filter timeline, click guidelines)
  ↓
Local state updates (no API calls for interactions)
```

---

## Components

### SubjectIdentityCard

**Purpose:** Display subject demographics and clearance information

**Props:**
```javascript
{
  subject: {
    firstName, lastName, middleName, suffix,
    ssn, ssnLast4, dob, age,
    clearanceLevel, clearanceStatus,
    investigationType, investigationDate,
    adjudicationDate, nextReviewDate,
    organization, subOrg, position,
    email, phone, address, caseReference
  },
  overview: {
    aiSummary,
    recommendedAction,
    riskCategory
  }
}
```

**Visual elements:**
- Photo placeholder (border color = risk category)
- Large subject name (Last, First Middle)
- Metadata line (SSN, DOB, Age, Case #)
- Clearance badge (color by level: Purple=TOP SECRET, Blue=SECRET, Green=CONFIDENTIAL)
- Status badge (Green=Active, Red=Inactive)
- Grid of investigation dates
- Grid of contact info
- AI-generated summary box
- Recommended action badge

**Clearance level colors:**
- TOP SECRET: Purple (#7B1FA2)
- SECRET: Blue (#1565C0)
- CONFIDENTIAL: Green (#2E7D32)
- Other: Gray (#757575)

### RiskScoreCard

**Purpose:** Visual risk assessment with gauge chart

**Props:**
```javascript
{
  overview: {
    riskScore,          // 0-100
    riskCategory,       // LOW/MODERATE/HIGH/CRITICAL
    riskTrend,          // INCREASING/STABLE/DECREASING
    totalAlertCount,
    highPriorityAlertCount,
    seadGuidelineFlags, // ['F', 'G', 'J']
    lastUpdateTimestamp
  },
  seadMapping: {
    // Map of SEAD letters to { flagged, alerts, riskLevel }
  }
}
```

**Visual design:**
- **SVG gauge** - Semicircle arc (180°)
  - Background arc: Light gray (#e0e0e0)
  - Colored arc: Risk category color
  - Percentage determines arc fill (0% = left, 100% = right)
- **Score value** - Large centered number (48px)
- **Risk label** - Category below score (16px uppercase)
- **Trend indicator** - Icon + text (↗ INCREASING, → STABLE, ↘ DECREASING)
- **SEAD flag badges** - Letters in circular badges
- **Metric boxes** - Total alerts & high priority count

**Risk score calculation:** See [Risk Scoring Algorithm](#risk-scoring-algorithm)

### SEADGuidelineMapper

**Purpose:** Interactive grid of 13 adjudicative guidelines

**Props:**
```javascript
{
  seadMapping: {
    "A": { flagged: false, alerts: [], riskLevel: "NONE" },
    "B": { flagged: true, alerts: ["ALT-20260416-012"], riskLevel: "MODERATE" },
    // ... C through M
  },
  alerts: {
    // Full alert details (for detail panel)
  }
}
```

**Grid layout:**
- 13 cards in responsive grid
- Default: 5 columns on desktop, 3 on tablet, 2 on mobile
- Each card: 
  - Guideline letter (large)
  - Guideline title (truncated if needed)
  - Status icon (✓ green or ⚠ orange)
  - If flagged: Alert count + risk level badge

**Interaction:**
- Click card → Toggles detail panel below grid
- Detail panel shows:
  - Full guideline title
  - Full description (from SEAD-13)
  - Risk level badge (if flagged)
  - Summary of concerns
  - List of related alert IDs (clickable in future)
  - Related alert types (keywords)

**Color coding:**
- **Clear cards:** Green border (#2E7D32)
- **Flagged cards:** Orange border (#E65100)
- **Selected card:** Darker background

**Data source:** `seadGuidelineMapping.js` contains official SEAD-13 guideline definitions

### KPICards

**Purpose:** Top-level alert summary across 6 categories

**Props:**
```javascript
{
  alertSummary: {
    foreign_travel: { count: 2, highPriority: 0, lastAlert: '2025-12-15', seadGuidelines: ['B','C'] },
    criminal: { count: 2, highPriority: 1, lastAlert: '2025-11-08', seadGuidelines: ['J'] },
    financial: { count: 3, highPriority: 2, lastAlert: '2026-04-16', seadGuidelines: ['F'] },
    medical: { count: 0, highPriority: 0, lastAlert: null, seadGuidelines: ['I'] },
    education: { count: 1, highPriority: 0, lastAlert: '2026-06-02', seadGuidelines: ['E'] },
    substance: { count: 2, highPriority: 1, lastAlert: '2025-11-08', seadGuidelines: ['G','H'] }
  },
  riskScore: 72,
  riskCategory: 'MODERATE',
  totalAlerts: 10,
  highPriorityCount: 4,
  onCategoryClick: (category) => { /* scroll to alerts */ }
}
```

**Renders:** AlertSummaryCards component (the 6 category cards)

### AlertSummaryCards

**Purpose:** 6 clickable cards showing alert counts by category

**Card design:**
- Icon (category-specific)
- Category name
- Alert count (large number)
- High-priority count (red badge)
- Color-coded border (left accent)

**Click behavior:**
- Calls `onCategoryClick(category)`
- Parent scrolls to AlertCategoryTabs section

### AlertCategoryTabs

**Purpose:** Detailed alert tables organized by category

**Props:**
```javascript
{
  alerts: {
    foreign_travel: [ /* array of alert objects */ ],
    criminal: [ /* array of alert objects */ ],
    financial: [ /* array of alert objects */ ],
    medical: [ /* array of alert objects */ ],
    education: [ /* array of alert objects */ ],
    substance: [ /* array of alert objects */ ]
  },
  alertSummary: {
    // Same as KPICards (for tab badges)
  }
}
```

**Tab structure:**
- 6 tabs (one per category)
- Badge shows count
- Red mini-badge shows high priority count
- Active tab has colored bottom border (category color)
- Disabled if count = 0

**Table format:**
- Standard data table (7 columns)
- Expandable rows (click chevron)
- Expanded row shows full alert details

**Alert object structure:**
```javascript
{
  alertId: "FIN-20260416-003",
  category: "financial",
  dateDetected: "2026-04-16",
  priority: "HIGH",
  status: "PENDING_REVIEW",
  summary: "FinCEN SAR - Structured transactions to foreign account",
  source: "FinCEN",
  details: {
    transactionCount: 7,
    totalAmount: 45000,
    destinationCountry: "China",
    accountType: "Business",
    period: "Jan 2026 - Mar 2026"
  },
  disposition: "FLAGGED",
  reviewedBy: "J. Smith",
  reviewedDate: "2026-04-18",
  notes: ["Subject claims legitimate business expenses", "Referred to counterintelligence"]
}
```

### TimelineView

**Purpose:** Chronological event history with filtering

**Props:**
```javascript
{
  timeline: [
    {
      date: "2026-04-16",
      category: "FINANCIAL",
      severity: "HIGH",
      source: "FinCEN",
      event: "Suspicious Activity Report Filed",
      details: "7 structured transactions totaling $45K to foreign account"
    },
    // ... more events
  ]
}
```

**Features:**
- Sort by date (descending)
- Filter by category (multi-select chips)
- Filter by severity (multi-select chips)
- Collapsible filter panel
- Expandable timeline items
- Color-coded left border (by category)
- Badge indicators (category, severity, source)

**Category colors:** See CATEGORY_COLORS constant in component

**Severity colors:**
- INFO: Green (#2E7D32)
- MODERATE: Amber (#F57C00)
- HIGH: Red (#D32F2F)
- CRITICAL: Purple (#7B1FA2)

### DispositionTracker

**Purpose:** Adjudication action history table

**Props:**
```javascript
{
  dispositionHistory: [
    {
      date: "2026-04-18T10:15:00Z",
      adjudicator: "J. Smith",
      action: "FLAGGED",
      alertId: "FIN-20260416-003",
      notes: "Concerns about foreign transactions. Referred to CI."
    },
    // ... more entries
  ],
  alerts: {
    // Full alert details (to link alert IDs)
  }
}
```

**Table columns:**
- Date (formatted with time)
- Adjudicator (badge style)
- Action (badge with icon + color)
- Alert ID (links to alert summary)
- Notes (full width)

**Action types:** CLEARED / FLAGGED / PENDING / NEEDS_INFO / SUSPENDED

---

## Data Model

### Complete Subject Object

```javascript
{
  // ===== SUBJECT DEMOGRAPHICS =====
  subject: {
    subjectId: "WPV-2026-00123",
    caseReference: "CASE-2620596307",
    firstName: "RONALD",
    middleName: "J",
    lastName: "SUAN",
    suffix: null,
    ssn: "***-**-3895",
    ssnLast4: "3895",
    dob: "1979-10-11",
    dobFormatted: "11 Oct 1979",
    age: 46,
    
    // Clearance info
    clearanceLevel: "SECRET",
    clearanceStatus: "Active",
    investigationType: "SSBI",
    investigationDate: "2021-09-15",
    adjudicationDate: "2021-12-10",
    nextReviewDate: "2026-12-10",
    
    // Organization
    organization: "Department of Defense - Navy",
    subOrg: "DoD-1",
    position: "Systems Administrator",
    
    // Contact
    email: "ronald.suan@navy.mil",
    phone: "(760) 555-0123",
    address: {
      line1: "276 MARQUETTE AVE",
      city: "SAN MARCOS",
      state: "CA",
      zip: "92078",
      country: "US"
    },
    
    // Biometrics
    photoUrl: null,
    fingerprintStatus: "On File",
    lastBiometricUpdate: "2021-09-20"
  },

  // ===== RISK OVERVIEW =====
  overview: {
    riskScore: 72,                    // 0-100
    riskCategory: "MODERATE",         // LOW/MODERATE/HIGH/CRITICAL
    riskTrend: "INCREASING",          // INCREASING/STABLE/DECREASING
    seadGuidelineFlags: ["F","G","J"],// Flagged SEAD guidelines
    totalAlertCount: 8,
    highPriorityAlertCount: 3,
    lastUpdateTimestamp: "2026-06-15T14:32:10Z",
    adjudicatorNotes: "Subject shows pattern of financial stress...",
    aiSummary: "Subject has 3 active alerts across financial...",
    recommendedAction: "FULL_REVIEW",  // AUTO_CLEAR/CONDITIONAL_CLEAR/FULL_REVIEW/DENY
    nextActionDue: "2026-06-30"
  },

  // ===== ALERT SUMMARY (by category) =====
  alertSummary: {
    foreign_travel: {
      count: 0,
      highPriority: 0,
      lastAlert: null,
      seadGuidelines: ["B","C"]
    },
    criminal: {
      count: 2,
      highPriority: 1,
      lastAlert: "2025-11-08",
      seadGuidelines: ["J"]
    },
    financial: {
      count: 3,
      highPriority: 2,
      lastAlert: "2026-04-16",
      seadGuidelines: ["F"]
    },
    medical: {
      count: 0,
      highPriority: 0,
      lastAlert: null,
      seadGuidelines: ["I"]
    },
    education: {
      count: 1,
      highPriority: 0,
      lastAlert: "2026-06-02",
      seadGuidelines: ["E"]
    },
    substance: {
      count: 2,
      highPriority: 1,
      lastAlert: "2025-11-08",
      seadGuidelines: ["G","H"]
    }
  },

  // ===== SEAD GUIDELINE MAPPING =====
  seadMapping: {
    "A": { flagged: false, alerts: [], riskLevel: "NONE" },
    "B": { flagged: false, alerts: [], riskLevel: "NONE" },
    "C": { flagged: false, alerts: [], riskLevel: "NONE" },
    "D": { flagged: false, alerts: [], riskLevel: "NONE" },
    "E": { flagged: false, alerts: [], riskLevel: "NONE" },
    "F": {
      flagged: true,
      alerts: ["FIN-20260416-003", "FIN-20260305-001", "FIN-20250820-007"],
      riskLevel: "HIGH",
      summary: "3 FinCEN SARs indicating structured transactions and large cash deposits..."
    },
    "G": {
      flagged: true,
      alerts: ["CRIM-20251108-002"],
      riskLevel: "MODERATE",
      summary: "2 DUI arrests in 18 months. No treatment program enrollment."
    },
    "H": { flagged: false, alerts: [], riskLevel: "NONE" },
    "I": { flagged: false, alerts: [], riskLevel: "NONE" },
    "J": {
      flagged: true,
      alerts: ["CRIM-20251108-001", "CRIM-20251108-002"],
      riskLevel: "MODERATE",
      summary: "2 DUI arrests. No convictions yet (pending trial)."
    },
    "K": { flagged: false, alerts: [], riskLevel: "NONE" },
    "L": { flagged: false, alerts: [], riskLevel: "NONE" },
    "M": { flagged: false, alerts: [], riskLevel: "NONE" }
  },

  // ===== DETAILED ALERTS (by category) =====
  alerts: {
    foreign_travel: [],
    criminal: [
      {
        alertId: "CRIM-20251108-001",
        category: "criminal",
        dateDetected: "2025-11-08",
        priority: "HIGH",
        status: "PENDING_REVIEW",
        summary: "Arrested for DUI in San Diego County",
        source: "FBI Rap Back",
        details: {
          arrestDate: "2025-11-08",
          agency: "San Diego County Sheriff",
          charges: ["DUI - 1st Offense", "BAC > 0.15%"],
          disposition: "Pending Trial",
          nextCourtDate: "2026-01-15"
        }
      },
      // ... more criminal alerts
    ],
    financial: [
      {
        alertId: "FIN-20260416-003",
        category: "financial",
        dateDetected: "2026-04-16",
        priority: "HIGH",
        status: "FLAGGED",
        summary: "FinCEN SAR - Structured transactions to foreign account",
        source: "FinCEN",
        details: {
          sarId: "SAR-20260416-USN-123456",
          filingInstitution: "Wells Fargo Bank",
          transactionCount: 7,
          totalAmount: 45000,
          destinationCountry: "China",
          accountType: "Business",
          period: "Jan 2026 - Mar 2026",
          narrative: "Subject made 7 deposits of $6,000-$7,000 over 3 months..."
        },
        disposition: "FLAGGED",
        reviewedBy: "J. Smith",
        reviewedDate: "2026-04-18",
        notes: ["Subject claims legitimate business expenses", "Referred to counterintelligence"]
      },
      // ... more financial alerts
    ],
    medical: [],
    education: [
      {
        alertId: "EDU-20260602-001",
        category: "education",
        dateDetected: "2026-06-02",
        priority: "LOW",
        status: "CLEARED",
        summary: "NSC degree verification confirmed",
        source: "NSC",
        details: {
          institution: "San Diego State University",
          degreeAwarded: "Bachelor of Science in Computer Science",
          graduationDate: "2002-05-15",
          verificationStatus: "Confirmed",
          responseDate: "2026-06-02"
        },
        disposition: "CLEARED",
        reviewedBy: "System",
        reviewedDate: "2026-06-02"
      }
    ],
    substance: [
      {
        alertId: "CRIM-20251108-002",
        category: "substance",
        dateDetected: "2025-11-08",
        priority: "MODERATE",
        status: "PENDING_REVIEW",
        summary: "BAC > 0.15% during DUI arrest",
        source: "FBI Rap Back",
        details: {
          testType: "Breathalyzer",
          bacLevel: 0.18,
          legalLimit: 0.08,
          testDate: "2025-11-08",
          refusedTest: false
        }
      },
      // ... more substance alerts
    ]
  },

  // ===== EVENT TIMELINE =====
  timeline: [
    {
      date: "2026-06-15",
      category: "ADJUDICATION",
      severity: "MODERATE",
      source: "Adjudicator",
      event: "Case Flagged for Full Review",
      details: "Risk score increased to 72 (MODERATE). Pattern of financial stress and alcohol-related incidents identified."
    },
    {
      date: "2026-04-16",
      category: "FINANCIAL",
      severity: "HIGH",
      source: "FinCEN",
      event: "Suspicious Activity Report Filed",
      details: "Wells Fargo reported 7 structured transactions totaling $45K to foreign account in China."
    },
    {
      date: "2025-11-08",
      category: "CRIMINAL",
      severity: "HIGH",
      source: "FBI Rap Back",
      event: "Arrested for DUI",
      details: "San Diego County arrest. BAC 0.18% (2.25x legal limit). Pending trial."
    },
    // ... more timeline events
  ],

  // ===== DISPOSITION HISTORY =====
  dispositionHistory: [
    {
      date: "2026-04-18T10:15:00Z",
      adjudicator: "J. Smith",
      action: "FLAGGED",
      alertId: "FIN-20260416-003",
      notes: "Concerns about foreign transactions. Referred to counterintelligence."
    },
    {
      date: "2026-06-02T14:32:00Z",
      adjudicator: "System",
      action: "CLEARED",
      alertId: "EDU-20260602-001",
      notes: "NSC verification confirmed. No concerns."
    },
    // ... more disposition entries
  ]
}
```

---

## Risk Scoring Algorithm

### calculateRiskScore()

**Location:** `data/riskScoringModel.js`

**Purpose:** Calculate 0-100 risk score based on alerts and SEAD mapping

**Algorithm:**

```
1. Initialize baseScore = 0, weightedAlerts = 0

2. For each SEAD guideline (A-M):
   IF guideline is flagged:
     a. Get guideline weight (0.5 - 1.0 from SEAD definitions)
     b. Get alert count for this guideline
     c. Get severity (MODERATE/HIGH/CRITICAL)
     
     d. Calculate severity multiplier:
        - MODERATE: 1.5x
        - HIGH: 2.0x
        - CRITICAL: 3.0x
     
     e. Add to baseScore:
        baseScore += (alertCount × guidelineWeight × severityMultiplier × 10)
     
     f. Add to weightedAlerts count

3. Normalize to 0-100 scale:
   normalizedScore = min(100, baseScore)

4. Determine risk category:
   - 0-29:  LOW
   - 30-59: MODERATE
   - 60-79: HIGH
   - 80-100: CRITICAL

5. Return { riskScore, category, flaggedGuidelines, totalAlerts }
```

**Example calculation:**
```
Subject has:
- 3 financial alerts (SEAD-F, weight 0.8, HIGH severity)
- 2 criminal alerts (SEAD-J, weight 0.95, MODERATE severity)
- 1 alcohol alert (SEAD-G, weight 0.7, MODERATE severity)

Financial: 3 × 0.8 × 2.0 × 10 = 48
Criminal:  2 × 0.95 × 1.5 × 10 = 28.5
Alcohol:   1 × 0.7 × 1.5 × 10 = 10.5

BaseScore = 48 + 28.5 + 10.5 = 87
NormalizedScore = min(100, 87) = 87 → CRITICAL
```

### calculateRiskTrend()

**Purpose:** Determine if risk is INCREASING / STABLE / DECREASING

**Algorithm:**

```
1. Filter timeline events for last 6 months
2. Count HIGH + CRITICAL severity events = recent
3. Filter timeline for 6-12 months ago
4. Count HIGH + CRITICAL severity events = previous

5. Compare:
   IF recent > previous + 1: INCREASING
   IF previous > recent + 1: DECREASING
   ELSE: STABLE
```

**Rationale:** Looks at HIGH/CRITICAL events only (lower severity doesn't indicate trend)

### recommendAction()

**Purpose:** Recommend AUTO_CLEAR / CONDITIONAL_CLEAR / FULL_REVIEW / DENY

**Decision tree:**

```
1. Check for critical guidelines (A, K, J with CRITICAL risk):
   IF any critical guideline flagged → FULL_REVIEW

2. Check risk category:
   IF CRITICAL → FULL_REVIEW
   IF HIGH OR highPriorityCount >= 3 → FULL_REVIEW
   IF MODERATE AND highPriorityCount > 0 → CONDITIONAL_CLEAR
   IF LOW AND highPriorityCount = 0 → AUTO_CLEAR

3. Default: FULL_REVIEW (err on side of caution)
```

**Guidelines weighted as critical:**
- **A (Allegiance)** - Loyalty to US is paramount
- **K (Handling Protected Info)** - Security violations are serious
- **J (Criminal Conduct)** - Criminal behavior is high risk

**Action meanings:**
- **AUTO_CLEAR:** No concerns, approve clearance automatically
- **CONDITIONAL_CLEAR:** Minor concerns, approve with monitoring
- **FULL_REVIEW:** Significant concerns, manual adjudication required
- **DENY:** Severe concerns, deny clearance

---

## SEAD Guidelines Integration

### Data Source

**File:** `data/seadGuidelineMapping.js`

**Contains:**
- Official SEAD-13 guideline definitions
- Keywords for each guideline
- Related alert types
- Risk weighting (0.5 - 1.0)

**Example guideline:**
```javascript
F: {
  letter: "F",
  title: "Financial Considerations",
  description: "Failure to live within one's means, satisfy debts, and meet financial obligations...",
  keywords: ["financial", "debt", "bankruptcy", "credit", "delinquent", "gambling", "tax evasion", "fraud"],
  relatedAlertTypes: ["SAR", "DELINQUENT_DEBT", "BANKRUPTCY", "FORECLOSURE", "TAX_LIEN", "GAMBLING", "FRAUD"],
  riskWeighting: 0.8
}
```

### How Alerts Map to Guidelines

**Mapping logic** (to be implemented in backend):

```
1. Alert received (e.g., FinCEN SAR)
2. Extract alert type ("SAR")
3. Search SEAD guidelines for matching relatedAlertTypes
4. Map alert to guideline(s) - SEAD-F in this case
5. Update seadMapping[F].flagged = true
6. Add alertId to seadMapping[F].alerts array
7. Calculate risk level for guideline (based on alert severity)
8. Store summary text
```

**Multi-guideline mapping:**
- Some alerts map to multiple guidelines
- Example: DUI arrest maps to both SEAD-J (Criminal) and SEAD-G (Alcohol)

### Guideline Risk Levels

**Per-guideline risk assessment:**
- **NONE:** No alerts in this category
- **LOW:** 1 low-priority alert
- **MODERATE:** Multiple low-priority OR 1 moderate-priority
- **HIGH:** Multiple moderate-priority OR 1 high-priority
- **CRITICAL:** Multiple high-priority OR critical guidelines (A, K, J) flagged

---

## API Integration

### Current State: Mock Data

**File:** `api/caseManagementApi.js`

**Mock functions:**
- `fetchSubject(subjectId)` - Get single subject
- `fetchDefaultSubject()` - Get default subject
- `fetchAllSubjectIds()` - Get list of subject IDs
- `fetchAllSubjects()` - Get all subjects
- `searchSubjects(query)` - Search by name/SSN/case ref

**Mock data:**
- 3 complete subject profiles in `mockWholePersonData.js`
- 300ms artificial delay to simulate network latency
- Returns full subject object

### Future: Lambda Integration

**Target endpoint:** `/prod/case-management/whole-person/{subjectId}`

**API calls to implement:**

```javascript
// Get subject by ID
export async function fetchSubject(subjectId) {
  const response = await fetch(`${API_BASE}/case-management/whole-person/${subjectId}`);
  if (!response.ok) throw new Error(`Subject not found: ${subjectId}`);
  return response.json();
}

// Search subjects
export async function searchSubjects(query) {
  const response = await fetch(`${API_BASE}/case-management/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Search failed');
  return response.json();
}

// Update disposition
export async function updateDisposition(subjectId, alertId, action, notes) {
  const response = await fetch(`${API_BASE}/case-management/disposition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subjectId, alertId, action, notes, adjudicator: user.name })
  });
  if (!response.ok) throw new Error('Failed to update disposition');
  return response.json();
}
```

**Backend data aggregation:**
Lambda will need to aggregate from:
- **FinCEN alerts** - eias_database.data_portal_delta_fincen_alerts
- **FBI criminal records** - TBD (FBI rapback integration)
- **NSC education verification** - eias_database.data_portal_delta_nsc_responses
- **Medical records** - TBD (integration TBD)
- **Foreign travel** - TBD (integration TBD)
- **Subject demographics** - cv-apps-data/enrollment/{subject_id}.json
- **Adjudication history** - TBD (new table)
- **Timeline events** - Aggregate from all sources + manual entries

**Risk calculation:**
- Backend Lambda calculates risk score using same algorithm
- Frontend displays pre-calculated score (no client-side calculation)
- Recalculated on data changes (new alerts, disposition updates)

---

## Usage & Navigation

### Accessing the Feature

**URL routes:**
- `/case-management` → Redirects to `/case-management/whole-person`
- `/case-management/whole-person` → Default subject view
- `/case-management/whole-person/:subjectId` → Specific subject view

**Navigation:**
- From portal sidebar: Click "Case Management"
- From other features: Link to case management with subject ID

### Typical Workflow

**1. Adjudicator receives clearance review task**
- Opens Whole Person View for subject
- Reviews risk score and category

**2. Examines SEAD guideline mapper**
- Identifies flagged guidelines (e.g., F, G, J)
- Clicks each flagged guideline to read details

**3. Reviews alert summary cards**
- Notes high-priority alerts (red badges)
- Clicks category with most concern (e.g., Financial)

**4. Drills into alert details**
- Switches to Financial tab
- Expands each alert to read full details
- Notes FinCEN SAR specifics

**5. Reviews timeline**
- Scans chronological event history
- Identifies pattern (e.g., financial stress → DUIs)
- Filters to criminal + financial events only

**6. Checks disposition history**
- Sees previous adjudicator actions
- Notes any pending items

**7. Makes decision**
- Considers recommended action (FULL_REVIEW)
- Reviews AI summary
- Makes adjudication decision (currently manual, future: disposition update API)

**8. Documents decision**
- (Future) Updates disposition for each alert
- (Future) Records overall clearance decision
- (Future) Sets next review date

---

## Design Decisions

### Why Whole Person View?

**Problem:** Adjudicators waste hours gathering data from 5+ systems (FinCEN, FBI, NSC, medical, travel) for each clearance review.

**Solution:** Aggregate everything into one view. Single dashboard = 10x faster reviews.

**Design philosophy:** "Whole Person Concept" from federal adjudication standards - evaluate the complete individual, not isolated incidents.

### Why SEAD Guideline Mapper?

**Problem:** Adjudicators must manually map alerts to 13 guidelines. Time-consuming, error-prone, inconsistent.

**Solution:** Automatic mapping based on alert types. Visual grid shows compliance at-a-glance.

**Benefit:** Standardization - all adjudicators evaluate using same framework.

### Why Risk Scoring?

**Problem:** Subjective risk assessment varies by adjudicator. Hard to prioritize cases.

**Solution:** Algorithmic risk score (0-100) based on alert count, severity, guideline weighting.

**Benefit:** 
- Objective baseline (humans override if needed)
- Triage capability (review CRITICAL cases first)
- Trend analysis (risk increasing over time?)

### Why Timeline View?

**Problem:** Hard to understand sequence of events. Did financial stress cause DUIs? Or vice versa?

**Solution:** Chronological timeline reconstruction.

**Benefit:** Narrative understanding - see cause/effect relationships.

### Why Category Tabs?

**Problem:** 50+ alerts on one screen = overwhelming, hard to scan.

**Solution:** Organize by category (financial, criminal, etc.). Focus one domain at time.

**Benefit:** Cognitive load reduction. Depth without breadth overload.

### Why Mock Data During Development?

**Problem:** Backend aggregation is complex (5+ data sources). Don't want frontend blocked.

**Solution:** Mock realistic data, develop UI in parallel with backend.

**Benefit:** Faster iteration. Test edge cases (0 alerts, 50+ alerts, etc.)

---

## Dependencies

### React Libraries

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "react-icons": "^4.12.0"
}
```

**Why these:**
- **react-router-dom:** Client-side routing (`/whole-person/:subjectId`)
- **react-icons:** Feather icon library (Fi* components)

### Custom Hooks

**useDocumentTitle** - Sets browser tab title

```javascript
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

useDocumentTitle('MAPS Enterprise Portal | Case Management');
```

### Shared Components

**None** - Case Management is fully self-contained (feature-specific header/sidebar)

### Styling

**CSS Modules:** No
**Styled Components:** No
**Plain CSS:** Yes (`.css` files co-located with components)

**CSS dependencies:**
- `index.css` - Global CSS variables (colors, fonts, spacing)
- Component-specific CSS files

---

## Future Enhancements

### Phase 2: Backend Integration

**Priority 1:**
- [ ] Lambda endpoint for subject data aggregation
- [ ] Real-time alert ingestion from FinCEN, FBI, NSC
- [ ] Delta Lake storage for timeline events
- [ ] Risk score calculation in backend

**Priority 2:**
- [ ] Disposition update API (POST /case-management/disposition)
- [ ] Adjudicator action logging
- [ ] Email notifications on high-priority alerts
- [ ] Export to PDF (case summary report)

### Phase 3: Advanced Features

**Search & List:**
- [ ] Subject search page (search by name, SSN, case ref, organization)
- [ ] Subject list view (table of all subjects)
- [ ] Filters (risk category, clearance level, organization)
- [ ] Sort by risk score, last review date, etc.

**Comparison View:**
- [ ] Side-by-side comparison of 2 subjects
- [ ] Useful for similar cases, identifying patterns

**Alert Management:**
- [ ] Mark alerts as false positive
- [ ] Add adjudicator notes to alerts
- [ ] Request additional information
- [ ] Set reminders/follow-ups

**Timeline Enhancements:**
- [ ] Date range picker (filter events by date)
- [ ] Export timeline to Excel
- [ ] Print timeline report

**SEAD Guideline Enhancements:**
- [ ] Clickable alert IDs (opens alert detail modal)
- [ ] Mitigation tracking (how has subject mitigated concerns?)
- [ ] Favorable information section (positive factors)

**Risk Scoring Enhancements:**
- [ ] Adjustable weights (adjudicator can tune guideline weights)
- [ ] ML-based score (train on historical decisions)
- [ ] Recidivism prediction (likelihood of future issues)

**Dashboard:**
- [ ] Case management landing page (workload summary)
- [ ] My assigned cases
- [ ] Team statistics
- [ ] SLA tracking (review due dates)

**Mobile:**
- [ ] Responsive design (already partially implemented)
- [ ] Mobile app (React Native)

---

## Testing

### Current State

**Unit tests:** None yet
**Integration tests:** None yet
**E2E tests:** None yet

### Recommended Test Coverage

**Component tests:**
- SubjectIdentityCard rendering
- RiskScoreCard gauge calculation
- SEADGuidelineMapper interaction (click → detail panel)
- AlertCategoryTabs tab switching + expand/collapse
- TimelineView filtering
- DispositionTracker sorting

**Integration tests:**
- API mock → Component rendering
- Search flow (future)
- Disposition update flow (future)

**E2E tests (Playwright):**
- Navigate to /case-management/whole-person
- Verify subject name displays
- Click SEAD guideline → Verify detail panel
- Click alert category tab → Verify table loads
- Expand alert row → Verify details show
- Filter timeline by category → Verify filtered results
- Refresh button → Verify data reloads

---

## Glossary

**Terms used in this feature:**

| Term | Definition |
|------|------------|
| **Adjudicator** | Personnel security specialist who makes clearance decisions |
| **SEAD** | Security Executive Agent Directive (federal policy) |
| **SEAD-13** | 13 adjudicative guidelines from SEAD 4 |
| **Whole Person View** | Comprehensive dashboard showing all security data for one subject |
| **Risk Score** | 0-100 numeric risk assessment |
| **Risk Category** | LOW / MODERATE / HIGH / CRITICAL |
| **Risk Trend** | INCREASING / STABLE / DECREASING |
| **Disposition** | Adjudicator's decision on an alert (CLEARED / FLAGGED / etc.) |
| **SAR** | Suspicious Activity Report (from FinCEN) |
| **Rap Back** | FBI criminal record notification service |
| **NSC** | National Student Clearinghouse (education verification) |
| **SSBI** | Single Scope Background Investigation (clearance type) |
| **T5** | Tier 5 investigation (TOP SECRET clearance) |

---

## Contact & Support

**Developers:**
- Primary: [Contact via EIAS Portal]
- GitHub: data-portal-projects repository

**Documentation:**
- Design System: `docs/superpowers/specs/2026-07-03-portal-design-system-documentation.md`
- API Reference: TBD (backend integration pending)

**Related Features:**
- FinCEN RADAR: `features/fincen/` (alerts dashboard)
- NSC Dashboard: `features/nsc/` (education verification)
- Data Loader: `features/data-loader/` (file uploads)

---

**Last Updated:** 2026-07-03  
**Version:** 1.0 (Prototype/Mock Data Phase)
