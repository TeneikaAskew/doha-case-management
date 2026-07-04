import { useEffect, useRef, useState } from 'react';
import { FiShield, FiArrowRight, FiCheck, FiZap } from 'react-icons/fi';
import { REFS } from '../references.js';
import './landing.css';

const IMG_BASE = import.meta.env.BASE_URL + 'img/landing/';

const ROTATE_WORDS = ['people', 'alerts', 'records', 'histories'];

const NAV_LINKS = [
  { id: 'platform', label: 'Platform' },
  { id: 'personas', label: 'Personas' },
  { id: 'scale', label: 'Data' },
  { id: 'authorities', label: 'Authorities' },
];

const STAGES = [
  ['Initiation', 'SF-86 submitted; the case opens with a complete identity profile.'],
  ['Investigation', 'Record checks run against every provider; fieldwork fills the gaps.'],
  ['Adjudication', 'Guideline analysis, whole-person weighing, and a human decision.'],
  ['Continuous Vetting', 'Automated checks keep watching after eligibility is granted.'],
];

const PERSONA_TABS = [
  {
    id: 'p-inv',
    label: 'Investigator',
    headline: "Coverage that doesn't make you choose between speed and rigor",
    body: 'Every record check names its provider, carries its scope, and opens '
      + 'the source document beside the extracted data. Discrepancies against '
      + 'the SF-86 surface themselves.',
  },
  {
    id: 'p-ana',
    label: 'Analyst',
    headline: 'Alerts that arrive validated, not just detected',
    body: 'Every alert from every data provider walks the same three steps: '
      + 'identity match, investigative threshold, prior adjudication. The '
      + 'source document is one click away.',
  },
  {
    id: 'p-adj',
    label: 'Adjudicator',
    headline: 'Decide with the whole person in front of you',
    body: 'Nine whole-person factors, each tied to its evidence. Disqualifiers '
      + 'and mitigators cite their AG paragraphs, and real DOHA precedents sit '
      + 'beside every guideline.',
  },
];

const AI_BULLETS = [
  'Risk scores triage the queue; they never decide.',
  'Precedents retrieved from the real DOHA corpus.',
  'Statements of Reasons drafted for human review.',
  'Ask the Case answers only from the case file, with citations.',
];

const STATS = [
  { value: 33610, label: 'real DOHA decisions behind precedents and analytics' },
  { value: 13, label: 'SEAD-4 guidelines covered, A through M' },
  { value: 12, label: 'data providers mapped to every guideline they inform' },
];

const FOOTER_COLUMNS = [
  ['Platform', [
    ['Subjects', 'platform'], ['Case Queue', 'platform'],
    ['Alerts from Data Providers', 'platform'], ['Analytics', 'platform'],
    ['Ask the Case', 'platform'],
  ]],
  ['Lifecycle', [
    ['Initiation', 'personas'], ['Investigation', 'personas'],
    ['Adjudication', 'personas'], ['Continuous Vetting', 'personas'],
  ]],
  ['Record Checks', [
    ['Criminal history', 'scale'], ['Credit and financial', 'scale'],
    ['Foreign travel', 'scale'], ['Social media (SEAD 5)', 'scale'],
    ['Courts and public records', 'scale'],
  ]],
];

const AUTHORITIES_LINKS = [
  ['SEAD 4 - Adjudicative Guidelines', REFS.SEAD4],
  ['SEAD 6 - Continuous Evaluation', REFS.SEAD6],
  ['EO 12968', REFS.EO_12968],
  ['DOHA decisions', REFS.DOHA_DECISIONS],
  ['Trusted Workforce 2.0', REFS.TW_INDEX],
];

// jsdom (tests) has no matchMedia; treat that, and any thrown access, as "no preference".
function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function useRotatingWord(words, intervalMs) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), intervalMs);
    return () => clearInterval(id);
  }, [words, intervalMs]);
  return words[index];
}

// Reveals an element as it scrolls into view. Falls back to already-revealed
// when IntersectionObserver is unavailable (jsdom) or motion is reduced.
function useReveal() {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      setRevealed(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setRevealed(true);
        observer.unobserve(el);
      }
    }, { threshold: 0.12 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, revealed];
}

function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const [ref, revealed] = useReveal();
  const cls = `rv${revealed ? ' in' : ''}${className ? ` ${className}` : ''}`;
  return <Tag ref={ref} className={cls} {...rest}>{children}</Tag>;
}

function CountUp({ value }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(() => (
    (typeof IntersectionObserver === 'undefined' || prefersReducedMotion())
      ? value.toLocaleString('en-US')
      : '0'
  ));

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      setDisplay(value.toLocaleString('en-US'));
      return undefined;
    }
    const el = ref.current;
    if (!el) return undefined;
    const duration = 1400;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(el);
      let start = null;
      function tick(now) {
        if (start === null) start = now;
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(value * eased).toLocaleString('en-US'));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <b className="count" ref={ref}>{display}</b>;
}

function SignInBtn({ onSignIn, className = 'btn btn-navy', children }) {
  return (
    <button type="button" className={className} onClick={onSignIn}>{children}</button>
  );
}

// In-page section links: pre-auth renders no router, but href="#id" would still
// overwrite window.location.hash, which the signed-in HashRouter reads on mount.
// Scroll in place with JS instead of touching the hash.
function SectionLink({ id, className = '', children }) {
  const cls = `landing-section-link${className ? ` ${className}` : ''}`;
  return (
    <button type="button" className={cls}
      onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}>
      {children}
    </button>
  );
}

function PersonaAppShot({ id }) {
  if (id === 'p-inv') {
    return (
      <div className="app-shot">
        <div className="app-head">
          <h3>Case Queue</h3>
          <button type="button" className="btn btn-navy btn-sm">Open a case</button>
        </div>
        <div className="kpi-tabs">
          <div className="kpi-tab on" style={{ '--kt': 'var(--l-teal)' }}>
            <b>15</b>All subjects
          </div>
          <div className="kpi-tab" style={{ '--kt': 'var(--l-gold)' }}>
            <b>5</b>Needs review
          </div>
          <div className="kpi-tab" style={{ '--kt': 'var(--l-clear)' }}>
            <b>3</b>Fast track
          </div>
          <div className="kpi-tab" style={{ '--kt': 'var(--l-warn)' }}>
            <b>1</b>High risk
          </div>
        </div>
        <table className="table">
          <thead>
            <tr><th>Subject</th><th>Stage</th><th>Status</th><th>AI risk</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Daniel R. Okafor</b></td><td>Adjudication</td>
              <td><span className="tag tag-warn">Action required</span></td>
              <td className="risk hi">78</td>
            </tr>
            <tr>
              <td><b>Marcus T. Bell</b></td><td>Continuous vetting</td>
              <td><span className="tag tag-warn">Needs review</span></td>
              <td className="risk md">64</td>
            </tr>
            <tr>
              <td><b>Priya N. Shah</b></td><td>Investigation</td>
              <td><span className="tag tag-clear">Clear</span></td>
              <td className="risk lo">8</td>
            </tr>
            <tr>
              <td><b>Fatima R. Aziz</b></td><td>Adjudication</td>
              <td><span className="tag tag-clear">Clear</span></td>
              <td className="risk lo">14</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  if (id === 'p-ana') {
    return (
      <div className="app-shot">
        <div className="app-head">
          <h3>Alert Validation</h3>
          <span className="tag tag-warn">High severity</span>
        </div>
        <table className="table">
          <thead><tr><th>Step</th><th>Check</th><th>Result</th></tr></thead>
          <tbody>
            <tr>
              <td><b>1</b></td><td>Identity match</td>
              <td><span className="tag tag-clear">96% confidence</span></td>
            </tr>
            <tr>
              <td><b>2</b></td><td>Investigative threshold</td>
              <td><span className="tag tag-clear">Met</span></td>
            </tr>
            <tr>
              <td><b>3</b></td><td>Prior adjudication</td>
              <td><span className="tag tag-clear">None found</span></td>
            </tr>
            <tr>
              <td colSpan={2}><b>Disposition</b></td>
              <td><span className="tag tag-warn">Refer to adjudication</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="app-shot">
      <div className="app-head">
        <h3>Whole-Person Briefing</h3>
        <span className="tag tag-clear">4 favorable</span>
      </div>
      <table className="table">
        <thead><tr><th>Factor</th><th>Rating</th></tr></thead>
        <tbody>
          <tr>
            <td><b>Frequency and recency</b></td>
            <td><span className="tag tag-warn">Concern</span></td>
          </tr>
          <tr>
            <td><b>Rehabilitation</b></td>
            <td><span className="tag tag-clear">Favorable</span></td>
          </tr>
          <tr>
            <td><b>Likelihood of recurrence</b></td>
            <td><span className="tag tag-warn">Concern</span></td>
          </tr>
          <tr>
            <td><b>Voluntariness</b></td>
            <td><span className="tag tag-clear">Favorable</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function Landing({ onSignIn }) {
  const word = useRotatingWord(ROTATE_WORDS, 2400);
  const [activeTab, setActiveTab] = useState(PERSONA_TABS[0].id);

  return (
    <div className="landing">
      <header className="nav">
        <div className="wrap nav-in">
          <span className="brand">
            <FiShield aria-hidden="true" /> Aegis <small>Vetting demo</small>
          </span>
          <nav className="nav-links" aria-label="Landing sections">
            {NAV_LINKS.map(({ id, label }) => (
              <SectionLink key={id} id={id}>{label}</SectionLink>
            ))}
          </nav>
          <SignInBtn onSignIn={onSignIn} className="btn btn-navy btn-sm">Sign in</SignInBtn>
        </div>
      </header>

      <main>
        <section className="hero wrap">
          <span className="eyebrow">Trusted Workforce 2.0 demo</span>
          <h1>
            Vet <span className="pill-word"><span className="word" key={word}>{word}</span></span> with confidence
          </h1>
          <p className="sub">
            The AI-assisted personnel vetting platform for high-stakes trust
            decisions. Every fact sourced, every decision human.
          </p>
          <div className="hero-ctas">
            <SignInBtn onSignIn={onSignIn} className="btn btn-navy">
              Sign in to explore <FiArrowRight aria-hidden="true" />
            </SignInBtn>
            <SectionLink id="how-it-works" className="btn btn-line">See how it works</SectionLink>
          </div>
        </section>

        <section className="gallery wrap" id="how-it-works" aria-label="The vetting lifecycle">
          <Reveal as="div" className="shot g1">
            <div className="shot-img">
              <img className="shot-photo" alt="Investigator taking a subject statement in an interview"
                src={IMG_BASE + 'interview.jpg'} />
            </div>
            <span className="chip chip-gold">
              <span className="dot"><FiCheck aria-hidden="true" /></span>Eligibility granted
            </span>
          </Reveal>

          <Reveal as="div" className="shot g2 tall">
            <div className="shot-img">
              <img className="shot-photo" alt="Analyst reviewing a records document on a laptop"
                src={IMG_BASE + 'records-analyst.jpg'} />
            </div>
            <div className="mini-card">
              <h4>Case Queue</h4>
              <div className="mini-rows">
                <div className="mini-row"><b>Daniel R. Okafor</b><span className="tag tag-warn">Review</span></div>
                <div className="mini-row"><b>Priya N. Shah</b><span className="tag tag-clear">Fast track</span></div>
                <div className="mini-row"><b>Marcus T. Bell</b><span className="tag tag-warn">Review</span></div>
              </div>
            </div>
          </Reveal>

          <Reveal as="div" className="shot g3 tall">
            <div className="shot-img">
              <img className="shot-photo" alt="Counsel and applicant signing a decision document"
                src={IMG_BASE + 'decision-signing.jpg'} />
            </div>
            <div className="mini-card">
              <h4>Rap Back Notification</h4>
              <dl className="kv">
                <dt>Trigger</dt><dd>Arrest record</dd>
                <dt>Fingerprint</dt><dd>Match</dd>
                <dt>Identity</dt><dd>96% confidence</dd>
                <dt>Threshold</dt><dd>Met</dd>
              </dl>
            </div>
          </Reveal>

          <Reveal as="div" className="shot g4">
            <div className="shot-img">
              <img className="shot-photo" alt="Adjudicator signing a written decision"
                src={IMG_BASE + 'decision-recorded.jpg'} />
            </div>
            <span className="chip chip-teal">
              <span className="dot"><FiCheck aria-hidden="true" /></span>Decision recorded
            </span>
          </Reveal>

          {STAGES.map(([name, blurb]) => (
            <div key={name} className="gt-step">
              <span className="gt-dot" aria-hidden="true" />
              <h3>{name}</h3>
              <p>{blurb}</p>
            </div>
          ))}
        </section>

        <section className="product" id="personas">
          <div className="wrap">
            <div className="tabs" role="tablist" aria-label="Personas">
              {PERSONA_TABS.map((tab) => (
                <button key={tab.id} type="button" role="tab" className="tab"
                  id={`tab-${tab.id}`} aria-selected={activeTab === tab.id}
                  aria-controls={tab.id} onClick={() => setActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>

            {PERSONA_TABS.map((tab) => activeTab === tab.id && (
              <div key={tab.id} id={tab.id} role="tabpanel" aria-labelledby={`tab-${tab.id}`}
                className="panel active">
                <div>
                  <h2>{tab.headline}</h2>
                  <p>{tab.body}</p>
                  <SignInBtn onSignIn={onSignIn}>Sign in to explore</SignInBtn>
                </div>
                <PersonaAppShot id={tab.id} />
              </div>
            ))}
          </div>
        </section>

        <Reveal as="section" className="ai-section" id="ai">
          <div className="wrap landing-split">
            <div>
              <h2>AI Assists. People Decide.</h2>
              <ul className="landing-bullets">
                {AI_BULLETS.map((b) => (
                  <li key={b}><FiZap aria-hidden="true" /> {b}</li>
                ))}
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
        </Reveal>

        <Reveal as="section" className="stats wrap" id="scale">
          <h2>Vetting at scale</h2>
          <p className="lede">
            Aegis draws on the real, published DOHA decision corpus for
            precedents and AI-driven analytics. The people are fictional; the
            case law is not.
          </p>
          <div className="stats-panel">
            {STATS.map(({ value, label }) => (
              <div key={label} className="stat">
                <CountUp value={value} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="cta-band" id="platform">
          <div className="wrap cta-in">
            <div>
              <h2>Walk a case end to end.</h2>
              <p>
                Open John Smith's file: his own statement, the alert that
                started it, and every source behind the decision.
              </p>
              <SignInBtn onSignIn={onSignIn} className="btn">
                Sign in to explore <FiArrowRight aria-hidden="true" />
              </SignInBtn>
            </div>
            <div className="case-stack" aria-hidden="true">
              <div className="cs-card cs-subject">
                <div className="cs-head">
                  <div>
                    <div className="cs-name">John Smith</div>
                    <div className="cs-role">Systems Analyst - T5</div>
                  </div>
                  <div className="cs-dial">62<span>AI risk</span></div>
                </div>
                <div className="cs-pills">
                  <span className="cs-pill cs-warn">Needs review</span>
                  <span className="cs-chip">F</span>
                  <span className="cs-chip">B</span>
                </div>
              </div>
              <div className="cs-card cs-quote">
                <div className="cs-qhead">
                  <span className="cs-qtitle">Subject statement</span>
                  <span className="cs-qtime">Mar 10, 10:20am</span>
                </div>
                <div className="cs-qbody">
                  <span className="cs-avatar">JS</span>
                  <p className="cs-qtext">
                    "I set up repayment on every account after the layoff and
                    reported my travel late, not never. I hope you will take
                    that into consideration."
                  </p>
                </div>
              </div>
              <div className="cs-card cs-alert">
                <div className="cs-atitle">Financial - new delinquency reported</div>
                <ul className="cs-steps">
                  <li><FiCheck aria-hidden="true" /> Identity match 96%</li>
                  <li><FiCheck aria-hidden="true" /> Threshold met</li>
                  <li><FiCheck aria-hidden="true" /> Not previously adjudicated</li>
                </ul>
                <span className="cs-pill cs-neutral">Referred to adjudication</span>
              </div>
            </div>
          </div>
        </Reveal>
      </main>

      <footer className="footer" id="authorities">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <span className="brand"><FiShield aria-hidden="true" /> Aegis</span>
              <p className="footer-about">
                Personnel vetting, end to end. A demonstration platform for the
                Trusted Workforce 2.0 lifecycle.
              </p>
            </div>
            {FOOTER_COLUMNS.map(([title, links]) => (
              <div key={title}>
                <h5>{title}</h5>
                <ul>
                  {links.map(([label, targetId]) => (
                    <li key={label}><a href={`#${targetId}`}>{label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h5>Authorities</h5>
              <ul>
                {AUTHORITIES_LINKS.map(([label, url]) => (
                  <li key={label}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="footer-legal">
            <span>
              Educational demonstration. All identities are fictional; precedents
              and analytics come from published DOHA decisions.
            </span>
            <span>Photography via Unsplash and Pexels.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
