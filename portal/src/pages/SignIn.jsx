import { useState } from 'react';
import { FiShield, FiArrowLeft } from 'react-icons/fi';
import { useSession } from '../state/SessionContext.jsx';
import { PASSWORD_SHA256S, sha256Hex } from '../accessControl.js';
import { REFS } from '../references.js';

const REFERENCE_GROUPS = [
  ['Data Sources', [
    ['DOHA Industrial Security Clearance Decisions', REFS.DOHA_DECISIONS,
     'Data source: real published hearing and Appeal Board decisions power the '
     + 'precedent citations, outcome analytics, and sample decision document'],
    ['Defense Office of Hearings and Appeals (DOHA)', REFS.DOHA,
     'The DoD appeals body whose published decisions this demo draws from'],
    ['DOE Office of Hearings and Appeals - Security Cases', REFS.DOE_OHA_CASES,
     'Department of Energy clearance decisions (10 CFR 710), a parallel corpus'],
  ]],
  ['Policy Directives', [
    ['NCSC Security Executive Agent Policy (source index)', REFS.NCSC_POLICY,
     'Official ODNI index of all Security Executive Agent directives'],
    ['SEAD 1 - Security Executive Agent Authorities', REFS.SEAD1,
     'Foundational authorities for the federal vetting enterprise'],
    ['SEAD 2 - Use of Polygraph', REFS.SEAD2,
     'Polygraph in personnel security vetting (not yet depicted in the demo)'],
    ['SEAD 3 - Reporting Requirements', REFS.SEAD3,
     'Self-reporting obligations behind the unreported-travel alerts'],
    ['SEAD 4 - National Security Adjudicative Guidelines', REFS.SEAD4,
     'The 13 guidelines (A-M) and whole-person factors used in case analysis'],
    ['SEAD 5 - Publicly Available Social Media Information', REFS.SEAD5,
     'Basis for the SEAD-5 (PAEI) social media data provider'],
    ['SEAD 6 - Continuous Evaluation', REFS.SEAD6,
     'Policy basis for the continuous-vetting workflow'],
    ['SEAD 7 - Reciprocity', REFS.SEAD7,
     'Cross-agency acceptance of investigations and adjudications'],
    ['SEAD 8 - Temporary Eligibility', REFS.SEAD8,
     'Interim eligibility shown on in-process subjects'],
    ['SEAD 9 - Whistleblower Protection', REFS.SEAD9,
     'Appellate review when eligibility actions are alleged to be retaliatory'],
    ['Federal Personnel Vetting Guidelines', REFS.FPVG,
     'Federal vetting standards and terminology'],
    ['Trusted Workforce 2.0 Policy Index', REFS.TW_INDEX,
     'Policy framework for the modernized vetting model'],
    ['DoDI 5200.02 - DoD Personnel Security Program', REFS.DODI_520002,
     'Program-level requirements for personnel security'],
    ['DoD Suitability Guide for Employees', REFS.SUITABILITY,
     'Suitability adjudication concepts'],
  ]],
  ['Legal Authorities', [
    ['Executive Order 12968 - Access to Classified Information', REFS.EO_12968,
     'Executive-order foundation for eligibility and access determinations'],
    ['Executive Order 10865 - Safeguarding Classified Information Within '
     + 'Industry', REFS.EO_10865,
     'Root authority for the DOHA industrial program and its published decisions'],
    ['32 CFR Part 147 - Adjudicative Guidelines', REFS.CFR_147,
     'Codified adjudicative guidelines that preceded SEAD 4'],
    ['DoD Directive 5220.6 - Defense Industrial Personnel Security '
     + 'Clearance Review Program', REFS.DODD_52206,
     'Hearing and appeal procedures behind the DOHA precedent decisions'],
    ['Fair Credit Reporting Act (FCRA)', REFS.FCRA,
     'Governs the consumer credit reports used in financial record checks'],
    ['Privacy Act of 1974', REFS.PRIVACY_ACT,
     'Protections for the personal records a vetting system maintains'],
  ]],
  ['Standard Forms (OPM)', [
    ['Federal Investigation Forms (index)', REFS.OPM_FORMS,
     'All OPM investigative questionnaires and release forms'],
    ['SF-85 - Questionnaire for Non-Sensitive Positions', REFS.SF85,
     'Self-report form for T1 low-risk positions'],
    ['SF-85P - Questionnaire for Public Trust Positions', REFS.SF85P,
     'Self-report form for T2/T4 public trust positions'],
    ['SF-86 - Questionnaire for National Security Positions', REFS.SF86,
     'Subject self-report sections compared against record checks (T3/T5)'],
  ]],
  ['DCSA Mission', [
    ['DCSA Personnel Vetting', REFS.DCSA_PV,
     'Mission context and terminology'],
    ['DCSA Background Investigations', REFS.FIS,
     'Tiered investigation coverage reflected in record checks'],
    ['DCSA Continuous Vetting', REFS.DCSA_CV,
     'CV enrollment and alert categories'],
    ['NBIS - National Background Investigation Services', REFS.NBIS,
     'The eApp intake system case timelines reference'],
    ['FBI Next Generation Identification (Rap Back)', REFS.RAPBACK,
     'Arrest-notification subscriptions behind the criminal CV alerts'],
  ]],
  ['Training', [
    ['CDSE Training Toolkits', REFS.CDSE,
     'Security training resources informing workflow depictions'],
    ['CDSE Personnel Vetting Toolkit', REFS.CDSE_PV,
     'Vetting policy and procedure references'],
    ['CDSE Adjudicator Toolkit', REFS.CDSE_ADJ,
     'Adjudicator-facing resources behind the adjudication tab'],
  ]],
];

export default function SignIn({ onBack }) {
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
        {onBack && (
          <button type="button" className="btn btn-ghost signin-back" onClick={onBack}>
            <FiArrowLeft aria-hidden="true" /> Back to overview
          </button>
        )}
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
            {REFERENCE_GROUPS.map(([group, rows]) => (
              <tbody key={group}>
                <tr className="signin-refs-group">
                  <th colSpan={2}>{group}</th>
                </tr>
                {rows.map(([name, url, role]) => (
                  <tr key={name}>
                    <td><a href={url} target="_blank" rel="noreferrer">{name}</a></td>
                    <td>{role}</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    </div>
  );
}
