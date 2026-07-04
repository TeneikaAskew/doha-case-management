# Data Portal Design System Documentation

**Date:** 2026-07-03  
**Purpose:** Comprehensive design system documentation for the MAPS Enterprise Portal  
**Audience:** Designers joining the project, understanding design decisions and component specifications

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Brand Identity](#brand-identity)
3. [Design Foundations](#design-foundations)
4. [Layout & Navigation](#layout--navigation)
5. [Component Library](#component-library)
6. [Data Visualization](#data-visualization)
7. [Interactive Patterns](#interactive-patterns)
8. [Feature-Specific Designs](#feature-specific-designs)
9. [Responsive Design](#responsive-design)
10. [Accessibility](#accessibility)

---

## Design Philosophy

### Core Principles

**1. Federal Government Aesthetic**
- Professional, trustworthy, and authoritative appearance
- DCSA brand compliance throughout
- Clean, data-dense interfaces appropriate for federal workforce
- No decorative elements or consumer-style embellishments

**2. Information Density with Clarity**
- Maximize data visibility without overwhelming users
- Dense tables and dashboards balanced with whitespace
- Clear visual hierarchy through typography and spacing
- Efficient use of screen real estate

**3. Consistency Across Applications**
- Unified design language across all portal features (FinCEN, NSC, Case Management, Data Loader)
- Shared component library ensures consistent behavior
- Predictable interaction patterns reduce cognitive load

**4. Performance & Accessibility First**
- Fast load times, minimal animations
- WCAG 2.1 AA compliance for accessibility
- Touch-friendly targets (minimum 44px) for mobile/tablet
- Keyboard navigation support throughout

---

## Brand Identity

### DCSA Official Branding

**Primary Brand Colors** (Official DCSA Style Guide)
```css
--dcsa-navy: #002D5B       /* Primary Blue - headers, primary buttons */
--dcsa-navy-light: #0A3A6B /* Hover states, secondary elements */
--dcsa-gold: #D4AF37       /* Legendary Gold - accents, active states */
--dcsa-gold-light: #F5E6B8 /* Gold backgrounds, highlights */
```

**Why These Colors?**
- Navy: Authority, trust, federal government identity
- Gold: Excellence, achievement, distinction (Legendary Gold is DCSA's signature accent)
- Updated 2026-06-18 to match official DCSA Style Guide specifications

**Secondary Accent Colors**
```css
--accent-teal: #009BB5      /* Interactive elements, links, info states */
--accent-teal-dark: #007A91 /* Hover states for teal elements */
```

**Why Teal?**
- Provides visual separation from navy without competing with brand colors
- High contrast for links and interactive elements
- Accessibility: meets WCAG contrast ratios against white backgrounds

### Logo & Seal

**DCSA Seal Usage**
- Location: Top-left of global header
- Size: Scales with header height (56px)
- Format: PNG with transparent background
- Path: `public/dcsa-seal.png`
- Fallback: Hidden on load error (no broken image icon)

**Application Title**
- "MAPS Enterprise Portal" — always appears next to seal
- Font: Inter, 20px, weight 600
- Color: White on navy header background

---

## Design Foundations

### Color System

#### Backgrounds
```css
--bg-page: #FFFFFF         /* Main page background */
--bg-card: #FFFFFF         /* Card/panel backgrounds */
--bg-card-hover: #F8F9FA   /* Card hover state */
--bg-header: var(--dcsa-navy)
--bg-sidebar: #FAFBFC      /* Sidebar background (off-white) */
--bg-input: #FFFFFF        /* Form input backgrounds */
--bg-table-header: #F8F9FB /* Table header row */
--bg-drop-zone: #FFFFFF    /* File upload drop zone */
--bg-filter-bar: var(--dcsa-navy)
```

**Design Decision:** White backgrounds maximize readability for data-dense interfaces. Off-white sidebar (#FAFBFC) provides subtle visual separation without harsh contrast.

#### Text Colors
```css
--text-primary: #1A2B3C    /* Headings, primary content */
--text-secondary: #5A6B7C  /* Labels, secondary content */
--text-muted: #8899AA      /* Hints, metadata, timestamps */
--text-inverse: #FFFFFF    /* Text on dark backgrounds */
--text-link: #009BB5       /* Links and interactive text */
```

**Hierarchy Rationale:**
- Primary: Dark blue-gray for strong readability
- Secondary: Medium gray for supporting text without competing
- Muted: Light gray for de-emphasized content
- Link: Teal for clear interactivity signals

#### Borders
```css
--border-light: #E4E7ED    /* Card borders, dividers */
--border-medium: #CBD2DB   /* Input borders, stronger separation */
--border-focus: #009BB5    /* Focus states (teal) */
```

#### Status Colors

**Success/Clear States**
```css
--status-clear: #2E7D32       /* Green - positive outcomes */
--status-clear-bg: #E8F5E9    /* Light green background */
```

**Alert/Error States**
```css
--status-alert: #C62828       /* Red - errors, high priority */
--status-alert-bg: #FFEBEE    /* Light red background */
```

**Warning States**
```css
--status-warning: #E65100     /* Orange - warnings */
--status-warning-bg: #FFF3E0  /* Light orange background */
```

**Caution States**
```css
--status-caution: #F57F17     /* Amber - caution */
--status-caution-bg: #FFF8E1  /* Light amber background */
```

**Info States**
```css
--status-info: #1565C0        /* Blue - informational */
--status-info-bg: #E3F2FD     /* Light blue background */
```

**Pending States**
```css
--status-pending: var(--dcsa-gold)  /* Gold - pending review */
--status-pending-bg: #FFF8E1         /* Light yellow background */
```

**High-Risk Human (HRH)**
```css
--status-hrh: #B71C1C         /* Deep red - critical risk */
--status-hrh-bg: #FFCDD2      /* Light red background */
```

**Usage Context:**
- Clear: Validated alerts, successful uploads, passed checks
- Alert: Failed validations, errors, dismissed alerts
- Warning: Data quality issues, moderate severity
- Caution: Review needed, lower severity issues
- Info: System notifications, help text
- Pending: Awaiting review, in-progress operations
- HRH: Critical security risk indicators

### Typography

**Font Families**
```css
--font-sans: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
--font-mono: 'Cascadia Code', 'Consolas', 'JetBrains Mono', monospace;
```

**Why Inter?**
- Designed for digital interfaces, optimized for screens
- Excellent readability at small sizes (critical for data tables)
- Wide character set, professional appearance
- Loaded from `/public/fonts/` for offline availability

**Why Cascadia Code?**
- Microsoft's developer font, familiar to technical users
- Clear distinction between similar characters (0/O, 1/l/I)
- Used for: S3 bucket paths, technical identifiers, code snippets

**Type Scale**

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| Page Title | 20px | 700 | 1.2 | Main page headings |
| Section Title | 16px | 600 | 1.3 | Section headings |
| Subsection | 14px | 600 | 1.4 | Card titles, subsections |
| Body | 14px | 400 | 1.5 | Primary content |
| Small | 13px | 500 | 1.4 | Labels, metadata |
| Tiny | 12px | 400 | 1.4 | Hints, captions |
| KPI Value | 28px | 700 | 1.2 | Dashboard metric values |

**Font Smoothing**
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```
Applied to body for crisp text rendering across browsers.

### Spacing System

**Base Unit:** 4px (used for all spacing calculations)

**Spacing Scale**
```css
/* Component Internal Spacing */
--spacing-xs: 4px    /* Tight spacing within components */
--spacing-sm: 8px    /* Small gaps, icon-text spacing */
--spacing-md: 12px   /* Default component padding */
--spacing-lg: 16px   /* Card padding, section spacing */
--spacing-xl: 20px   /* Large card padding */
--spacing-2xl: 24px  /* Section separation */
--spacing-3xl: 32px  /* Page padding */

/* Layout Spacing */
--gap-sm: 8px        /* Tight grid gaps */
--gap-md: 16px       /* Standard grid gaps */
--gap-lg: 24px       /* Section gaps */
```

**Consistent Application:**
- Cards: 20px padding (--spacing-xl)
- Sections: 24px margin-bottom (--spacing-2xl)
- Page content: 32px padding (--spacing-3xl)
- Form fields: 16px gap (--gap-md)

### Border Radius

```css
--radius-sm: 4px     /* Small elements, badges */
--radius-md: 8px     /* Cards, buttons, inputs */
--radius-lg: 12px    /* Large cards, modals */
--radius-pill: 12px  /* Pill-shaped elements */
```

**Design Decision:** Subtle rounding (4-12px) maintains professional appearance while softening harsh edges. No sharp corners (0px) or overly rounded elements (>16px).

### Shadows

```css
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.12);
--shadow-dropdown: 0 4px 12px rgba(0, 21, 48, 0.08);
```

**Usage:**
- Default cards: Subtle shadow (1px) for slight elevation
- Hover states: Deeper shadow (12px) to indicate interactivity
- Dropdowns/modals: Medium shadow with navy tint for depth

**Philosophy:** Minimal shadows preserve flat, professional aesthetic while providing depth cues.

### Layout Constants

```css
--header-height: 56px      /* Global header height */
--sidebar-width: 220px     /* Sidebar width (expanded) */
--touch-target-min: 44px   /* Minimum touch target size (mobile) */
```

---

## Layout & Navigation

### Overall Structure

**Three-Layer Hierarchy:**
```
┌─────────────────────────────────────┐
│ Global Header (56px fixed)          │ ← DCSA seal, title, user, environment
├─────────┬───────────────────────────┤
│ Sidebar │ Main Content Area         │
│ (220px) │ (flexible width)          │
│ fixed   │ - Page header             │
│         │ - Content sections        │
│         │ - Cards & components      │
└─────────┴───────────────────────────┘
```

### Global Header

**Specifications:**
- **Height:** 56px (fixed)
- **Background:** `var(--dcsa-navy)` (#002D5B)
- **Position:** Fixed top, spans full width
- **Z-index:** 100 (above all content)

**Left Section:**
- DCSA seal (PNG, scales to header height)
- App title: "MAPS Enterprise Portal" (20px, weight 600, white)

**Right Section (flex, gap 16px):**
- Environment selector (test/prod dropdown)
- Email link button ("Email EIAS")
- User name display
- Sign Out button

**Environment Selector:**
- **Locked by default** (FiLock icon + environment text)
- **Unlocked when:** localhost OR user keyId = `cmy96sunok`
- **Dropdown:** Native select, 13px text, navy border
- **Purpose:** Prevent accidental environment switching in production

**User Display:**
```css
.header-user-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
}
```

**Sign Out Button:**
```css
.header-signout {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 13px;
  transition: background 0.2s;
}
.header-signout:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

### Sidebar Navigation

**Specifications:**
- **Width:** 220px (expanded), 56px (collapsed)
- **Position:** Fixed left, starts below header (top: 56px)
- **Background:** `var(--bg-card)` (#FFFFFF)
- **Shadow:** `2px 0 8px rgba(0, 21, 48, 0.06)` (subtle right shadow)
- **Overflow:** Auto (scrollable if content exceeds viewport)

**Collapse Button:**
- Top of sidebar
- Icon: FiChevronLeft (expanded) / FiChevronRight (collapsed)
- Padding: 10px
- Border-radius: 4px
- Hover: Light background rgba(0, 33, 71, 0.04)

**Navigation Items:**

**Structure:**
```
┌─ Main Navigation ────┐
│ • MAPS Platform       │
│ • Use Cases           │
│ • Data Loader         │
│ • FinCEN RADAR        │
│ • Case Management     │
│ • PV Ops              │
├──────────────────────┤ ← Divider (auto margin-top)
│ • Admin               │
│ • Settings            │
│ • Help                │
└──────────────────────┘
```

**Item Specifications:**
```css
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  border-left: 3px solid transparent;
  transition: all 0.15s;
}

.sidebar-item:hover {
  color: var(--dcsa-navy);
  background: rgba(0, 33, 71, 0.04);
}

.sidebar-item.active {
  color: var(--dcsa-navy);
  font-weight: 600;
  background: var(--dcsa-gold-light);  /* #F5E6B8 */
  border-left-color: var(--dcsa-gold); /* #D4AF37 */
}
```

**Icons:**
- Size: 18px (icon container), 15px (font-size)
- Library: `react-icons/fi` (Feather Icons)
- Style: Outline/line icons for consistency
- Alignment: Centered within 18px container

**Icon Mapping:**
| Feature | Icon | Rationale |
|---------|------|-----------|
| MAPS Platform | FiHome | Landing/home metaphor |
| Use Cases | FiLayers | Multiple layers/categories |
| Data Loader | FiUpload | File upload functionality |
| FinCEN RADAR | FiActivity | Alert monitoring/activity |
| Case Management | FiUser | Person-centric view |
| PV Ops | FiList | Document list/reference |
| Admin | FiBarChart2 | Analytics/metrics |
| Settings | FiSettings | Configuration |
| Help | FiHelpCircle | Support/documentation |

**Collapsed State:**
- Width: 56px
- Items centered (justify-content: center)
- Labels hidden (opacity: 0, width: 0)
- Icons remain visible
- Tooltip on hover shows full label

**Mobile Behavior (<1024px):**
- Sidebar hidden by default (translateX(-100%))
- Opens with overlay backdrop
- Toggle button appears (fixed, top: 68px, left: 12px)

### Main Content Area

**Layout:**
```css
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width); /* 220px */
  padding: 32px;
  max-width: 1600px;
  width: 100%;
  transition: margin-left 0.2s ease;
}
```

**Content Width:**
- Maximum: 1600px (prevents overly wide content on large screens)
- Padding: 32px (all sides)
- Adjusts when sidebar collapses (margin-left: 0)

**Page Header Pattern:**
```css
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--dcsa-navy);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}
```

**Typical page structure:**
1. Page header (title + optional actions)
2. KPI cards row (if dashboard)
3. Content sections (cards, tables, charts)
4. Footer/pagination (if needed)

### Routing Architecture

**Route Structure:**
```javascript
'/' → '/maps' (redirect)
'/maps' → Landing page (public)
'/use-cases/*' → Use Cases app (public)
'/fincen/*' → FinCEN RADAR (authenticated)
'/data-loader/*' → Data Loader (authenticated)
'/nsc/*' → NSC Dashboard (authenticated)
'/case-management/*' → Whole Person View (authenticated)
'/vulnerability/*' → Vulnerability Dashboard (authenticated)
'/pv-ops' → PV Ops AI Chat (authenticated)
'/admin' → Admin dashboard (authenticated)
'/settings' → User settings (authenticated)
'/help' → Help documentation (authenticated)
```

**Auth Model:**
- Public routes: `/maps`, `/use-cases`
- Authenticated routes: All feature apps + admin/settings/help
- Bypass: `REACT_APP_BYPASS_AUTH=true` (testing only)
- CAC/mTLS authentication via API Gateway

**Feature App Pattern:**
Each major feature (FinCEN, Data Loader, NSC, Case Management) has:
- Dedicated folder: `src/features/{feature-name}/`
- Own header component (replaces global header)
- Own sidebar component (replaces global sidebar)
- Sub-routing within feature namespace
- Isolated state management (Context API)

**Why Separate Headers/Sidebars?**
- Features have distinct navigation needs
- Prevents global header clutter
- Allows feature-specific branding/actions
- Cleaner code separation

---

## Component Library

### Buttons

#### Primary Button
**Usage:** Main actions, form submissions, primary CTAs

**Specifications:**
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  background: var(--dcsa-navy);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-sm); /* 4px */
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--dcsa-navy-light);
  box-shadow: 0 2px 8px rgba(0, 33, 71, 0.2);
  transform: translateY(-1px); /* Subtle lift */
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

**States:**
- **Default:** Navy background, white text
- **Hover:** Lighter navy, shadow, 1px lift
- **Active:** Returns to baseline (no lift)
- **Disabled:** 60% opacity, no pointer cursor
- **Focus:** (Inherits browser outline, consider custom focus ring)

#### Secondary Button
**Usage:** Secondary actions, cancel buttons, alternative CTAs

**Specifications:**
```css
.btn-secondary {
  padding: 8px 16px;
  background: var(--accent-teal);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--accent-teal-dark);
  box-shadow: 0 2px 8px rgba(0, 155, 181, 0.2);
  transform: translateY(-1px);
}
```

**When to Use:**
- Alternative actions (e.g., "Upload" vs. "Submit")
- Actions that don't commit/submit data
- Navigation buttons

#### Ghost Button
**Usage:** Tertiary actions, cancel, dismiss

**Specifications:**
```css
.btn-ghost {
  padding: 8px 16px;
  background: transparent;
  color: var(--dcsa-navy);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--bg-page);
  border-color: var(--dcsa-navy);
}
```

**When to Use:**
- Cancel buttons
- Less important actions
- Actions that might undo changes

#### Icon Buttons
**Usage:** Toolbar actions, inline actions, collapse toggles

**Example:** Sidebar toggle, copy button, clear chat

**Specifications:**
```css
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.icon-btn:hover {
  color: var(--text-primary);
  background: rgba(0, 33, 71, 0.04);
}
```

**Accessibility:** Always include `title` attribute for tooltip/screen reader.

### Cards

#### Standard Card
**Usage:** Content containers, grouping related information

**Specifications:**
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md); /* 8px */
  padding: 20px;
  margin-bottom: 24px;
}

.card:hover {
  box-shadow: var(--shadow-card-hover);
}
```

**Hover Effect:** Deeper shadow on hover indicates interactivity (if clickable).

**Non-Interactive Cards:** Remove `:hover` if card is not clickable.

#### Initiative Card (Data Loader)
**Usage:** Product/initiative selection cards

**Specifications:**
```css
.initiative-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 28px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.initiative-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent-teal);
  box-shadow: var(--shadow-card-hover), 0 0 0 1px var(--accent-teal);
  transform: translateY(-2px);
}
```

**Icon Container:**
```css
.initiative-card-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg); /* 12px */
  background: #EBF0F7; /* Light blue-gray */
  color: var(--dcsa-navy);
  font-size: 24px;
}
```

**Content:**
- Title: 16px, weight 600
- Description: 13px, secondary color
- Bucket path: 11px mono, muted, light background badge

**Interaction:**
- Hover: Teal border, shadow, 2px lift
- Active: Returns to baseline

#### KPI Card
**Usage:** Dashboard metrics, key performance indicators

**Specifications:**
```css
.kpi-card {
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.kpi-card.clickable:hover {
  box-shadow: 0 2px 8px rgba(0, 33, 71, 0.12);
  border-color: var(--dcsa-navy);
}

.kpi-card.clickable.active {
  border-color: #1976D2; /* Material blue */
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.25);
}
```

**Structure:**
```html
<div class="kpi-card">
  <div class="kpi-accent" style="background: {accentColor}"></div>
  <div class="kpi-content">
    <div class="kpi-value">{value}</div>
    <div class="kpi-label">{label}</div>
    <!-- Optional progress bar -->
  </div>
</div>
```

**Accent Bar:**
- Width: 4px (left edge)
- Height: 100%
- Color: Varies by status/category

**Content:**
```css
.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.kpi-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-top: 4px;
}
```

**Grid Layout:**
```css
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
```

**Progress Bar (optional):**
```css
.kpi-progress {
  margin-top: 10px;
}

.kpi-progress-track {
  height: 4px;
  background: var(--border-light);
  border-radius: 2px;
  overflow: hidden;
}

.kpi-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

**When to Use:**
- Dashboard summaries
- Metric comparisons
- Clickable filters (active state)

### Forms

#### Form Group Pattern
```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 2px;
}
```

#### Text Input
```css
.form-input {
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-card);
  transition: border-color 0.15s;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-teal);
}

.form-input:disabled {
  background: #F5F6F8;
  color: var(--text-muted);
}
```

**States:**
- **Default:** Light border, white background
- **Focus:** Teal border, no outline
- **Disabled:** Gray background, muted text
- **Error:** Red border (add `.error` class)

#### Select Dropdown
```css
.form-select {
  /* Same as .form-input */
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-card);
  transition: border-color 0.15s;
}
```

**Native vs. Custom:**
- Use native `<select>` for simplicity
- Custom dropdowns only if advanced features needed (search, multi-select)

#### File Upload (Drop Zone)

**Specifications:**
```css
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  min-height: 280px;
  padding: 40px;
  background: var(--bg-card);
  border: 2px dashed var(--border-medium);
  border-radius: var(--radius-lg); /* 12px */
  transition: all 0.2s ease;
}

.drop-zone.dragging {
  border-color: var(--accent-teal);
  background: var(--status-clear-bg);
  box-shadow: 0 0 0 3px rgba(0, 155, 181, 0.15);
}
```

**Icon:**
```css
.drop-zone-icon {
  font-size: 48px;
  color: var(--dcsa-navy);
  opacity: 0.5;
}
```

**Text:**
- Main: 16px, weight 500, secondary color
- Hint: 12px, muted color

**Divider:**
```css
.drop-zone-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 60%;
  color: var(--text-muted);
  font-size: 13px;
}

.drop-zone-divider::before,
.drop-zone-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-medium);
}
```

**File Selected State:**
```css
.file-selected-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--bg-page);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  width: 100%;
}
```

**Clear Button:**
- Icon: FiX
- Size: 18px
- Color: Muted → Red on hover
- Position: Margin-left auto (right edge)

### Tables

#### Standard Data Table

**Specifications:**
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background: var(--bg-table-header);
  padding: 10px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid var(--border-light);
  white-space: nowrap;
}

.data-table td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-light);
  white-space: nowrap;
  color: var(--text-primary);
}

.data-table tbody tr:hover {
  background: #F8F9FB;
}
```

**Container:**
```css
.table-section {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 24px;
}

.table-wrapper {
  overflow-x: auto; /* Horizontal scroll on small screens */
}
```

**Design Decisions:**
- **Uppercase headers:** Reduces visual weight, distinguishes from data
- **Light background:** Headers slightly different from white rows
- **Hover effect:** Light gray background on row hover for scannability
- **Nowrap:** Prevents text wrapping in cells (horizontal scroll instead)

**When to Use:**
- Alert lists (FinCEN)
- Download history (Data Loader)
- Transaction logs (NSC)
- Any tabular data display

### Status Badges

**Usage:** Inline status indicators (alert outcome, file status, etc.)

**Specifications:**
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid;
  background: transparent;
}
```

**Variants:**
```css
.status-badge.success {
  border-color: var(--status-clear);
  color: var(--status-clear);
}

.status-badge.error {
  border-color: var(--status-alert);
  color: var(--status-alert);
}

.status-badge.warning {
  border-color: var(--status-warning);
  color: var(--status-warning);
}

.status-badge.info {
  border-color: var(--status-info);
  color: var(--status-info);
}

.status-badge.pending {
  border-color: var(--status-pending);
  color: var(--status-pending);
}
```

**Design Decision:** Transparent background with colored border/text creates lightweight, non-distracting badges. Filled backgrounds would compete with surrounding content.

### Loading States

#### Loading Bar Animation
```css
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 48px 24px;
  text-align: center;
}

.loading-bar {
  width: 200px;
  height: 4px;
  background: var(--border-light);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 16px;
  position: relative;
}

.loading-bar-fill {
  width: 40%;
  height: 100%;
  background: var(--accent-teal);
  border-radius: 2px;
  animation: slide-bar 1.5s ease-in-out infinite;
}

@keyframes slide-bar {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}
```

**When to Use:** Page-level loading (dashboard data, initial page load)

#### Loading Dots
```css
.loading-dots .dot {
  animation: pulse 1.4s ease-in-out infinite;
  opacity: 0;
}

.loading-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.loading-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 60%, 100% {
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
}
```

**When to Use:** Inline loading (chat messages, waiting for response)

**Example Usage:**
```html
<span class="loading-dots">
  Processing your question
  <span class="dot">.</span>
  <span class="dot">.</span>
  <span class="dot">.</span>
</span>
```

#### Error Banner
```css
.error-banner {
  background: #FFF3F0;
  border: 1px solid #FFCDD2;
  border-radius: var(--radius-md);
  padding: 20px 24px;
  margin: 24px 0;
  color: #C62828;
  font-size: 14px;
}
```

**When to Use:** Non-critical errors, API failures, validation errors

---

## Data Visualization

### Chart Library

**Technology:** Recharts (React wrapper for D3.js)
- Declarative API, easy to use
- Responsive out of the box
- Consistent styling across chart types

**Common Configuration:**
```javascript
<ResponsiveContainer width="100%" height={300}>
  {/* Chart component */}
</ResponsiveContainer>
```

**Tooltip Styling:**
```javascript
<Tooltip
  contentStyle={{
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E7ED',
    borderRadius: '4px',
    fontSize: '13px'
  }}
/>
```

**Legend Styling:**
```javascript
<Legend
  wrapperStyle={{ fontSize: '13px' }}
  iconType="circle" // or "line" for line charts
/>
```

### Line Chart (Time Series)

**Usage:** Alert trends over time, time-based metrics

**Component:** `AlertTimeSeriesChart.jsx`

**Specifications:**
```javascript
<LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7ED" />
  <XAxis
    dataKey="date"
    tick={{ fontSize: 12, fill: '#5A6B7C' }}
    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
  />
  <YAxis tick={{ fontSize: 12, fill: '#5A6B7C' }} />
  <Tooltip />
  <Legend />
  <Line
    type="monotone"
    dataKey="alerts"
    stroke="#009BB5"
    strokeWidth={2}
    name="Total Alerts"
    dot={{ fill: '#009BB5', r: 4 }}
  />
</LineChart>
```

**Line Colors:**
- Total Alerts: Teal (#009BB5)
- Validated: Green (#2E7D32)
- Dismissed: Red (#C62828)
- Referred: Gold (#D4AF37)

**Design Decisions:**
- **Monotone curves:** Smooth curves for readability
- **Dot markers:** 3-4px radius for data point visibility
- **Grid:** Light dashed grid (3-3 pattern, #E4E7ED) for reference without clutter
- **Axis text:** 12px, secondary color for de-emphasis

### Pie Chart (Distribution)

**Usage:** Risk distribution, category breakdowns

**Component:** `RiskDistributionPie.jsx`

**Specifications:**
```javascript
<PieChart>
  <Pie
    data={chartData}
    cx="50%"
    cy="50%"
    labelLine={false}
    label={({ name, percent }) => `${name.split(' ')[1]}: ${(percent * 100).toFixed(0)}%`}
    outerRadius={80}
    fill="#8884d8"
    dataKey="value"
  >
    {chartData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
```

**Color Palette:**
- High Risk (Seriousness C): Red (#C62828)
- Moderate Risk (Seriousness B): Orange (#E65100)
- Low Risk (Seriousness A): Amber (#F57F17)

**Label Format:** Category abbreviation + percentage (e.g., "C: 23%")

**Design Decisions:**
- **No label lines:** Cleaner appearance, relies on legend
- **Percentage labels:** On-slice labels show proportion directly
- **Outer radius 80px:** Balanced size for typical chart card
- **Legend below:** Lists full category names with color swatches

### Bar Chart

**Usage:** Alert type distribution, data quality metrics

**Components:** `AlertTypeBar.jsx`, `DataQualityBar.jsx`

**Specifications:**
```javascript
<BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7ED" />
  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5A6B7C' }} />
  <YAxis tick={{ fontSize: 12, fill: '#5A6B7C' }} />
  <Tooltip />
  <Legend />
  <Bar dataKey="count" fill="#009BB5" />
</BarChart>
```

**Bar Colors:**
- Primary: Teal (#009BB5)
- Stacked bars: Use status colors (green, red, orange, amber)

**Design Decisions:**
- **Vertical bars:** Standard orientation for category comparison
- **Single fill color:** Teal for simplicity when not status-coded
- **Grid:** Same as line charts for consistency

### Chart Container Pattern

**Specifications:**
```css
.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 24px;
}

.chart-header {
  margin-bottom: 16px;
}

.chart-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--dcsa-navy);
  margin: 0;
}

.chart-body {
  /* Chart renders here */
}
```

**Grid Layout:**
```css
.dashboard-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.chart-half {
  /* Spans 1 column (50% width) */
}

.chart-full {
  grid-column: 1 / -1; /* Spans both columns (100% width) */
}
```

**When to Use:**
- **Half-width:** Pie charts, small bar charts, single metrics
- **Full-width:** Time series, large bar charts, complex visualizations

---

## Interactive Patterns

### Chat Interface (PV-Ops AI)

**Layout Structure:**
```
┌──────────────────────────────────────────────┐
│ Conversations Sidebar (280px, collapsible)   │
│ ┌──────────────────────────────────────────┐ │
│ │ Documents Section (collapsible)          │ │
│ ├──────────────────────────────────────────┤ │
│ │ Chat Section (flex-grow)                 │ │
│ │ ┌────────────────────────────────────┐   │ │
│ │ │ Messages Area (scroll)             │   │ │
│ │ ├────────────────────────────────────┤   │ │
│ │ │ Input Form (fixed bottom)          │   │ │
│ └─┴────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

#### Conversations Sidebar

**Specifications:**
```css
.conversations-sidebar {
  width: 280px;
  background: #f7fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, margin-left 0.3s ease;
  flex-shrink: 0;
}

.conversations-sidebar.collapsed {
  width: 0;
  margin-left: -280px;
}
```

**Sidebar Header:**
- Title: "Conversations" (16px, weight 600)
- Toggle button: FiChevronLeft/Right icon
- Border-bottom: 1px solid #e2e8f0

**New Conversation Button:**
```css
.new-conversation-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: calc(100% - 2rem);
  margin: 1rem;
  padding: 0.75rem;
  background: #3182ce; /* Blue */
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.new-conversation-btn:hover {
  background: #2c5aa0;
}
```

**Conversation Item:**
```css
.conversation-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.conversation-item:hover {
  border-color: #3182ce;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.conversation-item.active {
  background: #ebf8ff;
  border-color: #3182ce;
  border-width: 2px;
}
```

**Content:**
- Icon: FiMessageSquare (teal)
- Title: 14px, weight 500, truncated
- Date: 12px, gray, relative format (e.g., "2h ago", "3d ago")

#### Documents Section

**Collapsible Panel:**
```css
.documents-section {
  /* Part of main content, above chat */
}

.documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.collapse-toggle-btn {
  padding: 0.5rem 1rem;
  background: #edf2f7;
  color: #4a5568;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
```

**Document Grid:**
```css
.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
```

**Document Card:**
```css
.document-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.2s;
}

.document-card:hover {
  border-color: #3182ce;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
```

**Card Content:**
- Icon: FiFileText (24px, teal)
- Title: 16px, weight 600
- Size: 12px, gray (e.g., "180 KB", "14.8 MB")
- Description: 14px, secondary color
- Topics: 12px, gray, light background badge
- Download button: Full-width, teal, FiDownload icon

**Why Collapsible?**
- Documents are reference material, not primary interaction
- Collapsed state gives more room for chat
- Users can expand when needed

#### Chat Section

**Specifications:**
```css
.chat-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 600px;
  transition: height 0.3s ease;
}

.chat-section.expanded {
  height: calc(100vh - 220px);
  min-height: 700px;
}
```

**Expands when:** Documents section is collapsed (more vertical space)

**Chat Header:**
```css
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}
```

**Content:**
- Title: "Ask AI Assistant" (20px, weight 600)
- Subtitle: Help text (14px, gray)
- Clear Chat button: Red border/text, FiX icon (conditionally shown)

#### Chat Messages

**Message Container:**
```css
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
```

**Message Bubble:**
```css
.chat-message {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  max-width: 85%;
}

.chat-message-user {
  align-self: flex-end;
  background: #3182ce; /* Blue */
  color: white;
}

.chat-message-assistant {
  align-self: flex-start;
  background: #f7fafc; /* Light gray */
  border: 1px solid #e2e8f0;
}

.chat-message-error {
  background: #fff5f5; /* Light red */
  border-color: #fc8181;
  color: #c53030;
}
```

**Message Header:**
- Role: "You" or "AI Assistant" (12px, uppercase, weight 600, letter-spacing 0.5px)
- Time: Localized time string (12px, opacity 0.7)

**Message Content:**
- User messages: Plain text (15px)
- Assistant messages: Rendered with ReactMarkdown (supports headings, lists, bold, code)

**Markdown Styling (Assistant Messages):**
```css
/* Tight line-height for compact rendering */
.message-content {
  font-size: 0.9375rem; /* 15px */
  line-height: 1.3;
}

/* Minimal spacing between paragraphs */
.message-content p + p {
  margin-top: 0.0625rem; /* 1px */
}

/* Lists */
.message-content ul,
.message-content ol {
  margin: 0;
  padding-left: 1.75rem;
  line-height: 1.3;
}

.message-content li {
  margin: 0;
  padding-left: 0.25rem;
  line-height: 1.3;
}

/* Strong text */
.message-content strong {
  font-weight: 600;
  color: #2d3748;
}

/* Inline code */
.message-content code {
  background: #f7fafc;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #c53030; /* Red */
}

/* Code blocks */
.message-content pre {
  background: #f7fafc;
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.75rem 0;
}
```

**Typing Animation:**
```css
.message-content.typing::after {
  content: '▊';
  animation: blink 1s step-end infinite;
  margin-left: 2px;
  color: #3182ce;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
```

**Copy Button:**
```css
.copy-answer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding: 0.375rem 0.75rem;
  background: #edf2f7;
  color: #4a5568;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
```

**Sources Display:**
```css
.message-sources {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.875rem;
}

.message-sources li::before {
  content: "•";
  margin-right: 0.5rem;
  color: #3182ce;
}
```

**Empty State:**
```css
.chat-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #718096;
}
```

**Content:**
- Icon: FiFileText (48px, light gray)
- Heading: "No messages yet"
- Prompt: "Try asking:"
- Example questions list (14px, light background, teal left border)

#### Chat Input

**Specifications:**
```css
.chat-input-form {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.9375rem;
  background: white;
  transition: border-color 0.2s;
}

.chat-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.chat-submit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.chat-submit-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}
```

**Behavior:**
- Enter key: Submit (Shift+Enter for new line)
- Disabled while loading
- Clears on submit

**Design Decisions:**
- **Blue color scheme:** Distinct from DCSA navy, emphasizes AI assistant identity
- **Tight line-height:** Maximizes content density for long responses
- **Markdown support:** Rich formatting for structured answers
- **Typing animation:** Visual feedback during streaming (currently disabled due to API Gateway limitations)
- **Sources citation:** Transparency into answer provenance

### Collapsible Sections (FinCEN)

**Component:** `CollapsibleSection.jsx`

**Usage:** Expandable panels for detailed information (alert checks, subject details)

**Specifications:**
```css
.collapsible-section {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  overflow: hidden;
}

.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-card);
  cursor: pointer;
  transition: background 0.15s;
}

.collapsible-header:hover {
  background: var(--bg-card-hover);
}

.collapsible-content {
  padding: 20px;
  border-top: 1px solid var(--border-light);
}
```

**Header Content:**
- Title: 16px, weight 600
- Chevron icon: FiChevronDown (rotates 180° when open)

**Animation:**
```css
.collapsible-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.collapsible-section.open .collapsible-content {
  max-height: 2000px; /* Arbitrary large value */
}
```

**When to Use:**
- Long-form content that would crowd the page
- Secondary information users may not always need
- Grouping related fields (e.g., "Subject Details", "Filer Information")

### Modal/Dialog Pattern

**Usage:** Confirmation dialogs, detail overlays

**Native `window.confirm()` for simple confirmations:**
```javascript
if (window.confirm('Clear all messages?')) {
  setMessages([]);
}
```

**Custom Modal (if needed):**
```css
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.modal-header {
  margin-bottom: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--dcsa-navy);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
```

**Accessibility:**
- Focus trap (Tab cycles within modal)
- ESC key closes modal
- Click backdrop closes modal
- ARIA attributes: `role="dialog"`, `aria-modal="true"`

---

## Feature-Specific Designs

### FinCEN RADAR

**Color Scheme:** Uses standard portal colors

**Key Components:**

#### Alert List Page
- KPI cards at top (total, validated, dismissed, HRH)
- Filter bar below KPIs
- Data table with alert rows
- Pagination at bottom

#### Alert Detail Page
- Subject identity card (photo, name, SSN, org)
- Risk score card (radar-style visualization)
- Collapsible check sections (10+ checks)
- Analyst action panel (sticky footer)

#### KV Grid (Key-Value Grid)
**Component:** `KVGrid.jsx`

**Usage:** Displaying structured data in a grid layout

**Specifications:**
```javascript
<div className="kv-grid">
  <div className="kv-item">
    <span className="kv-key">First Name:</span>
    <span className="kv-value">{value}</span>
  </div>
  {/* More items */}
</div>
```

```css
.kv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.kv-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kv-key {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kv-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}
```

**When to Use:** Displaying enrollee data, subject details, filer information

#### Risk Score Card
**Component:** `RiskScoreCard.jsx`

**Design:** Circular radar-style visualization with risk level indicator

**Structure:**
- Large circular border (status color)
- Risk score in center (large text)
- Risk level label below score
- Status-based coloring (HRH = red, high = orange, medium = amber, low = green)

**Specifications:**
```css
.risk-score-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 8px solid {statusColor};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.risk-score-value {
  font-size: 48px;
  font-weight: 700;
  color: var(--text-primary);
}

.risk-score-label {
  font-size: 16px;
  font-weight: 600;
  color: {statusColor};
  text-transform: uppercase;
}
```

### Data Loader

**Color Scheme:** Standard portal colors with teal accents

**Key Components:**

#### Upload Page
- Initiative cards grid (enrollment, unenrollment, etc.)
- Operation selector (radio buttons)
- File uploader (drop zone)
- Upload progress (progress bar + status)
- Upload success (results preview)

#### Downloads Page
- Search/filter bar
- Downloads table
- Export button (Excel/CSV)

#### Alerts Page
- Real-time alert polling (5-second interval)
- Alert cards grid
- Color-coded by severity
- Click to view details

#### Upload Progress Component
**Component:** `UploadProgress.jsx`

**Specifications:**
```css
.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
}

.upload-progress-bar {
  width: 100%;
  max-width: 400px;
  height: 8px;
  background: var(--border-light);
  border-radius: 4px;
  overflow: hidden;
}

.upload-progress-fill {
  height: 100%;
  background: var(--accent-teal);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.upload-progress-text {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
}
```

**Stages:**
1. Uploading file... (0-33%)
2. Processing... (33-66%)
3. Saving results... (66-100%)

#### Upload Success Component
**Component:** `UploadSuccess.jsx`

**Specifications:**
```css
.upload-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px;
}

.upload-success-icon {
  font-size: 64px;
  color: var(--status-clear);
}

.upload-success-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.upload-success-message {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
}
```

**Actions:**
- "View My Uploads" button (primary)
- "Upload Another File" button (secondary)

### NSC Dashboard

**Color Scheme:** Standard portal colors

**Key Components:**

#### Dashboard Page
- KPI cards (total transactions, pending, completed, failed)
- Transaction table
- School code lookup widget
- Retry/cancel actions

#### Transaction Detail
- Request details card
- Response details card
- Error details (if failed)
- Retry button

### Case Management (Whole Person View)

**Color Scheme:** Standard portal colors with emphasis on risk indicators

**Key Components:**

#### Overview Panel
**Component:** `OverviewPanel.jsx`

**Layout:**
- Subject identity at top
- Risk score card (prominent)
- Alert summary cards grid
- SEAD guideline mapper
- Disposition tracker

#### Alert Summary Cards
**Component:** `AlertSummaryCards.jsx`

**Design:** Small cards showing alert counts by type

**Specifications:**
```css
.alert-summary-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-left: 4px solid {accentColor};
  border-radius: var(--radius-md);
}

.alert-count {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.alert-type {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-top: 4px;
}
```

**Colors:**
- FinCEN: Red (#C62828)
- Criminal: Orange (#E65100)
- Financial: Amber (#F57F17)
- Other: Teal (#009BB5)

### Use Cases (Public)

**Color Scheme:** Purple/violet accent (#8B5CF6) for distinct identity

**Key Components:**

#### Kanban Board
**Component:** `UseCaseKanbanBoard.jsx`

**Columns:** Submitted → Under Review → Approved → In Progress → Completed

**Card Design:**
- Priority badge (top-right)
- Title (16px, weight 600)
- Type badge
- Submitter name
- Date
- Drag handle icon

**Priority Colors:**
- Critical: Red
- High: Orange
- Medium: Amber
- Low: Green

#### Type Selector
**Component:** `UseCaseTypeSelector.jsx`

**Radio buttons with icons:**
- New Feature: FiPlus
- Enhancement: FiTrendingUp
- Bug Fix: FiAlertCircle
- Documentation: FiFileText

#### Chatbot Widget
**Component:** `UseCaseChatbot.jsx`

**Floating chat button (bottom-right corner):**
- Icon: FiMessageSquare
- Background: Purple
- Opens chat panel overlay

---

## Responsive Design

### Breakpoints

```css
/* Desktop: Default (> 1024px) */
/* Tablet: 768px - 1024px */
@media (max-width: 1024px) {
  /* Sidebar collapses to mobile toggle */
  /* Main content: margin-left: 0 */
  /* Padding reduced to 24px 20px */
}

/* Mobile: 640px - 768px */
@media (max-width: 768px) {
  /* Main content padding: 20px 16px */
  /* KPI grid: 3 columns → 2 columns */
  /* Forms: font-size 16px (prevent iOS zoom) */
  /* Touch targets: min-height 44px */
}

/* Small mobile: 480px - 640px */
@media (max-width: 640px) {
  /* Main content padding: 16px 12px */
  /* KPI grid: 2 columns */
  /* Card padding: 16px */
}

/* Extra small: < 480px */
@media (max-width: 480px) {
  /* Main content padding: 12px 8px */
  /* KPI grid: 1 column */
  /* Card padding: 12px */
  /* Font sizes reduced */
}
```

### Mobile Adaptations

#### Sidebar
- Hidden by default (translateX(-100%))
- Opens with toggle button (fixed position)
- Overlay backdrop when open
- Tap backdrop to close

#### KPI Cards
- Desktop: 4-5 cards per row (auto-fit, min 180px)
- Tablet: 3 cards per row
- Mobile: 2 cards per row
- Small mobile: 1 card per row (stacked)

#### Tables
- Horizontal scroll (overflow-x: auto)
- No column hiding (preserve all data)
- Wrapper with overflow container

#### Chat Interface
- Conversations sidebar: Stacks above chat (not side-by-side)
- Max height 200px for conversations list
- Chat section height: 500px (reduced from 600px)

#### Forms
- Font size 16px on mobile (prevents iOS zoom on focus)
- Full-width buttons
- Increased padding for touch targets

### Touch Targets

**Minimum size: 44px x 44px** (WCAG 2.5.5)

Applied to:
- Buttons
- Sidebar items
- Links (when standalone)
- Input fields (height)
- Icon buttons

```css
@media (max-width: 768px) {
  button,
  .sidebar-item,
  .sidebar-link,
  input,
  select,
  a.btn-primary,
  a.btn-secondary {
    min-height: var(--touch-target-min); /* 44px */
  }
}
```

---

## Accessibility

### Color Contrast

**All text meets WCAG 2.1 AA standards:**
- Primary text (#1A2B3C) on white: 13.5:1 (AAA)
- Secondary text (#5A6B7C) on white: 7.2:1 (AA)
- Muted text (#8899AA) on white: 4.8:1 (AA, large text only)

**Status colors:**
- All status colors tested against white backgrounds
- Red (#C62828), Green (#2E7D32), Orange (#E65100) all meet AA standards
- Gold (#D4AF37) meets AA for large text (18px+)

### Keyboard Navigation

**Focus indicators:**
- Browser default outline (consider custom focus ring)
- Teal border on form inputs (visible focus state)

**Tab order:**
- Logical top-to-bottom, left-to-right
- Skip links (consider adding "Skip to main content")

**Keyboard shortcuts:**
- Enter: Submit forms
- ESC: Close modals (if implemented)
- Arrow keys: Navigate lists (if implemented)

### Screen Readers

**ARIA labels:**
- `aria-label` on icon-only buttons
- `aria-labelledby` on sections
- `aria-describedby` for form hints

**Semantic HTML:**
- `<nav>` for navigation
- `<main>` for main content
- `<header>` for page headers
- `<button>` for clickable actions (not `<div>`)
- `<table>` for tabular data

**Alt text:**
- DCSA seal: "DCSA Seal"
- Icons: Meaningful labels, not "icon" or "image"

### Form Accessibility

**Labels:**
- All inputs have associated `<label>` elements
- `for` attribute matches input `id`

**Hints:**
- Descriptive help text for complex fields
- Error messages announce to screen readers

**Validation:**
- Real-time validation (on blur, not on keystroke)
- Clear error messages
- Focus on first error field on submit

---

## Appendix

### Icon Library: React Icons (Feather)

**Package:** `react-icons/fi` (Feather Icons)

**Common Icons:**
| Icon | Component | Usage |
|------|-----------|-------|
| Upload | FiUpload | File upload, data import |
| Download | FiDownload | File download, export |
| User | FiUser | User profile, subject identity |
| Lock | FiLock | Security, locked state |
| AlertCircle | FiAlertCircle | Warnings, alerts |
| CheckCircle | FiCheckCircle | Success, validation |
| XCircle | FiXCircle | Errors, failures |
| HelpCircle | FiHelpCircle | Help, support |
| Settings | FiSettings | Configuration |
| BarChart2 | FiBarChart2 | Analytics, metrics |
| Activity | FiActivity | Monitoring, activity feed |
| FileText | FiFileText | Documents, text files |
| Send | FiSend | Submit, send message |
| Copy | FiCopy | Copy to clipboard |
| Check | FiCheck | Confirmation, success |
| X | FiX | Close, cancel, clear |
| ChevronLeft | FiChevronLeft | Back, collapse |
| ChevronRight | FiChevronRight | Forward, expand |
| ChevronDown | FiChevronDown | Expand, dropdown |
| Plus | FiPlus | Add, create new |
| MessageSquare | FiMessageSquare | Chat, conversation |
| List | FiList | List view, menu |
| Home | FiHome | Home, dashboard |
| Layers | FiLayers | Layers, categories |

**Why Feather?**
- Lightweight, consistent line style
- Comprehensive set of icons (280+)
- MIT license, easy to use in React
- Clean, professional appearance
- Designed for 24x24px grid (scales well)

### CSS Variables Reference

**Complete list of CSS custom properties:**

```css
/* Brand Colors */
--dcsa-navy: #002D5B;
--dcsa-navy-light: #0A3A6B;
--dcsa-gold: #D4AF37;
--dcsa-gold-light: #F5E6B8;
--accent-teal: #009BB5;
--accent-teal-dark: #007A91;

/* Backgrounds */
--bg-page: #FFFFFF;
--bg-card: #FFFFFF;
--bg-card-hover: #F8F9FA;
--bg-header: var(--dcsa-navy);
--bg-sidebar: #FAFBFC;
--bg-input: #FFFFFF;
--bg-table-header: #F8F9FB;
--bg-drop-zone: #FFFFFF;
--bg-filter-bar: var(--dcsa-navy);

/* Text Colors */
--text-primary: #1A2B3C;
--text-secondary: #5A6B7C;
--text-muted: #8899AA;
--text-inverse: #FFFFFF;
--text-link: #009BB5;

/* Borders */
--border-light: #E4E7ED;
--border-medium: #CBD2DB;
--border-focus: #009BB5;

/* Status Colors */
--status-clear: #2E7D32;
--status-clear-bg: #E8F5E9;
--status-alert: #C62828;
--status-alert-bg: #FFEBEE;
--status-warning: #E65100;
--status-warning-bg: #FFF3E0;
--status-caution: #F57F17;
--status-caution-bg: #FFF8E1;
--status-info: #1565C0;
--status-info-bg: #E3F2FD;
--status-pending: var(--dcsa-gold);
--status-pending-bg: #FFF8E1;
--status-hrh: #B71C1C;
--status-hrh-bg: #FFCDD2;

/* Border Radii */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-pill: 12px;

/* Fonts */
--font-sans: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
--font-mono: 'Cascadia Code', 'Consolas', 'JetBrains Mono', monospace;

/* Sizing */
--header-height: 56px;
--sidebar-width: 220px;
--touch-target-min: 44px;

/* Shadows */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.12);
--shadow-dropdown: 0 4px 12px rgba(0, 21, 48, 0.08);
```

### Component File Structure

```
portal/src/
├── components/           # Shared components
│   ├── Header.js
│   ├── Header.css
│   ├── Sidebar.js
│   ├── Sidebar.css
│   └── ErrorBoundary.js
├── features/            # Feature-specific components
│   ├── fincen/
│   │   ├── FincenApp.jsx
│   │   ├── FincenApp.css
│   │   ├── components/
│   │   │   ├── KVGrid.jsx
│   │   │   ├── CollapsibleSection.jsx
│   │   │   ├── charts/
│   │   │   │   ├── RiskDistributionPie.jsx
│   │   │   │   ├── AlertTimeSeriesChart.jsx
│   │   │   │   └── ...
│   │   │   └── checks/
│   │   │       ├── IdentityCheck.jsx
│   │   │       ├── RiskAssessment.jsx
│   │   │       └── ...
│   │   └── pages/
│   │       ├── DashboardPage.jsx
│   │       ├── AlertDetailPage.jsx
│   │       └── ...
│   ├── data-loader/
│   │   └── ... (similar structure)
│   ├── nsc/
│   │   └── ... (similar structure)
│   └── case-management/
│       └── ... (similar structure)
├── pages/               # Top-level pages
│   ├── PVOpsPage.js
│   ├── PVOpsPage.css
│   ├── AdminPage.js
│   ├── SettingsPage.js
│   └── ...
├── App.js               # Main app component
├── App.css              # Global styles
└── index.css            # Design tokens (CSS variables)
```

### Version History

**2026-07-03:** Initial comprehensive design system documentation
- Extracted all design decisions from existing codebase
- Documented color system, typography, spacing, components
- Captured feature-specific patterns (FinCEN, Data Loader, NSC, PV Ops)
- Included responsive design and accessibility guidelines

---

**End of Document**
