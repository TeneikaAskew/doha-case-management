import { useState } from 'react';
import { FiShield } from 'react-icons/fi';
import { useSession } from '../state/SessionContext.jsx';
import { PASSWORD_SHA256S, sha256Hex } from '../accessControl.js';
import { REFS } from '../references.js';

const REFERENCES = [
  ['DOHA Industrial Security Clearance Decisions', REFS.DOHA_DECISIONS,
   'Data source: real published hearing and Appeal Board decisions power the '
   + 'precedent citations, outcome analytics, and sample decision document'],
  ['Defense Office of Hearings and Appeals (DOHA)', REFS.DOHA,
   'The DoD appeals body whose published decisions this demo draws from'],
  ['DOE Office of Hearings and Appeals - Security Cases', REFS.DOE_OHA_CASES,
   'Department of Energy clearance decisions (10 CFR 710), a parallel corpus'],
  ['SEAD 4 - National Security Adjudicative Guidelines', REFS.SEAD4,
   'The 13 guidelines (A-M) and whole-person factors used in case analysis'],
  ['SEAD 3 - Reporting Requirements', REFS.SEAD3,
   'Unofficial foreign-travel reporting behind the travel alerts'],
  ['SEAD 6 - Continuous Evaluation', REFS.SEAD6,
   'Policy basis for the continuous-vetting workflow'],
  ['DCSA Background Investigations', REFS.FIS,
   'Tiered investigation coverage reflected in record checks'],
  ['DCSA Continuous Vetting', REFS.DCSA_CV,
   'CV enrollment and alert categories'],
  ['DCSA Personnel Vetting', REFS.DCSA_PV,
   'Mission context and terminology'],
  ['Standard Form 86 (OPM)', REFS.SF86,
   'Subject self-report sections compared against record checks'],
  ['SEAD 8 - Temporary Eligibility', REFS.SEAD8,
   'Interim eligibility shown on in-process subjects'],
  ['Federal Personnel Vetting Guidelines', REFS.FPVG,
   'Federal vetting standards and terminology'],
  ['Trusted Workforce 2.0 Policy Index', REFS.TW_INDEX,
   'Policy framework for the modernized vetting model'],
  ['DoDI 5200.02 - DoD Personnel Security Program', REFS.DODI_520002,
   'Program-level requirements for personnel security'],
  ['DoD Suitability Guide for Employees', REFS.SUITABILITY,
   'Suitability adjudication concepts'],
  ['CDSE Training Toolkits', REFS.CDSE,
   'Security training resources informing workflow depictions'],
  ['CDSE Personnel Vetting Toolkit', REFS.CDSE_PV,
   'Vetting policy and procedure references'],
  ['CDSE Adjudicator Toolkit', REFS.CDSE_ADJ,
   'Adjudicator-facing resources behind the adjudication tab'],
];

export default function SignIn() {
  const { signIn } = useSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (PASSWORD_SHA256S.includes(await sha256Hex(password))) {
      signIn();
    } else {
      setError('Incorrect access password. Contact the demo owner for access.');
    }
  };

  return (
    <div className="signin-screen">
      <div className="signin-card">
        <div className="signin-header">
          <img className="signin-seal" src={`${import.meta.env.BASE_URL}dcsa-seal.png`}
            alt="DCSA seal" />
          <div>
            <div className="signin-app-name">Personnel Vetting</div>
            <div className="signin-app-subtitle">Case Management Demo</div>
          </div>
        </div>

        <div className="signin-consent">
          <h2>About This Demo</h2>
          <div className="signin-consent-text" role="region"
            aria-label="About this demo">
            <p>
              A demonstration of subject-centric personnel-vetting case management:
              one place to see the whole person - identity and history, record
              checks with source documents, adjudicative-guideline analysis,
              continuous-vetting alerts, and adjudication - built as a React
              single-page app over deterministic, generated case data.
            </p>
            <p>
              The concept is inspired by the DoD personnel security mission and
              leverages publicly released decisions from the{' '}
              <a href="https://doha.ogc.osd.mil/Industrial-Security-Program/"
                target="_blank" rel="noreferrer">
                DOHA Industrial Security Program
              </a>
              : precedent citations, outcome analytics, and the sample decision
              document are drawn from that published corpus.
            </p>
            <p>
              All subjects, alerts, and documents are fictional. No affiliation
              with, or endorsement by, DoD, DCSA, or DOHA is implied.
            </p>
          </div>
        </div>

        <form className="signin-form" onSubmit={submit}>
          <label className="signin-password-label" htmlFor="signin-password">
            Access password
          </label>
          <input id="signin-password" type="password" className="signin-password"
            value={password} autoComplete="current-password"
            onChange={(e) => { setPassword(e.target.value); setError(null); }} />
          {error && <p className="signin-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary signin-button">
            <FiShield aria-hidden="true" /> Sign in with SSO
          </button>
        </form>

        <p className="signin-help">
          Select your DoD PKI certificate when prompted. Common Access Card (CAC) or
          Personal Identity Verification (PIV) required.
        </p>
        <p className="signin-disclaimer">
          Demonstration system - authentication is simulated and all data is synthetic.
        </p>

        <div className="signin-refs">
          <h2>References &amp; Data Sources</h2>
          <table className="signin-refs-table">
            <thead>
              <tr><th>Resource</th><th>Role in this demo</th></tr>
            </thead>
            <tbody>
              {REFERENCES.map(([name, url, role]) => (
                <tr key={name}>
                  <td><a href={url} target="_blank" rel="noreferrer">{name}</a></td>
                  <td>{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
