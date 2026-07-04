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
