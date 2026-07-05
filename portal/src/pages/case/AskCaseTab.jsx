import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiMessageCircle, FiSend, FiFileText, FiCornerUpRight, FiTrash2,
} from 'react-icons/fi';
import AIBadge from '../../components/AIBadge.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';
import Toggle from '../../components/Toggle.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import { answerQuestion, configuredApiKey } from './caseAgent.js';
import { exampleQuestions } from './caseAssistant.js';

const GEMINI_PREF_KEY = 'demo.useGemini';

function CitationChips({ citations, onOpenDoc }) {
  const [, setParams] = useSearchParams();
  if (!citations.length) return null;
  return (
    <div className="ask-citations">
      {citations.map((c) => (
        <button key={`${c.tab}-${c.label}`} type="button" className="evidence-chip"
          onClick={() => (c.docUrl ? onOpenDoc(c.docUrl) : setParams({ tab: c.tab }))}>
          {c.docUrl ? <FiFileText aria-hidden="true" /> : <FiCornerUpRight aria-hidden="true" />}
          {c.label}
        </button>
      ))}
    </div>
  );
}

export default function AskCaseTab({ caseData }) {
  const { demo, addAskMessage, clearAskThread } = useDemo();
  const caseId = caseData.subject.id;
  const messages = demo.askThreads[caseId] || [];
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null); // streamed text of the pending answer
  const [docUrl, setDocUrl] = useState(null);
  const keyConfigured = Boolean(configuredApiKey());
  const [useGemini, setUseGemini] = useState(
    () => keyConfigured && localStorage.getItem(GEMINI_PREF_KEY) !== 'off',
  );

  const toggleGemini = () => setUseGemini((on) => {
    const next = !on;
    localStorage.setItem(GEMINI_PREF_KEY, next ? 'on' : 'off');
    return next;
  });

  // typewriter reveal for non-streamed (local) answers; instant in tests
  const typeOut = async (text) => {
    if (import.meta.env.MODE === 'test') return;
    for (let i = 0; i < text.length; i += 6) {
      setDraft(text.slice(0, i + 6));
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => { setTimeout(r, 12); });
    }
  };

  const ask = async (question) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);
    addAskMessage(caseId, { role: 'user', text: q });
    const res = await answerQuestion(caseData, q, {
      history: messages,
      apiKey: useGemini ? configuredApiKey() : '',
      onChunk: (t) => setDraft(t), // live Gemini stream types as it arrives
    });
    if (!res.streamed) await typeOut(res.answer);
    addAskMessage(caseId, {
      role: 'assistant', text: res.answer, citations: res.citations,
      engine: res.engine, error: res.error,
      wantedGemini: useGemini && keyConfigured,
    });
    setDraft(null);
    setBusy(false);
  };

  return (
    <div className="card ask-case">
      <div className="worksheet-head">
        <h3><FiMessageCircle className="section-icon" aria-hidden="true" />
          Ask the Case <AIBadge /></h3>
        <div className="ask-controls">
          <Toggle checked={useGemini} disabled={!keyConfigured}
            onChange={toggleGemini} label="Use Gemini" />
          {!keyConfigured && (
            <span className="ask-engine">
              Simulated - set VITE_GEMINI_API_KEY to enable Gemini
            </span>
          )}
          {messages.length > 0 && (
            <button type="button" className="ask-clear" title="Clear conversation"
              aria-label="Clear conversation" disabled={busy}
              onClick={() => clearAskThread(caseId)}>
              <FiTrash2 aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="ask-thread">
        {messages.length === 0 && (
          <div className="ask-empty">
            <p className="muted">Ask anything about this case file - guidelines, interviews,
              alerts, finances, travel, documents. Try one of these:</p>
            <div className="ask-examples">
              {exampleQuestions(caseData).map((q) => (
                <button key={q} type="button" className="ask-example" onClick={() => ask(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ask-msg ${m.role}`}>
            <div className="ask-bubble">
              <p>{m.text}</p>
              {m.role === 'assistant' && (
                <CitationChips citations={m.citations || []}
                  onOpenDoc={(url) => setDocUrl(docUrl === url ? null : url)} />
              )}
              {m.role === 'assistant' && m.wantedGemini && m.engine === 'local'
                && m.error && (
                <p className="ask-fallback-note">
                  Gemini unavailable ({m.error.split(':')[0]}) - answered from
                  local retrieval.
                </p>
              )}
            </div>
          </div>
        ))}
        {draft && (
          <div className="ask-msg assistant">
            <div className="ask-bubble">
              <p>{draft}<span className="ask-caret" aria-hidden="true" /></p>
            </div>
          </div>
        )}
        {busy && !draft && <p className="muted ask-busy">Searching the case file…</p>}
        {docUrl && <DocumentViewer url={docUrl} />}
      </div>

      <form className="ask-form" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <input type="text" aria-label="Ask about this case" value={input}
          placeholder="Ask about this case…"
          onChange={(e) => setInput(e.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
          <FiSend aria-hidden="true" /> Ask
        </button>
      </form>

      <p className="muted ask-disclaimer">
        Demo assistant - answers come only from this case file
        {useGemini ? ', phrased by Gemini' : ''}. AI-assisted; human decision authority.
      </p>
    </div>
  );
}
