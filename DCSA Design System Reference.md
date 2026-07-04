# DCSA Design System Reference

**Last Updated**: 2026-06-17
**Scope**: 7 React dashboards, 34 CSS files, ~20,530 lines

---

## ⚠️ Important: Values Need Verification

**All design tokens below are documented from existing code** (portal/src/features) and need verification against the official **DCSA Ecosystem Style Guide** at:

📄 `D:\Users\1254024380197005\maps\devrel\DCSA Ecosystem Style Guide.pdf` (56MB)

**Before finalizing any design decisions**:
1. Open the PDF and verify colors, typography, spacing match official specifications
2. Document any deviations with rationale
3. Update this file with official values where they differ from current implementation

**Current Status**: Values below reflect "as-implemented" state across existing dashboards. They may not match official DCSA brand guidelines.

---

## Quick Start

```jsx
// Import CSS variables (if not already imported at app level)
import '../design-system/variables.css';

// Use CSS variables in your styles
.my-component {
  color: var(--dcsa-navy);
  padding: var(--space-4); // 16px
  border-radius: var(--radius-md); // 8px
}

// For dynamic coloring, use custom properties
<div 
  className="badge"
  style={{ '--badge-color': computedColor }}
>
```

---

## Design Tokens

### Colors

#### Brand Colors

⚠️ **VERIFY AGAINST PDF**: Check DCSA Ecosystem Style Guide § Brand Colors for official specifications

```css
--dcsa-navy: #002D5B           /* Primary brand, headers, navigation */
--dcsa-navy-light: #0A3A6B     /* Hover states, secondary elements */
--dcsa-gold: #D4AF37           /* Accent, active states, highlights */
--dcsa-gold-light: #F5E6B8     /* Light gold backgrounds, subtle accents */
```

**Status**: Extracted from existing code (NSC index.css, FinCEN FincenApp.css, EVC App.css). All three dashboards use identical values. Needs official DCSA Style Guide verification.

#### Accent Colors
```css
--accent-teal: #009BB5         /* Interactive elements, links, CTAs */
--accent-teal-dark: #007A91    /* Hover states for teal elements */
```

#### Status Colors
```css
/* Success/Pass/Clear */
--status-clear: #2E7D32
--status-clear-bg: #E8F5E9

/* Error/Fail/Alert */
--status-alert: #C62828
--status-alert-bg: #FFEBEE

/* Warning/Moderate */
--status-warning: #E65100
--status-warning-bg: #FFF3E0

/* Info/Pending */
--status-info: #1565C0
--status-info-bg: #E3F2FD
```

#### Risk Colors (FinCEN)
```css
--risk-high: #C62828           /* Seriousness C, critical risk */
--risk-high-bg: #FFEBEE
--risk-moderate: #E65100        /* Seriousness B */
--risk-moderate-bg: #FFF3E0
--risk-low: #F57F17            /* Seriousness A */
--risk-low-bg: #FFF8E1
```

#### Neutral Colors
```css
/* Text */
--text-primary: #1A2B3C        /* Body text, headings */
--text-secondary: #5A6B7C      /* Labels, metadata */
--text-muted: #8899aa          /* Placeholders, disabled text */
--text-inverse: #FFFFFF        /* Text on dark backgrounds */

/* Borders */
--border-light: #E4E7ED        /* Default borders, dividers */
--border-medium: #CBD2DB       /* Emphasized borders */

/* Backgrounds */
--bg-page: #FFFFFF             /* Main page background */
--bg-card: #FFFFFF             /* Card/panel backgrounds */
--bg-sidebar: #FAFBFC          /* Sidebar, secondary surfaces */
--bg-table-header: #F8F9FB     /* Table headers */
--bg-header: #002D5B           /* Top navigation bar */
```

### Typography

#### Font Family

⚠️ **VERIFY AGAINST PDF**: Check DCSA Ecosystem Style Guide § Typography for official font specifications

```css
--font-family-primary: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
```

**Status**: Inter font used across all dashboards, loaded locally via `public/fonts/Inter-*.woff2` (weights 400-700). Verify if Inter is approved DCSA font or if official guide specifies different typeface.

#### Font Sizes
```css
--font-size-xs: 11px           /* Metadata, fine print */
--font-size-sm: 13px           /* Table cells, labels, body text */
--font-size-base: 14px         /* Default body text */
--font-size-lg: 16px           /* Section headers */
--font-size-xl: 20px           /* Page titles */
--font-size-2xl: 24px          /* Large page titles */
--font-size-3xl: 28px          /* KPI values, emphasis */
```

#### Font Weights
```css
--font-weight-regular: 400     /* Body text */
--font-weight-medium: 500      /* Emphasized text */
--font-weight-semibold: 600    /* Section headers */
--font-weight-bold: 700        /* Page titles, KPI values */
```

#### Line Heights
```css
--line-height-tight: 1.25      /* Headings, compact text */
--line-height-normal: 1.5      /* Body text (default) */
--line-height-relaxed: 1.75    /* Long-form content */
```

### Spacing Scale

**4px increments** for visual rhythm consistency:

```css
--space-1: 4px                 /* Tight spacing */
--space-2: 8px                 /* Badges, icons */
--space-3: 12px                /* Small gaps */
--space-4: 16px                /* Default padding */
--space-5: 20px                /* Medium padding */
--space-6: 24px                /* Section spacing */
--space-8: 32px                /* Large section spacing */
--space-10: 40px               /* Extra large spacing */
--space-12: 48px               /* Maximum spacing */
```

**Usage**:
```css
/* ✅ CORRECT */
padding: 16px 20px;            /* Uses scale: space-4, space-5 */
gap: 12px;                     /* Uses scale: space-3 */

/* ❌ WRONG */
padding: 15px 18px;            /* Non-standard values */
gap: 10px;                     /* Not in 4px scale */
```

### Border Radius
```css
--radius-sm: 4px               /* Inputs, small cards */
--radius-md: 8px               /* Cards, panels, modals */
--radius-pill: 12px            /* Badges, pills, tags */
```

### Shadows
```css
--shadow-card: 0 2px 8px rgba(0, 21, 48, 0.06);
--shadow-dropdown: 0 4px 12px rgba(0, 21, 48, 0.08);
```

### Layout Dimensions
```css
--sidebar-width: 220px         /* Standard sidebar width */
--header-height: 56px          /* Fixed header height */
--touch-target-min: 44px       /* Minimum mobile touch target */
```

---

## Component Library

### KPI Cards

**Used by**: NSC, FinCEN, EVC, Data Loader, Use Cases, Vulnerability

**Pattern**:
```css
.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  border-left: 4px solid var(--kpi-accent); /* Colored accent bar */
  box-shadow: var(--shadow-card);
}

.kpi-value {
  font-size: var(--font-size-3xl); /* 28px */
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.kpi-label {
  font-size: var(--font-size-sm); /* 13px */
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.kpi-subtitle {
  font-size: var(--font-size-xs); /* 11px */
  color: var(--text-muted);
}
```

**Responsive Grid**:
```css
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}
```

**Variations by Feature**:
- **NSC**: Clickable cards with hover effects, filtering interactions
- **EVC/FinCEN**: Accent prop determines border color

**Example Implementations**:
- `portal/src/features/nsc/components/KPICard.jsx`
- `portal/src/features/fincen/components/KPICards.jsx`

### Status Badges

**Used by**: All features (50+ variant classes)

**Base Pattern**:
```css
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border: 1px solid;
}
```

**Semantic Variants** (use these):
```css
/* Success/Pass/Valid */
.status-badge.success {
  background: var(--status-clear-bg);
  color: var(--status-clear);
  border-color: var(--status-clear);
}

/* Error/Fail/Invalid */
.status-badge.error {
  background: var(--status-alert-bg);
  color: var(--status-alert);
  border-color: var(--status-alert);
}

/* Warning/Pending */
.status-badge.warning {
  background: var(--status-warning-bg);
  color: var(--status-warning);
  border-color: var(--status-warning);
}

/* Info */
.status-badge.info {
  background: var(--status-info-bg);
  color: var(--status-info);
  border-color: var(--status-info);
}
```

**Feature-Specific Taxonomies** (existing, but consider consolidating):

| Feature | Variants | Usage |
|---------|----------|-------|
| **NSC** | `.operation-badge` | VerifyStudent, CheckEnrollment, VerifyEnrollment |
| **EVC** | `.status-{variant}` | pending, completed, queued, failed, NR, RP, RF, DD, AR (20+ variants) |
| **FinCEN** | `.seriousness-{A\|B\|C}` | Alert severity levels |
| **FinCEN** | `.status-{validated\|dismissed\|referred}` | Adjudication decisions |

**Dynamic Coloring Pattern**:
```jsx
// For threshold-based colors (risk scores, confidence levels)
const colors = getStatusColors(value, thresholds);

<span 
  className="status-badge"
  style={{
    '--badge-border': colors.border,
    '--badge-bg': colors.bg,
    '--badge-color': colors.text
  }}
>
  {label}
</span>
```

### Data Tables

**Used by**: NSC, FinCEN, EVC, Data Loader, Use Cases

**Pattern**:
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.data-table thead {
  background: var(--bg-table-header);
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-light);
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.data-table th.sortable:hover {
  background: rgba(0, 155, 181, 0.08);
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-light);
}

.data-table tbody tr:hover {
  background: rgba(0, 155, 181, 0.04);
}
```

**Features**:
- Sortable headers with chevron icons
- Hover states on rows
- Responsive: Card layout on mobile (<768px)

**Example Implementations**:
- `portal/src/features/fincen/FincenApp.css` (lines 898-962)
- `portal/src/features/data-loader/components/DataTable.jsx`

### Forms

**Used by**: All features

**Input Fields**:
```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  font-family: var(--font-family-primary);
  transition: border-color 0.15s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-teal);
  box-shadow: 0 0 0 3px rgba(0, 155, 181, 0.1);
}

.form-group input:disabled {
  background: #F5F6F8;
  cursor: not-allowed;
}
```

**Buttons**:
```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.btn-primary {
  background: var(--dcsa-navy);
  color: var(--text-inverse);
}

.btn-primary:hover:not(:disabled) {
  background: var(--dcsa-navy-light);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--accent-teal);
  color: var(--text-inverse);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--accent-teal-dark);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--bg-sidebar);
  color: var(--text-primary);
}
```

### Navigation

**Header**:
```css
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height); /* 56px */
  background: var(--bg-header); /* Navy */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header-title {
  color: var(--text-inverse);
  font-size: 18px;
  font-weight: var(--font-weight-bold);
}
```

**Sidebar**:
```css
.app-sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width); /* 220px */
  background: var(--bg-card);
  box-shadow: 2px 0 8px rgba(0, 21, 48, 0.06);
  padding: 16px 0;
  overflow-y: auto;
  z-index: 90;
  transition: width 0.2s ease;
}

.app-sidebar.collapsed {
  width: 56px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-decoration: none;
  border-left: 3px solid transparent;
  transition: all 0.15s;
}

.sidebar-link:hover {
  color: var(--dcsa-navy);
  background: rgba(0, 33, 71, 0.04);
}

.sidebar-link.active {
  color: var(--dcsa-navy);
  font-weight: var(--font-weight-semibold);
  background: var(--dcsa-gold-light);
  border-left-color: var(--dcsa-gold);
}
```

### Charts (Recharts)

**Used by**: FinCEN (6 types), Use Cases, Vulnerability

**Theming**:
```jsx
// Bar chart colors
<Bar dataKey="value" fill="var(--accent-teal)" />
<Bar dataKey="threshold" fill="var(--dcsa-navy)" />

// Grid styling
<CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />

// Axis styling
<XAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
<YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />

// Tooltip styling (custom component)
<Tooltip 
  contentStyle={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-dropdown)'
  }}
/>
```

**Chart Types Used**:
- **Bar Charts**: Alert counts, type distributions, data quality scores
- **Line Charts**: Time series, trend analysis
- **Pie Charts**: Category breakdowns, severity distributions
- **Heatmaps**: Organization-level risk views

**Example Implementations**:
- `portal/src/features/fincen/components/charts/AlertTimeSeries.jsx`
- `portal/src/features/fincen/components/charts/AlertTypeBar.jsx`
- `portal/src/features/vulnerability/components/VulnSeverityChart.jsx`

---

## Feature-Specific Components

### FinCEN RADAR

**Collapsible Section**:
```jsx
// Expand/collapse panels with smooth animations
<CollapsibleSection title="Identity Check" defaultOpen={true}>
  <IdentityCheck data={checkData} />
</CollapsibleSection>
```
**Location**: `portal/src/features/fincen/components/CollapsibleSection.jsx`

**KV Grid (Key-Value Display)**:
```jsx
// 4-column responsive grid for metadata
<KVGrid data={[
  { label: 'Alert ID', value: 'A-12345' },
  { label: 'Filed Date', value: '2026-01-15' },
  // ...
]} />
```
**Location**: `portal/src/features/fincen/components/KVGrid.jsx`

**Model Recommendation Badge**:
```css
/* Circular badge (32px) matching EVC alert level style */
.model-badge-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: var(--font-weight-bold);
}

.model-badge-circle.valid {
  border-color: var(--status-clear);
  color: var(--status-clear);
  background: var(--status-clear-bg);
}

.model-badge-circle.invalid {
  border-color: var(--status-alert);
  color: var(--status-alert);
  background: var(--status-alert-bg);
}
```

### EVC (FBI EVC Enrollment)

**Cascade Stepper**:
```css
/* Horizontal timeline with dots and connecting lines */
.cascade-stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--border-light);
}

.step-dot.active {
  background: var(--accent-teal);
  box-shadow: 0 0 0 4px rgba(0, 155, 181, 0.2);
}

.step-dot.complete {
  background: #A5D6A7; /* Light green */
}

.step-line {
  width: 40px;
  height: 2px;
  background: var(--border-light);
}
```

**Probability Bar**:
```css
/* Progress bar with threshold marker */
.probability-bar {
  height: 14px;
  background: var(--border-light);
  border-radius: var(--radius-sm);
  position: relative;
  overflow: hidden;
}

.probability-fill {
  height: 100%;
  background: var(--accent-teal);
  transition: width 0.3s ease;
}

.probability-threshold {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--dcsa-gold);
}
```

**Alert Level Badge**:
```css
/* Circular D/C/B/A severity badges */
.alert-level-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: var(--font-weight-bold);
}

.alert-level-badge.level-d {
  border-color: #C62828; /* Red - critical */
  color: #C62828;
}

.alert-level-badge.level-c {
  border-color: #E65100; /* Orange - high */
  color: #E65100;
}

.alert-level-badge.level-b {
  border-color: #F9A825; /* Yellow - moderate */
  color: #F9A825;
}

.alert-level-badge.level-a {
  border-color: var(--dcsa-gold); /* Gold - low */
  color: var(--dcsa-gold);
}
```

### Data Loader

**File Uploader**:
```css
/* Drag-drop zone with progress */
.file-uploader {
  border: 2px dashed var(--border-medium);
  border-radius: var(--radius-md);
  padding: 48px 24px;
  text-align: center;
  background: var(--bg-sidebar);
  transition: all 0.2s;
}

.file-uploader.dragover {
  border-color: var(--accent-teal);
  background: rgba(0, 155, 181, 0.04);
}

.upload-progress {
  margin-top: 16px;
}

.progress-bar {
  height: 8px;
  background: var(--border-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-teal);
  transition: width 0.3s ease;
}
```

### Use Cases

**Kanban Board**:
```css
/* Drag-drop columns for use case management */
.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
}

.kanban-column {
  min-width: 280px;
  background: var(--bg-sidebar);
  border-radius: var(--radius-md);
  padding: 16px;
}

.kanban-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-bottom: 12px;
  cursor: move;
}

.kanban-card:hover {
  box-shadow: var(--shadow-card);
}
```

---

## Styling Patterns

### When to Use What

**CSS Classes** (static layouts, reusable patterns):
```css
/* Base component structure */
.kpi-card {
  padding: 16px 20px;
  border-radius: var(--radius-md);
}
```

**Inline Styles** (dynamic computed values):
```jsx
// For threshold-based coloring, computed layouts
<div style={{ width: `${percentage}%` }} />
```

**CSS Custom Properties** (bridging JS computation with CSS styling):
```jsx
// Best of both worlds: layout in CSS, values in JS
const colors = getRiskColors(score);
<div 
  className="risk-badge"
  style={{
    '--badge-border': colors.border,
    '--badge-bg': colors.bg,
    '--badge-color': colors.text
  }}
/>
```

### Dynamic Styling Pattern

**Problem**: Need to color a badge based on a risk score (0-100) with thresholds.

**❌ Wrong Approach 1: Hardcoded classes**
```css
/* Creates 100 classes for every possible score */
.risk-0 { color: green; }
.risk-1 { color: green; }
/* ... */
.risk-100 { color: red; }
```

**❌ Wrong Approach 2: Inline styles everywhere**
```jsx
// No CSS, all JS - hard for designers to modify
<div style={{ color: score > 50 ? 'red' : 'green' }}>
```

**✅ Correct Approach: CSS custom properties**
```css
/* Base class defines structure */
.risk-badge {
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--badge-border);
  background: var(--badge-bg);
  color: var(--badge-color);
}
```

```jsx
// Component computes colors based on business logic
function getRiskColors(score) {
  if (score >= 75) return { border: '#C62828', bg: '#FFEBEE', color: '#C62828' };
  if (score >= 50) return { border: '#E65100', bg: '#FFF3E0', color: '#E65100' };
  return { border: '#2E7D32', bg: '#E8F5E9', color: '#2E7D32' };
}

// Render with custom properties
<div 
  className="risk-badge"
  style={{
    '--badge-border': colors.border,
    '--badge-bg': colors.bg,
    '--badge-color': colors.color
  }}
>
  Risk: {score}
</div>
```

**Why This Works**:
- Threshold logic centralized in JavaScript (single source of truth)
- Layout/sizing in CSS (designer-editable without code changes)
- Eliminates class explosion (no `.risk-high`, `.risk-moderate`, `.risk-low`)
- Works for continuous values (0-100), not just discrete states

**Example**: NSC AITriageComponents.jsx uses this pattern extensively (166 instances)

---

## Responsive Design

### Breakpoints

```css
/* Tablet */
@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
  .sidebar { transform: translateX(-100%); }
}

/* Mobile */
@media (max-width: 768px) {
  .page-header { flex-direction: column; }
  .data-table { /* Switch to card layout */ }
}

/* Small mobile */
@media (max-width: 640px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; }
}

/* Extra small */
@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .header-username { display: none; }
}
```

### Mobile Requirements

**Touch Targets**: ≥44px minimum
```css
.btn, .sidebar-link, .tab-button {
  min-height: var(--touch-target-min); /* 44px */
}
```

**Input Font Size**: ≥16px (prevents iOS zoom)
```css
input, select, textarea {
  font-size: 16px; /* Mobile only */
}

@media (min-width: 768px) {
  input, select, textarea {
    font-size: 14px; /* Desktop */
  }
}
```

**Navigation**: Transform sidebar off-screen
```css
@media (max-width: 768px) {
  .app-sidebar {
    transform: translateX(-100%);
    transition: transform 0.2s;
  }
  
  .app-sidebar.open {
    transform: translateX(0);
  }
}
```

**Tables**: Card-based layout
```css
@media (max-width: 768px) {
  .data-table thead { display: none; }
  .data-table tr {
    display: block;
    margin-bottom: 16px;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
  }
  .data-table td {
    display: flex;
    justify-content: space-between;
    padding: 12px;
  }
  .data-table td::before {
    content: attr(data-label);
    font-weight: var(--font-weight-semibold);
  }
}
```

---

## Adding New Styles - Decision Tree

### Question 1: What am I styling?

**Layout/Structure** (padding, margins, borders, sizing)
→ Use CSS class in feature-level or component-specific CSS file

**Colors** (text, backgrounds, borders)
→ Use CSS variables (`var(--dcsa-navy)`) or custom properties for dynamic values

**Dynamic Values** (threshold-based, computed from data)
→ Use CSS custom properties pattern (see § Dynamic Styling Pattern)

### Question 2: Where should the CSS go?

**Is this specific to ONE feature?**
→ Feature-level CSS file: `portal/src/features/{feature}/{Feature}App.css`

**Is this specific to ONE component?**
→ Component-specific CSS file: `portal/src/features/{feature}/components/{Component}.css`

**Is this used by MULTIPLE features?**
→ Extract to shared component: `portal/src/features/shared/{Component}.css`
→ **Note**: Currently no shared components exist - each feature has own implementations

**Is this portal shell layout?**
→ Global CSS file: `portal/src/App.css` (header, sidebar, main wrapper)

### Question 3: Does this component already exist?

**Before creating new KPI cards, status badges, tables, charts:**

1. **Search existing implementations**:
   ```bash
   # Find similar components
   Glob pattern="**/KPI*.jsx"
   Grep pattern="kpi-card" output_mode="files_with_matches"
   ```

2. **Check component inventory** (see § Component Library above)

3. **If similar component exists**:
   - Same needs → Reuse it
   - 80% similar → Extend with props
   - Truly different → Create new, document why in code comment

4. **If creating new**:
   - Follow patterns in this guide
   - Use CSS variables for colors
   - Make responsive (see § Responsive Design)

### Question 4: Is this a new design token?

**Adding a new color, spacing value, font size, etc.:**

1. **Check if it fits existing scale** (see § Design Tokens)
2. **If new token needed**:
   - Add to appropriate CSS variables file (currently: each feature has own :root)
   - Use semantic naming: `--color-risk-critical` not `--red-dark`
   - Document in this file (DESIGN_SYSTEM.md)
3. **Verify against DCSA Style Guide** (D:\Users\1254024380197005\maps\devrel\DCSA Ecosystem Style Guide.pdf)

---

## Migration Guide

### Moving from Inline Styles to Custom Properties

**Before** (166 instances in NSC AITriageComponents.jsx):
```jsx
<div style={{
  color: score > 75 ? '#C62828' : score > 50 ? '#E65100' : '#2E7D32',
  backgroundColor: score > 75 ? '#FFEBEE' : score > 50 ? '#FFF3E0' : '#E8F5E9',
  borderColor: score > 75 ? '#C62828' : score > 50 ? '#E65100' : '#2E7D32'
}}>
```

**After**:
```css
/* Add base class */
.risk-badge {
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--badge-border);
  background: var(--badge-bg);
  color: var(--badge-color);
}
```

```jsx
// Compute colors once
const colors = getRiskColors(score);

<div 
  className="risk-badge"
  style={{
    '--badge-border': colors.border,
    '--badge-bg': colors.bg,
    '--badge-color': colors.color
  }}
>
```

### Consolidating Duplicate CSS Classes

**Before** (EVC has 20+ status badge variants):
```css
.status-badge.status-pending { color: #1565C0; border-color: #1565C0; }
.status-badge.status-queued { color: #1565C0; border-color: #1565C0; }
.status-badge.status-in-progress { color: #E65100; border-color: #E65100; }
.status-badge.status-completed { color: #2E7D32; border-color: #2E7D32; }
/* ... 16 more variants ... */
```

**After** (semantic variants only):
```css
.status-badge.info { color: var(--status-info); border-color: var(--status-info); }
.status-badge.warning { color: var(--status-warning); border-color: var(--status-warning); }
.status-badge.success { color: var(--status-clear); border-color: var(--status-clear); }
```

```jsx
// Map feature-specific statuses to semantic variants
function getStatusVariant(status) {
  if (['pending', 'queued'].includes(status)) return 'info';
  if (['in-progress'].includes(status)) return 'warning';
  if (['completed'].includes(status)) return 'success';
  return 'info';
}

<span className={`status-badge ${getStatusVariant(status)}`}>
```

### Extracting Component from Monolithic File

**Problem**: EVC App.css is 4,089 lines, hard to navigate

**Steps**:
1. Identify component boundary (e.g., lines 800-900 are KPI card styles)
2. Create new file: `components/KPICard.css`
3. Move relevant styles to new file
4. Import in component: `import './KPICard.css'`
5. Test: Verify no visual regressions
6. Delete from App.css

---

## Common Mistakes and Fixes

### Mistake 1: Hardcoded Colors
```css
/* ❌ WRONG */
color: #002D5B;

/* ✅ CORRECT */
color: var(--dcsa-navy);
```

### Mistake 2: Non-Standard Spacing
```css
/* ❌ WRONG */
padding: 15px 18px;

/* ✅ CORRECT */
padding: 16px 20px; /* Uses space-4, space-5 from scale */
```

### Mistake 3: Duplicating Components
```jsx
// ❌ WRONG: Creating new KPICard without checking existing
// portal/src/features/use-cases/components/KPICard.jsx

// ✅ CORRECT: Search first
// Glob pattern="**/KPI*.jsx" → Found 3 existing implementations
// Reuse or extract to /features/shared
```

### Mistake 4: Creating Too Many Status Badge Variants
```css
/* ❌ WRONG: Creating badge for every possible status */
.status-badge.status-processing { ... }
.status-badge.status-validating { ... }
.status-badge.status-analyzing { ... }

/* ✅ CORRECT: Use semantic variants */
.status-badge.info { ... } /* Maps to: processing, validating, analyzing */
```

### Mistake 5: Inline Styles for Static Values
```jsx
/* ❌ WRONG */
<div style={{ padding: '16px', borderRadius: '8px' }}>

/* ✅ CORRECT */
<div className="card">  /* Define in CSS */
```

---

## Component Consolidation Opportunities

**These components appear in 3+ features and should be extracted to `/features/shared`:**

1. **KPI Cards** - 6 implementations across NSC, FinCEN, EVC, Data Loader, Use Cases, Vulnerability
2. **Status Badges** - 50+ variants across all features (consolidate to semantic variants)
3. **Data Tables** - 5+ implementations with sortable headers, hover states
4. **Forms** - Input/select/button patterns duplicated across features
5. **Charts (Recharts)** - Theming duplicated in FinCEN, Use Cases, Vulnerability
6. **Collapsible Sections** - FinCEN implementation reusable for other features
7. **Loading States** - Spinner/skeleton patterns duplicated

**Not yet consolidated** - Each feature has own implementation currently.

---

## Testing Checklist

### Visual Regression Testing

**Before deploying CSS changes**:
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test responsive breakpoints: 1024px, 768px, 640px, 480px
- [ ] Test dark mode (if applicable)
- [ ] Screenshot comparison (Playwright visual regression)

### Component Testing

**When creating/modifying components**:
- [ ] Renders correctly with all prop combinations
- [ ] Hover states work on desktop
- [ ] Touch targets ≥44px on mobile
- [ ] Focus states visible (keyboard navigation)
- [ ] Loading/error/empty states handled

### Accessibility Testing

- [ ] WCAG AA contrast ratios met (4.5:1 for text, 3:1 for UI elements)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader labels present (aria-label, role)
- [ ] Focus visible (outline not removed without replacement)

---

## Resources

### Official Brand Guidelines

**📄 DCSA Ecosystem Style Guide** (Primary Reference)
- **Location**: `D:\Users\1254024380197005\maps\devrel\DCSA Ecosystem Style Guide.pdf`
- **Size**: 56MB
- **Status**: Not yet programmatically reviewed - requires manual extraction

**How to Use**:
1. **Before adding new colors**: Open PDF, find § Brand Colors, verify hex values match
2. **Before finalizing typography**: Check § Typography for approved fonts, sizes, weights
3. **Before setting spacing**: Look for official grid system or spacing scale
4. **For logo usage**: Check § Logo Specifications for placement, clear space, minimum sizes
5. **For accessibility**: Verify § Accessibility Standards for WCAG compliance requirements

**What to Extract** (Priority Order):
1. Official brand colors (verify #002D5B navy, #D4AF37 gold, #009BB5 teal)
2. Approved typography (confirm Inter font or identify official typeface)
3. Spacing/grid system specifications
4. Logo usage rules and clear space requirements
5. Accessibility standards (contrast ratios, minimum touch targets)
6. Any DCSA-specific component guidelines (buttons, forms, tables)

**Create**: `DCSA_STYLE_GUIDE_EXTRACT.md` with findings and page references for future updates.

### Internal Documentation
- `.claude/agents/dcsa-design-system.md` - Design system enforcement agent
- `CLAUDE.md` - Project conventions (No emojis, ASCII only, GovCloud constraints)
- `portal/src/features/{feature}/README.md` - Feature-specific patterns (if exists)

### External References
- [Inter Font](https://rsms.me/inter/) - Typography documentation
- [Recharts](https://recharts.org/) - Chart library documentation
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility guidelines

### Command Shortcuts
```bash
# Search for component implementations
Glob pattern="**/KPI*.jsx"
Grep pattern="kpi-card" output_mode="files_with_matches"

# Find hardcoded colors
Grep pattern="#[0-9a-f]{6}" output_mode="content"

# Check CSS file sizes
ls -lh portal/src/**/*.css

# Run design system agent
/design-review
/design-review {file_path}
```

---









# DCSA Ecosystem Style Guide - Extract

**Source**: D:\Users\1254024380197005\maps\devrel\DCSA Ecosystem Style Guide.pdf  
**Total Pages**: 32  
**Extracted**: 2026-06-17  
**Based on**: USWDS 3.0 Standards

---

## ⚠️ EXTRACTION CORRECTION (2026-06-25)

**CORRECTION**: Initial extraction on 2026-06-17 contained a transcription error for Legendary Gold.

| Color | Incorrectly Extracted (2026-06-17) | Correct Value (Verified 2026-06-25) | Status |
|-------|-----------------------------------|-------------------------------------|--------|
| **Legendary Gold** | `#E09137` (orange) | `#D4AF37` (yellow-gold) | ✅ CORRECTED |

**Original discrepancies (now resolved):**

| Token | Official (DCSA PDF) | Status (2026-06-25) |
|-------|-------------------|---------------------|
| **Primary Navy** | `#002D5B` | ✅ CORRECTED (2026-06-18) |
| **Gold** | `#D4AF37` (Legendary Gold) | ✅ CORRECTED (2026-06-25) |
| **Teal** | Not in official palette | ⚠️ Custom color `#009BB5` in use (needs decision) |
| **Typography** | USWDS/National Parks system | ⚠️ Inter font in use (needs verification) |

---

## Visual Identity (Page 2)

### Brand Colors - Official DCSA Palette

#### Primary Colors

**Primary Blue** `#002D5B`
- **Usage**: Primary brand, headers, navigation
- **Current code uses**: `#002147` (incorrect)
- **Context**: Brand primary
- **AAA**: Decorative | Non-text Usage

**Ocean Blue** `#0099D8`
- **Usage**: Ocean-themed elements, secondary accents
- **Context**: Brand ocean
- **AAA**: Decorative | Non-text Usage

**Sky Blue** `#00A6DC`
- **Usage**: Sky-themed elements, light accents
- **Context**: Brand sky
- **AAA**: Decorative | Non-text Usage

#### Supporting Colors

**Ice Blue** `#91D0E4`
- **Usage**: Light backgrounds, subtle highlights

**Charcoal** `#5B5B5A`
- **Usage**: Text, dark UI elements
- **Context**: Brand charcoal
- **AAA**: Decorative | Non-text Usage

**Legendary Gold** `#D4AF37`
- **Usage**: Accent, active states, highlights
- **Current code uses**: `#D4AF37` (corrected 2026-06-25)
- **Context**: Brand gold
- **AAA**: Decorative | Non-text Usage
- **Note**: Initially transcribed incorrectly as `#E09137` on 2026-06-17; corrected after PDF visual verification

### Branding Notes

- DCSA seal shown with official proportions
- "DEFENSE COUNTERINTELLIGENCE AND SECURITY AGENCY" official text
- NBIS Portal shown as reference implementation
- **No teal color (#009BB5) in official palette** - this appears to be a custom addition in current code

---

## Color System & Theme Tokens (Pages 3-4)

### USWDS Theme Customization

**What are Theme Color Tokens?**
> Theme tokens define primary, secondary, neutral, and semantic color tokens that define the visual identity of your system.

**DCSA Theme Customization:**
- Our ecosystem uses specific DCSA colors while maintaining USWDS accessibility
- All custom colors documented in theme configuration files
- Supports system default color-contrast formula
- Custom values documented in theme configuration files

### Token System Structure

The guide shows comprehensive token systems for:

#### Base Tokens
- **lightest** to **darkest** scale (7 steps)
- Neutral grays from light to dark
- Used for backgrounds, borders, text

#### Info Tokens
- Blue scale for informational elements
- **lighter** → **light** → **medium** → **vivid** → **dark** → **darker** → **darkest**

#### Success Tokens
- Green scale for success states
- Same gradient structure as info

#### Primary Tokens
- Light blue scale: `#dceef9` → `#00709c` (darkest)
- **Current code's navy (#002147) not shown in this scale**

#### Secondary Tokens
- Red scale for alerts/errors
- `#fae8e8` (lightest) → `#8b0a03` (darkest)

#### Accent-Cool Tokens
- Cyan/teal scale: `#e7f5f8` → `#074b55` (darkest)
- **Note**: Official accent-cool includes teal, but specific values differ from code's `#009BB5`

#### Accent-Warm Tokens
- Orange/gold scale: `#fef2e4` → `#5c4809` (darkest)
- Includes gold tones, verify against `#D4AF37` (Legendary Gold)

### Token Usage Examples (Page 4 - Right Side)

**Alerts**:
- Info: "We'll do this next time" (blue)
- Success: "Your application was successfully submitted" (green)
- Warning: "You've been inactive for five minutes" (yellow)
- Error: "You haven't submitted all the documents we need." (red)

**Buttons**:
- Primary: "My account" (blue)
- Destructive: "Cancel" (red)
- Various button groups with USA colors

**Accessibility Guidelines**:
- Contrast ratios: AA (minimum 4.5:1 for normal text, 3:1 for large text)
- Examples show WCAG 2.1 AA/AAA compliance standards
- Color Independence: "Never rely on color alone; always pair with icons or text"

---

## Typography & Prose (Page 5)

### USWDS-Based Design System for DCSA Digital Products

**Font System**: **National Parks** (official USWDS font)

#### Font Stacks

**Sans-Serif Stack**:
```
National Park
Source Sans Pro
Helvetica Neue
Helvetica
Roboto
Arial
sans-serif
```

**Serif Stack**:
```
Lora
Georgia
Cambria
Times New Roman
serif
```

**Accessibility Notes**:
- Minimum 21 for normal text, 3:1 for large text (18pt normal/14pt bold) WCAG 2.1 AA/AAA minimum
- Examples include links, headings, body text, lead paragraphs
- Line height requirements specified
- Use sentence case
- Use left-aligned text
- 2-3 font sizes fewer than 6-7
- Only use small caps for special cases

#### US Tokens

**Defined in theme configuration**:
- There are 20-150,000 system font size tokens, from size 1 to size 20
- Use theme font size tokens for your project. These are nine theme font size tokens...

**Important Note**: Assign theme font tokens to **font families** (not sizes), **font weights** (not sizes), **line-heights**, **font-stacks**, **letter spacing**.

**Example**: `bold`, `italic`, `sans`, `serif`, `mono`, not `project-sans` for main (project) font, `default`, `project`, `heading`, `ui`, `code`, `alt`, `print`.

### Current Code Status

**Current Implementation**: Inter font family  
**Official Specification**: National Parks / Source Sans Pro  
**Action Required**: Verify if Inter is approved alternative OR migrate to National Parks

---

## Data Tables (Page 6)

### Purpose & USWDS

Tables organize complex information into rows and columns, making it easy to scan, compare, and analyze data.

#### Sortable Tables

**USWDS Tables**:
- Included element: Sortable table rows and columns
- Sorting enterprise-grade features like sorting, pagination, and filtering capabilities for use within data-driven federal government sites

**DCSA Theming**:
- Headers remain Light blue w/light grey for contrast, while maintain accessibility visual requirements

**Consistency**:
- Established standard naming/light/dark/disabled lights and navigation, pagination

### Table Design Guidelines

**Document title example shown**: "Title" column
**Action Determinations**: Shows checkbox selection
**Dates**: "Start Date" column format
**State Determination**: Various body text states (Body, Bold, BoldXX text variations)

**Theming Options**: Tables can be styled with:
- Primary DCSA colors for headers (blue tones)
- Alternating row backgrounds for readability
- Border options for visual separation

---

## Forms (Page 7)

### Form Accessibility

Forms must be accessible to keyboard users, as well as compliant with Section 508 and WCAG 2.1 standards (promote usability in general).

#### Key Guidelines

**Label Association**:
- Label each unique input
- Every input must have an associated label

**Required Fields**:
- Clearly indicate when fields are optional OR required
- Use asterisks (*) or text like "optional"/"required"
- Color should not be sole indicator

**Error Handling**:
- Clear, specific error messaging
- Associate errors with fields
- Provide corrective instructions

**Focus & Navigation**:
- Visible focus states
- The order should be logical
- Users should be able to Tab through form elements

### USA Button Variations

Multiple button styles shown with USWDS theming:

**Primary Actions**:
- Default: Blue background
- Secondary: Outline style
- Accent Cool: Teal/cyan theme
- Base: Neutral gray

**Button States**:
- Regular, Hover, Active, Disabled
- Consistent sizing and touch targets (minimum 44px)

**Button Groups**:
- Popular combinations shown
- Undo, Work Government variations
- Accept, Decline patterns

### Form Examples

Shows input fields with:
- Proper label placement
- Hint text formatting
- Error state styling (red borders, error icons)
- Required field indicators
- Combo box (dropdown) styling

---

## Alerts & Notifications (Page 8)

### System Banners & Alert Components

Comprehensive usage guidelines and variant specifications for alert banner components following USWDS standards and accessibility requirements.

#### Alert Types

**Informational** (Blue - `usa-alert--info`)
- Icon: ℹ️ (info circle)
- Usage: General information, status updates
- Example: "Your documents are ready."

**Success** (Green - `usa-alert--success`)
- Icon: ✓ (checkmark)
- Usage: Successful operations, confirmations
- Example: "Your documents are ready."

**Warning** (Yellow - `usa-alert--warning`)
- Icon: ⚠ (warning triangle)
- Usage: Important notices that require attention
- Example: "Your documents are ready."

**Error** (Red - `usa-alert--error`)
- Icon: ✕ (error X)
- Usage: Errors, failures, critical issues
- Example: "Your documents are ready."

**Help** (Cyan - `usa-alert--help`)
- Icon: ? (question mark)
- Usage: Helpful hints, guidance

#### Additional Variants

**System Banner** (Green):
- Full-width security notice placeholder
- Example: "System Banner (Security Notice Placeholder)"

**Close Info Block**:
- Dismissible alerts with close button
- Shows "close info block" text

**Slim Variants**:
- More compact alert styling
- All alert types available in slim version

#### Modifiers (CSS Classes)

```css
.usa-alert--slim
.usa-alert--info
.usa-alert--warning
.usa-alert--error
.usa-alert--success
.usa-alert--validation
```

### Content Guidelines

**Do:**
- Use clear, concise language that explains the situation
- Provide actionable next steps when applicable
- Use sentence case for headings and body text

**Don't:**
- Use technical jargon or system error codes
- Stack multiple alerts of the same type
- Use alerts for promotional or marketing content
- Make alerts dismissable if action is required

### Accessibility Notes

- Alerts must use appropriate ARIA roles
- Color cannot be the only differentiator
- Icons must have alt text for screen readers
- Focus should move to alert for time-sensitive information

---

## Components Not Yet Extracted (Pages 9-32)

The following sections exist in the PDF but have not been extracted yet:

- **Buttons** (detailed specifications)
- **Cards** (layout patterns)
- **Navigation** (header, sidebar, breadcrumbs)
- **Modals & Dialogs**
- **Spacing & Layout Grid**
- **Icons & Imagery**
- **Accessibility Standards** (detailed WCAG requirements)
- **Logo Usage Guidelines**
- **Component Code Examples**

**To extract these**: Run the same Python script on pages 9-32 or manually review PDF.

---

## Recommendations for Current Code

### Immediate Actions Required

#### 1. Update Brand Colors

**CSS Variables to Change**:
```css
/* BEFORE (Current Code) */
--dcsa-navy: #002147          /* ❌ WRONG */
--dcsa-gold: #C5A030          /* ❌ WRONG */
--accent-teal: #009BB5        /* ❌ NOT IN OFFICIAL PALETTE */

/* AFTER (Official DCSA) */
--dcsa-navy: #002D5B          /* ✅ CORRECT - Primary Blue */
--dcsa-gold: #D4AF37          /* ✅ CORRECT - Legendary Gold */
--accent-teal: ???            /* ⚠️ DECIDE: Use Ocean Blue #0099D8 or Sky Blue #00A6DC? */
```

**Impact**: Visual differences will be noticeable (navy will be slightly brighter, gold more orange)

#### 2. Typography Migration

**Current**: Inter font (weights 400-700)  
**Official**: National Parks / Source Sans Pro  

**Options**:
- **Option A**: Migrate to National Parks (official USWDS font) - requires font file update
- **Option B**: Document Inter as approved deviation with rationale
- **Option C**: Submit Inter for official approval if preferred for technical reasons

#### 3. Teal Accent Decision

**Issue**: Code uses `#009BB5` (teal) extensively, but this color is NOT in official DCSA palette.

**Options**:
- **Replace with Ocean Blue** (`#0099D8`) - close match, official
- **Replace with Sky Blue** (`#00A6DC`) - also official
- **Replace with Accent-Cool tokens** - use USWDS accent-cool scale
- **Document as custom addition** - get stakeholder approval

**Affected Components**: 100+ usages across all dashboards (links, buttons, interactive elements)

#### 4. Alert/Status Color Verification

**Current code uses**:
- Success: `#2E7D32` (green)
- Error: `#C62828` (red)
- Warning: `#E65100` (orange)
- Info: `#1565C0` (blue)

**Verify these align with** USWDS semantic color tokens shown on pages 3-4 (success/error/warning scales).

### Migration Strategy

**Phase 1**: Update CSS variables in design-system/variables.css
**Phase 2**: Visual QA - screenshot comparison before/after
**Phase 3**: Playwright visual regression tests
**Phase 4**: Stakeholder approval on visual changes
**Phase 5**: Deploy to staging, then production

### Documentation Updates Needed

1. Update `DESIGN_SYSTEM.md` § Brand Colors with official values
2. Update `.claude/agents/dcsa-design-system.md` enforcement rules
3. Document teal accent decision in both files
4. Add "Migrated from unofficial values on [date]" notes

---

## References

**Official Source**: D:\Users\1254024380197005\maps\devrel\DCSA Ecosystem Style Guide.pdf

**Key Pages**:
- Page 1: Cover, USWDS 3.0 statement
- Page 2: Brand Colors (PRIMARY SOURCE FOR COLOR VALUES)
- Pages 3-4: Color System & Theme Tokens
- Page 5: Typography & Prose (National Parks font system)
- Page 6: Data Tables
- Page 7: Forms
- Page 8: Alerts & Notifications

**USWDS Documentation**: https://designsystem.digital.gov/

**Extracted Images**: D:\tmp\dcsa_page_*.png (pages 1-10)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-17 | Initial extraction from PDF pages 1-10. Identified critical discrepancies in brand colors and typography. |

---

## Next Steps

- [ ] Stakeholder review: Approve color changes (navy, gold) and teal decision
- [ ] Typography decision: Migrate to National Parks or document Inter approval
- [ ] Update CSS variables in variables.css with official values
- [ ] Visual QA before/after comparison
- [ ] Update DESIGN_SYSTEM.md and agent with official specifications
- [ ] Extract remaining PDF pages (9-32) for spacing, icons, logo guidelines
