# Aegis Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Checkr-style marketing landing page ("Aegis - Personnel Vetting, End to End") shown to signed-out visitors before the SSO sign-in card.

**Architecture:** Pre-auth `Gate` in `App.jsx` gains a two-view state (`landing` | `signin`). `Landing.jsx` is a self-contained page (own CSS, zero data fetches, CSS-only vignettes). `SignIn.jsx` gains a Back link. e2e smoke starts at the landing; responsive sweep gains a signed-out landing pass.

**Tech Stack:** Existing stack only: React 18, react-icons/fi, design tokens, vitest + RTL, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-03-aegis-landing-page-design.md`

## Global Constraints

- Copy rules (CLAUDE.md): Title Case for headers/nav/stat labels, sentence case body, hyphens never em dashes (the copyStyle test enforces this), no AI-idiom filler.
- Tokens only, no hardcoded hex. Landing-specific classes prefixed `.landing-`.
- Landing renders with ZERO network calls; vignettes are landing-local markup, `aria-hidden`, float animation disabled under `prefers-reduced-motion`.
- AA contrast: white text on navy; Sign In buttons are gold `--dcsa-gold` with navy text.
- No horizontal overflow at 375/480/768/1280/1720 widths.
- Files another session may touch concurrently: stage/commit ONLY by explicit pathspec.

---

### Task 1: Pre-auth view plumbing + Landing page

**Files:**
- Create: `portal/src/pages/Landing.jsx`, `portal/src/pages/landing.css`
- Modify: `portal/src/App.jsx` (Gate view state), `portal/src/pages/SignIn.jsx` (Back link)
- Modify: `portal/src/__tests__/signIn.test.jsx` (click through the landing)
- Test: `portal/src/__tests__/landing.test.jsx`

**Interfaces:**
- Consumes: `useSession` (Gate), `REFS` from `src/references.js` (footer links: `SEAD4`, `SEAD6`, `DOHA_DECISIONS`, `TW_INDEX`).
- Produces: `Landing({ onSignIn })` default export; `SignIn({ onBack })` - `onBack` optional, renders a "Back to overview" ghost button only when provided. Gate renders Landing by default when signed out; any landing Sign In CTA switches to the SignIn view.

- [ ] **Step 1: Write the failing tests**

`portal/src/__tests__/landing.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

describe('Landing page', () => {
  it('shows the landing to signed-out visitors, not the SSO card or app shell', () => {
    render(<App />);
    expect(screen.getByRole('heading',
      { name: 'One Person. One File. Every Fact Sourced.' })).toBeInTheDocument();
    expect(screen.queryByText('About This Demo')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Subjects' })).not.toBeInTheDocument();
  });

  it('renders stats, capabilities, personas, and the demo disclaimer', () => {
    render(<App />);
    expect(screen.getByText('33,610')).toBeInTheDocument();
    expect(screen.getByText('Real DOHA Decisions')).toBeInTheDocument();
    expect(screen.getByText('Whole-Person File')).toBeInTheDocument();
    expect(screen.getByText('AI Assists. People Decide.')).toBeInTheDocument();
    expect(screen.getByText('Adjudicator')).toBeInTheDocument();
    expect(screen.getByText(/all identities are fictional/i)).toBeInTheDocument();
  });

  it('Sign In reveals the SSO card and Back returns to the landing', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /sign in/i })[0]);
    expect(screen.getByText('About This Demo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /back to overview/i }));
    expect(screen.getByRole('heading',
      { name: 'One Person. One File. Every Fact Sourced.' })).toBeInTheDocument();
  });

  it('signed-in sessions bypass the landing entirely', () => {
    localStorage.setItem('demo.session', 'active');
    render(<App />);
    expect(screen.queryByRole('heading',
      { name: 'One Person. One File. Every Fact Sourced.' })).not.toBeInTheDocument();
  });
});
```

Update `portal/src/__tests__/signIn.test.jsx`: after `render(<App />)` in each signed-out test, first click through the landing. Add a helper below `typePassword` and call it at the top of every test that expects the SSO card:

```jsx
const openSignIn = () =>
  fireEvent.click(screen.getAllByRole('button', { name: /sign in/i })[0]);
```

(Each existing assertion about 'About This Demo' / password behavior stays; only the entry point changes.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd portal && npx vitest run src/__tests__/landing.test.jsx src/__tests__/signIn.test.jsx`
Expected: landing tests FAIL (module missing); signIn tests FAIL (landing not yet in front) - after the edit they fail because `Landing.jsx` does not exist.

- [ ] **Step 3: Implement**

`portal/src/App.jsx` - replace the Gate function and imports:

```jsx
import { useState } from 'react';
```

```jsx
import Landing from './pages/Landing.jsx';
```

```jsx
function Gate() {
  const { signedIn } = useSession();
  const [preAuthView, setPreAuthView] = useState('landing');
  // Gate never unmounts, so reset the pre-auth view while signed in;
  // signing out then always lands on the marketing page, not the SSO card.
  useEffect(() => {
    if (signedIn) setPreAuthView('landing');
  }, [signedIn]);
  if (!signedIn) {
    return preAuthView === 'landing'
      ? <Landing onSignIn={() => setPreAuthView('signin')} />
      : <SignIn onBack={() => setPreAuthView('landing')} />;
  }
  return ( /* existing signed-in tree unchanged */ );
}
```

(import `useEffect` alongside `useState`.)

`portal/src/pages/SignIn.jsx` - accept `{ onBack }`; when provided, render as the first child inside the card:

```jsx
{onBack && (
  <button type="button" className="btn btn-ghost signin-back" onClick={onBack}>
    <FiArrowLeft aria-hidden="true" /> Back to overview
  </button>
)}
```

(add `FiArrowLeft` to the existing react-icons import; add `.signin-back { align-self: flex-start; }` to the sign-in block in `pages.css`.)

`portal/src/pages/Landing.jsx` (complete):

```jsx
import {
  FiShield, FiUsers, FiFileText, FiSearch, FiActivity, FiDatabase,
  FiBarChart2, FiCheck, FiZap, FiUserCheck, FiArrowRight, FiBookOpen,
} from 'react-icons/fi';
import { REFS } from '../references.js';
import './landing.css';

// Source of truth: portal/public/data/analytics.json and providers.json.
const STATS = [
  { value: '33,610', label: 'Real DOHA Decisions' },
  { value: '13', label: 'SEAD-4 Guidelines' },
  { value: '12', label: 'Data Providers' },
  { value: '9', label: 'Whole-Person Factors' },
];

const STAGES = [
  ['Initiation', 'SF-86 submitted and the case opens with a complete identity profile.'],
  ['Investigation', 'Record checks run against every provider; fieldwork fills the gaps.'],
  ['Adjudication', 'Guideline analysis, whole-person weighing, and a human decision.'],
  ['Continuous Vetting', 'Automated checks keep watching after eligibility is granted.'],
];

const CAPABILITIES = [
  [FiUsers, 'Whole-Person File',
   'Identity, address and employment history, timeline, and the nine-factor worksheet in one place.'],
  [FiSearch, 'Record Checks With Source Documents',
   'Every check names its provider and opens the underlying record as a paper facsimile beside extracted data.'],
  [FiBookOpen, 'SEAD-4 Guideline Analysis',
   'Disqualifiers and mitigators with AG paragraph citations, grounded by real DOHA precedents.'],
  [FiActivity, 'Alert Validation',
   'Every alert walks the analyst three-step: identity match, threshold, prior adjudication.'],
  [FiDatabase, 'Provider Provenance',
   'Source chips on every fact and a provider-to-guideline coverage matrix.'],
  [FiBarChart2, 'Analytics On Real Decisions',
   'Outcome trends from 33,610 published DOHA hearing and appeal decisions.'],
];

const AI_BULLETS = [
  'Risk scores triage the queue; they never decide.',
  'Precedents retrieved from the real DOHA corpus.',
  'Statements of Reasons drafted for human review.',
  'Ask the Case answers only from the case file, with citations.',
];

const PERSONA_CARDS = [
  [FiSearch, 'Investigator', 'Runs coverage, resolves discrepancies, and writes the Report of Investigation.'],
  [FiUserCheck, 'Analyst', 'Validates alerts through identity, threshold, and prior-adjudication checks.'],
  [FiShield, 'Adjudicator', 'Weighs the whole person and records the decision. Grant, LOI, SOR, or deny.'],
];

const PROVIDERS = [
  'FBI CJIS / NCIC + Rap Back', 'Equifax', 'Experian', 'TransUnion', 'LexisNexis',
  'FinCEN / Treasury', 'CBP I-94 Foreign Travel', 'State & local courts',
  'DMV records', 'IRS / tax records', 'SEAD-5 Social media (PAEI)',
  'DISS / prior adjudications',
];

function SignInButton({ onSignIn, children = 'Sign In' }) {
  return (
    <button type="button" className="landing-cta" onClick={onSignIn}>
      {children} <FiArrowRight aria-hidden="true" />
    </button>
  );
}

export default function Landing({ onSignIn }) {
  return (
    <div className="landing">
      <nav className="landing-nav" aria-label="Landing">
        <span className="landing-wordmark">
          <FiShield aria-hidden="true" /> Aegis
          <span className="landing-wordmark-sub">Personnel Vetting Demo</span>
        </span>
        <div className="landing-nav-links">
          <a href="#platform">Platform</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#ai">AI</a>
          <a href="#data">Data Sources</a>
        </div>
        <SignInButton onSignIn={onSignIn} />
      </nav>

      <main>
        <header className="landing-hero">
          <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Trusted Workforce 2.0 Demo</p>
            <h1>One Person. One File. Every Fact Sourced.</h1>
            <p className="landing-sub">
              Aegis walks a security clearance case end to end: initiation,
              investigation, adjudication, and continuous vetting, with
              AI-assisted triage and a human behind every decision.
            </p>
            <div className="landing-hero-ctas">
              <SignInButton onSignIn={onSignIn}>Sign in to explore</SignInButton>
              <a className="landing-ghost" href="#how-it-works">See how it works</a>
            </div>
          </div>
          <div className="landing-vignette" aria-hidden="true">
            <div className="lv-card lv-subject">
              <div className="lv-subject-head">
                <div>
                  <div className="lv-name">Jordan A. Reyes</div>
                  <div className="lv-role">Systems Analyst - T5</div>
                </div>
                <div className="lv-dial">62<span>AI Risk</span></div>
              </div>
              <div className="lv-pills">
                <span className="lv-pill lv-warn">Needs Review</span>
                <span className="lv-chip">F</span>
                <span className="lv-chip">B</span>
              </div>
            </div>
            <div className="lv-card lv-alert">
              <div className="lv-alert-title">Financial - new delinquency reported</div>
              <ul className="lv-steps">
                <li><FiCheck /> Identity match 96%</li>
                <li><FiCheck /> Threshold met</li>
                <li><FiCheck /> Not previously adjudicated</li>
              </ul>
              <span className="lv-pill lv-refer">Referred to adjudication</span>
            </div>
          </div>
          </div>
        </header>

        <section className="landing-stats" aria-label="Platform statistics">
          {STATS.map(({ value, label }) => (
            <div key={label} className="landing-stat">
              <div className="landing-stat-value">{value}</div>
              <div className="landing-stat-label">{label}</div>
            </div>
          ))}
        </section>

        <section id="how-it-works" className="landing-section">
          <h2>The Lifecycle, End To End</h2>
          <ol className="landing-stages">
            {STAGES.map(([name, blurb], i) => (
              <li key={name} className="landing-stage">
                <span className="landing-stage-num">{i + 1}</span>
                <h3>{name}</h3>
                <p>{blurb}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="platform" className="landing-section landing-section-alt">
          <h2>Everything The File Needs To Say</h2>
          <div className="landing-grid">
            {CAPABILITIES.map(([Icon, title, blurb]) => (
              <div key={title} className="landing-card">
                <Icon className="landing-card-icon" aria-hidden="true" />
                <h3>{title}</h3>
                <p>{blurb}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="ai" className="landing-section">
          <div className="landing-split">
            <div>
              <h2>AI Assists. People Decide.</h2>
              <ul className="landing-bullets">
                {AI_BULLETS.map((b) => <li key={b}><FiZap aria-hidden="true" /> {b}</li>)}
              </ul>
            </div>
            <div className="landing-chat" aria-hidden="true">
              <div className="lc-q">What supports the Guideline F concern?</div>
              <div className="lc-a">
                A TransUnion credit-file extract shows $12,400 past due, and the
                SF-86 Section 20A response understated the delinquency.
                <div className="lc-cites">
                  <span>Credit-file extract</span><span>SF-86 Section 20A</span>
                </div>
              </div>
              <div className="lc-note">AI-assisted - human decision authority</div>
            </div>
          </div>
        </section>

        <section id="data" className="landing-section landing-section-alt">
          <h2>Twelve Sources. Thirteen Guidelines. One Matrix.</h2>
          <p className="landing-section-sub">
            Every record names the provider it came through, and the coverage
            matrix shows which sources back which SEAD-4 concerns.
          </p>
          <div className="landing-providers">
            {PROVIDERS.map((p) => <span key={p} className="landing-provider">{p}</span>)}
          </div>
          <div className="landing-personas">
            {PERSONA_CARDS.map(([Icon, role, blurb]) => (
              <div key={role} className="landing-card">
                <Icon className="landing-card-icon" aria-hidden="true" />
                <h3>{role}</h3>
                <p>{blurb}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-final">
          <h2>Walk A Case End To End.</h2>
          <SignInButton onSignIn={onSignIn}>Sign in to explore</SignInButton>
        </section>
      </main>

      <footer className="landing-footer">
        <p>
          Educational demonstration. All identities are fictional; precedents
          and analytics come from published DOHA decisions. No DoD, DCSA, or
          DOHA endorsement implied.
        </p>
        <p className="landing-footer-links">
          <a href={REFS.SEAD4} target="_blank" rel="noreferrer">SEAD 4</a>
          <a href={REFS.SEAD6} target="_blank" rel="noreferrer">SEAD 6</a>
          <a href={REFS.DOHA_DECISIONS} target="_blank" rel="noreferrer">DOHA Decisions</a>
          <a href={REFS.TW_INDEX} target="_blank" rel="noreferrer">Trusted Workforce 2.0</a>
        </p>
      </footer>
    </div>
  );
}
```

`portal/src/pages/landing.css` (complete):

```css
.landing { background: var(--bg-page); color: var(--text-primary); }
.landing main { display: block; }

/* Nav */
.landing-nav { position: sticky; top: 0; z-index: 100; display: flex;
  align-items: center; gap: var(--space-6); padding: 0 var(--space-6);
  height: var(--header-height); background: var(--dcsa-navy);
  color: var(--text-inverse); }
.landing-wordmark { display: flex; align-items: center; gap: var(--space-2);
  font-size: var(--font-size-lg); font-weight: 700; color: var(--dcsa-gold); }
.landing-wordmark-sub { font-size: var(--font-size-xs); font-weight: 400;
  color: var(--dcsa-ice); margin-left: var(--space-2); }
.landing-nav-links { display: flex; gap: var(--space-5); flex: 1;
  justify-content: center; }
.landing-nav-links a { color: var(--dcsa-ice); font-size: var(--font-size-sm);
  font-weight: 600; min-height: 44px; display: inline-flex; align-items: center; }
.landing-nav-links a:hover { color: var(--text-inverse); }

/* CTA buttons */
.landing-cta { display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4); min-height: 44px; border: none;
  border-radius: var(--radius-sm); background: var(--dcsa-gold);
  color: var(--dcsa-navy); font-family: inherit; font-size: var(--font-size-base);
  font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
.landing-cta:hover { transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25); }
.landing-ghost { display: inline-flex; align-items: center; min-height: 44px;
  padding: var(--space-2) var(--space-4); border: 1px solid var(--dcsa-ice);
  border-radius: var(--radius-sm); color: var(--text-inverse); font-weight: 600; }
.landing-ghost:hover { border-color: var(--text-inverse); color: var(--text-inverse); }

/* Hero: full-bleed navy band; inner wrapper constrains and lays out content */
.landing-hero, .landing-final { background: linear-gradient(160deg,
  var(--dcsa-navy) 0%, var(--dcsa-navy-light) 100%); }
.landing-hero { color: var(--text-inverse);
  padding: var(--space-10) var(--space-8); }
.landing-hero-inner { max-width: 1200px; margin: 0 auto; display: grid;
  grid-template-columns: 1.1fr 1fr; gap: var(--space-10); align-items: center; }
.landing-eyebrow { font-size: var(--font-size-xs); font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px; color: var(--dcsa-gold);
  margin-bottom: var(--space-3); }
.landing-hero h1 { font-size: 40px; line-height: 1.15; margin-bottom: var(--space-4); }
.landing-sub { font-size: var(--font-size-lg); color: var(--dcsa-ice);
  margin-bottom: var(--space-6); max-width: 46ch; }
.landing-hero-ctas { display: flex; gap: var(--space-3); flex-wrap: wrap; }

/* Vignette */
.landing-vignette { position: relative; min-height: 300px; }
.lv-card { position: absolute; background: var(--bg-card); color: var(--text-primary);
  border-radius: var(--radius-md); box-shadow: var(--shadow-dropdown);
  padding: var(--space-4); animation: lv-float 7s ease-in-out infinite; }
.lv-subject { top: 0; left: 0; width: min(320px, 80%); }
.lv-alert { bottom: 0; right: 0; width: min(300px, 75%);
  animation-delay: 1.6s; }
@keyframes lv-float { 0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); } }
@media (prefers-reduced-motion: reduce) { .lv-card { animation: none; } }
.lv-subject-head { display: flex; justify-content: space-between;
  align-items: flex-start; gap: var(--space-3); }
.lv-name { font-weight: 700; }
.lv-role { font-size: var(--font-size-sm); color: var(--text-secondary); }
.lv-dial { display: flex; flex-direction: column; align-items: center;
  justify-content: center; width: 56px; height: 56px; border-radius: 50%;
  border: 4px solid var(--risk-moderate); color: var(--status-warning-dark);
  background: var(--risk-moderate-bg); font-weight: 700; }
.lv-dial span { font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px; }
.lv-pills { display: flex; gap: var(--space-2); margin-top: var(--space-3);
  align-items: center; }
.lv-pill { font-size: var(--font-size-xs); font-weight: 700; padding: 2px 8px;
  border-radius: var(--radius-pill); border: 1px solid; text-transform: uppercase; }
.lv-warn { color: var(--status-warning-dark); border-color: var(--status-warning);
  background: var(--status-warning-bg); }
.lv-refer { color: var(--text-secondary); border-color: var(--border-medium);
  background: var(--bg-sidebar); display: inline-block; margin-top: var(--space-3); }
.lv-chip { display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%; font-size: var(--font-size-xs);
  font-weight: 700; color: var(--status-info); border: 1px solid var(--status-info);
  background: var(--status-info-bg); }
.lv-alert-title { font-weight: 700; font-size: var(--font-size-sm); }
.lv-steps { list-style: none; margin: var(--space-3) 0 0; padding: 0;
  display: grid; gap: var(--space-1); font-size: var(--font-size-sm); }
.lv-steps li { display: flex; align-items: center; gap: var(--space-2);
  color: var(--text-secondary); }
.lv-steps svg { color: var(--status-clear); }

/* Stats band */
.landing-stats { display: grid; grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4); max-width: 1000px; margin: 0 auto;
  padding: var(--space-8); }
.landing-stat { text-align: center; }
.landing-stat-value { font-size: 32px; font-weight: 700; color: var(--dcsa-navy); }
.landing-stat-label { font-size: var(--font-size-sm); color: var(--text-secondary); }

/* Sections */
.landing-section { max-width: 1100px; margin: 0 auto;
  padding: var(--space-10) var(--space-8); }
.landing-section-alt { max-width: none;
  background: var(--bg-sidebar); }
.landing-section-alt > * { max-width: 1100px; margin-left: auto; margin-right: auto; }
.landing-section h2 { font-size: 28px; margin-bottom: var(--space-5); }
.landing-section-sub { color: var(--text-secondary); margin-bottom: var(--space-5);
  max-width: 60ch; }

/* Stages */
.landing-stages { list-style: none; display: grid;
  grid-template-columns: repeat(4, 1fr); gap: var(--space-4); padding: 0; }
.landing-stage { position: relative; padding: var(--space-4);
  background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); }
.landing-stage-num { display: inline-flex; align-items: center;
  justify-content: center; width: 28px; height: 28px; border-radius: 50%;
  background: var(--dcsa-gold); color: var(--dcsa-navy); font-weight: 700;
  margin-bottom: var(--space-2); }
.landing-stage h3 { font-size: var(--font-size-base); margin-bottom: var(--space-1); }
.landing-stage p { font-size: var(--font-size-sm); color: var(--text-secondary); }

/* Capability grid + personas */
.landing-grid, .landing-personas { display: grid;
  grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
.landing-personas { margin-top: var(--space-6); }
.landing-card { background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); padding: var(--space-5); }
.landing-card-icon { font-size: 22px; color: var(--accent-teal);
  margin-bottom: var(--space-3); }
.landing-card h3 { font-size: var(--font-size-base); margin-bottom: var(--space-2); }
.landing-card p { font-size: var(--font-size-sm); color: var(--text-secondary); }

/* AI split */
.landing-split { display: grid; grid-template-columns: 1fr 1fr;
  gap: var(--space-8); align-items: center; }
.landing-bullets { list-style: none; padding: 0; display: grid; gap: var(--space-3); }
.landing-bullets li { display: flex; gap: var(--space-2); align-items: baseline; }
.landing-bullets svg { color: var(--accent-teal); flex-shrink: 0; }
.landing-chat { background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-lg); padding: var(--space-5); display: grid;
  gap: var(--space-3); box-shadow: var(--shadow-card); }
.lc-q { justify-self: end; background: var(--dcsa-navy); color: var(--text-inverse);
  padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
  font-size: var(--font-size-sm); max-width: 85%; }
.lc-a { background: var(--bg-sidebar); border: 1px solid var(--border-light);
  padding: var(--space-3); border-radius: var(--radius-md);
  font-size: var(--font-size-sm); max-width: 90%; }
.lc-cites { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
.lc-cites span { font-size: var(--font-size-xs); font-weight: 600;
  color: var(--accent-teal-dark); background: var(--dcsa-ocean-tint-8);
  padding: 2px 8px; border-radius: var(--radius-pill); }
.lc-note { font-size: var(--font-size-xs); color: var(--text-muted); }

/* Providers */
.landing-providers { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.landing-provider { font-size: var(--font-size-sm); font-weight: 600;
  color: var(--text-secondary); background: var(--bg-card);
  border: 1px solid var(--border-light); padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill); }

/* Final CTA + footer */
.landing-final { text-align: center; padding: var(--space-10) var(--space-8);
  color: var(--text-inverse); }
.landing-final h2 { font-size: 28px; margin-bottom: var(--space-5); }
.landing-footer { max-width: 1100px; margin: 0 auto;
  padding: var(--space-8); font-size: var(--font-size-sm);
  color: var(--text-secondary); }
.landing-footer-links { display: flex; gap: var(--space-4); flex-wrap: wrap;
  margin-top: var(--space-3); }
.landing-footer-links a { color: var(--text-link); font-weight: 600; }

/* Responsive */
@media (max-width: 900px) {
  .landing-hero { grid-template-columns: 1fr; }
  .landing-vignette { min-height: 260px; }
  .landing-split { grid-template-columns: 1fr; }
  .landing-nav-links { display: none; }
  .landing-stages, .landing-grid, .landing-personas { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .landing-stats { grid-template-columns: 1fr 1fr; }
  .landing-stages, .landing-grid, .landing-personas { grid-template-columns: 1fr; }
  .landing-hero h1 { font-size: 30px; }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: all suites green including updated signIn tests and new landing tests.

- [ ] **Step 5: Verify build and no-network constraint**

Run: `cd portal && npm run build`
Then grep: `grep -n "fetch\|useData\|api.js" src/pages/Landing.jsx` - expected: no matches.

- [ ] **Step 6: Commit (pathspec only)**

```bash
git commit -m "feat(portal): Aegis marketing landing page before the SSO gate" -- \
  portal/src/pages/Landing.jsx portal/src/pages/landing.css portal/src/App.jsx \
  portal/src/pages/SignIn.jsx portal/src/pages/pages.css \
  portal/src/__tests__/landing.test.jsx portal/src/__tests__/signIn.test.jsx
```

---

### Task 2: e2e coverage + verification

**Files:**
- Modify: `portal/e2e/smoke.spec.js` (landing-first flow)
- Modify: `portal/e2e/responsive.spec.js` (signed-out landing sweep)

**Interfaces:**
- Consumes: Task 1's Landing (H1 text, Sign In buttons).

- [ ] **Step 1: Update the smoke test**

At the very top of the smoke flow (before the 'About This Demo' assertions),
insert:

```js
  await page.goto('/#/');
  await expect(page.getByRole('heading',
    { name: 'One Person. One File. Every Fact Sourced.' })).toBeVisible();
  await page.getByRole('button', { name: /sign in to explore/i }).first().click();
```

(the existing `await page.goto('/#/'); await expect(page.getByText('About This
Demo'))...` lines follow; remove the now-duplicate initial goto. The sign-out
assertion at the end changes from `About This Demo` to the landing H1, since
sign-out now lands on the pre-auth default view.)

Check the end of the file: after `Sign out`, assert
`page.getByRole('heading', { name: 'One Person. One File. Every Fact Sourced.' })`.

NOTE: sign-out returns to the Gate's default pre-auth view. Because `Gate`
remounts its state when `signedIn` flips, `preAuthView` resets to 'landing' -
verify this behavior in the browser run; if the state does not reset (Gate not
remounted), reset it explicitly in the sign-out path or key the state off
`signedIn`.

- [ ] **Step 2: Add the landing to the responsive sweep**

In `portal/e2e/responsive.spec.js`, add a second test per viewport (or extend
the existing loop) that opens `/#/` WITHOUT the `demo.session` init script and
checks the same no-horizontal-overflow invariant against `.landing` instead of
`.page`:

```js
  test(`no horizontal overflow on the landing at ${vp.name} (${vp.width}px)`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();
    await page.goto('/#/');
    await page.waitForSelector('.landing');
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow, `landing overflows at ${vp.width}px`).toBeLessThanOrEqual(0);
    await context.close();
  });
```

(match the overflow-measurement expression to what the existing test actually
uses - read it first and reuse it verbatim.)

- [ ] **Step 3: Full verification**

```bash
cd portal && npm test && npm run build && npm run test:e2e
```

Expected: all green (unit, build, smoke, responsive).

- [ ] **Step 4: Commit (pathspec only)**

```bash
git commit -m "test(portal): landing-first smoke flow and responsive landing sweep" -- \
  portal/e2e/smoke.spec.js portal/e2e/responsive.spec.js
```

---

## Post-plan notes

- Two tasks, strictly sequential. Both must stage by pathspec: another session
  works on this branch concurrently (currently touching DocumentViewer and
  dohaSummary tests - no overlap, but check `git status` before every commit).
- The copyStyle vitest sweeps copy for banned characters; landing copy uses
  hyphens only.
- If `REFS.DOHA_DECISIONS` or `REFS.TW_INDEX` do not exist in references.js,
  use the closest existing keys (check the file; SignIn.jsx imports show
  DOHA_DECISIONS and TW_INDEX in use today).
```
