import { FiShield } from 'react-icons/fi';
import { useSession } from '../state/SessionContext.jsx';

export default function SignIn() {
  const { signIn } = useSession();

  return (
    <div className="signin-screen">
      <div className="signin-card">
        <div className="signin-header">
          <div className="signin-seal" aria-hidden="true">DCSA</div>
          <div>
            <div className="signin-app-name">Personnel Vetting</div>
            <div className="signin-app-subtitle">Case Management Demo</div>
          </div>
        </div>

        <div className="signin-consent">
          <h2>Standard Mandatory DoD Notice and Consent</h2>
          <div className="signin-consent-text" role="region"
            aria-label="Standard Mandatory DoD Notice and Consent">
            <p>
              You are accessing a U.S. Government (USG) Information System (IS) that is
              provided for USG-authorized use only. By using this IS (which includes any
              device attached to this IS), you consent to the following conditions:
            </p>
            <ul>
              <li>
                The USG routinely intercepts and monitors communications on this IS for
                purposes including, but not limited to, penetration testing, COMSEC
                monitoring, network operations and defense, personnel misconduct (PM), law
                enforcement (LE), and counterintelligence (CI) investigations.
              </li>
              <li>At any time, the USG may inspect and seize data stored on this IS.</li>
              <li>
                Communications using, or data stored on, this IS are not private, are
                subject to routine monitoring, interception, and search, and may be
                disclosed or used for any USG-authorized purpose.
              </li>
              <li>
                This IS includes security measures (e.g., authentication and access
                controls) to protect USG interests - not for your personal benefit or
                privacy.
              </li>
              <li>
                Notwithstanding the above, using this IS does not constitute consent to
                PM, LE or CI investigative searching or monitoring of the content of
                privileged communications, or work product, related to personal
                representation or advice of attorneys, psychotherapists, or clergy, and
                their assistants. Such communications and work product are private and
                confidential. See User Agreement for details.
              </li>
            </ul>
          </div>
        </div>

        <button type="button" className="btn btn-primary signin-button" onClick={signIn}>
          <FiShield aria-hidden="true" /> Accept conditions and sign in with CAC/PIV
        </button>

        <p className="signin-help">
          Select your DoD PKI certificate when prompted. Common Access Card (CAC) or
          Personal Identity Verification (PIV) required.
        </p>
        <p className="signin-disclaimer">
          Demonstration system - authentication is simulated and all data is synthetic.
        </p>
      </div>
    </div>
  );
}
