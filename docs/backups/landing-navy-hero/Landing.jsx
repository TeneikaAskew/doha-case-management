import { useEffect, useRef, useState } from 'react';
import {
  FiShield, FiUsers, FiSearch, FiActivity, FiDatabase,
  FiBarChart2, FiCheck, FiZap, FiUserCheck, FiArrowRight, FiBookOpen,
} from 'react-icons/fi';
import { REFS } from '../references.js';
import './landing.css';

// Reveals an element as it enters the viewport. Falls back to immediately
// revealed when IntersectionObserver is unavailable (jsdom in tests).
function useReveal() {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setRevealed(true);
        observer.unobserve(el);
      }
    }, { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, revealed];
}

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
  [FiSearch, 'Investigator', 'R.C.', 'persona-avatar-teal',
   'Runs coverage, resolves discrepancies, and writes the Report of Investigation.',
   'Every lead and every source, one file.'],
  [FiUserCheck, 'Analyst', 'M.O.', 'persona-avatar-navy',
   'Validates alerts through identity, threshold, and prior-adjudication checks.',
   'The three-step validation is my morning.'],
  [FiShield, 'Adjudicator', 'L.T.', 'persona-avatar-gold',
   'Weighs the whole person and records the decision. Grant, LOI, SOR, or deny.',
   'I decide with the whole person in front of me.'],
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

// In-page section links: the app is a HashRouter SPA, so href="#id" would
// navigate to a (nonexistent) route instead of scrolling.
function SectionLink({ id, className = '', children }) {
  return (
    <button type="button" className={`landing-section-link ${className}`}
      onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}>
      {children}
    </button>
  );
}

export default function Landing({ onSignIn }) {
  const [statsRef, statsRevealed] = useReveal();
  const [howRef, howRevealed] = useReveal();
  const [platformRef, platformRevealed] = useReveal();
  const [aiRef, aiRevealed] = useReveal();
  const [dataRef, dataRevealed] = useReveal();

  return (
    <div className="landing">
      <nav className="landing-nav" aria-label="Landing">
        <span className="landing-wordmark">
          <FiShield aria-hidden="true" /> Aegis
          <span className="landing-wordmark-sub">Personnel Vetting Demo</span>
        </span>
        <div className="landing-nav-links">
          <SectionLink id="platform">Platform</SectionLink>
          <SectionLink id="how-it-works">How It Works</SectionLink>
          <SectionLink id="ai">AI</SectionLink>
          <SectionLink id="data">Data Sources</SectionLink>
        </div>
        <SignInButton onSignIn={onSignIn} />
      </nav>

      <main>
        <header className="landing-hero">
          <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Trusted Workforce 2.0 Demo</p>
            <h1>One Person. One File. <span className="landing-h1-accent">Every Fact Sourced.</span></h1>
            <p className="landing-sub">
              Aegis walks a security clearance case end to end: initiation,
              investigation, adjudication, and continuous vetting, with
              AI-assisted triage and a human behind every decision.
            </p>
            <div className="landing-hero-ctas">
              <SignInButton onSignIn={onSignIn}>Sign in to explore</SignInButton>
              <SectionLink id="how-it-works" className="landing-ghost">
                See how it works
              </SectionLink>
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
            <div className="lv-card lv-quote">
              <div className="lv-quote-head">
                <span className="lv-quote-title">Subject statement</span>
                <span className="lv-quote-time">Mar 10, 10:20am</span>
              </div>
              <div className="lv-quote-body">
                <span className="lv-avatar" aria-hidden="true">JR</span>
                <p className="lv-quote-text">
                  "I completed the court-required counseling program and set up
                  repayment. I hope you will take that into consideration."
                </p>
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

        <section ref={statsRef}
          className={`landing-stats${statsRevealed ? ' revealed' : ''}`}
          aria-label="Platform statistics">
          {STATS.map(({ value, label }) => (
            <div key={label} className="landing-stat">
              <div className="landing-stat-value">{value}</div>
              <div className="landing-stat-label">{label}</div>
            </div>
          ))}
        </section>

        <section id="how-it-works" ref={howRef}
          className={`landing-section${howRevealed ? ' revealed' : ''}`}>
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

        <section id="platform" ref={platformRef}
          className={`landing-section landing-section-alt${platformRevealed ? ' revealed' : ''}`}>
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
