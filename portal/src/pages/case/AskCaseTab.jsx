import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiMessageCircle, FiSend, FiFileText, FiCornerUpRight, FiTrash2,
  FiPlus, FiEdit2, FiChevronLeft, FiChevronRight, FiCheck,
} from 'react-icons/fi';
import AIBadge from '../../components/AIBadge.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';
import Toggle from '../../components/Toggle.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import { answerQuestion, configuredApiKey } from './caseAgent.js';
import { exampleQuestions } from './caseAssistant.js';

const GEMINI_PREF_KEY = 'demo.useGemini';
const PANEL_PREF_KEY = 'demo.askPanel';

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

function ConversationList({
  conversations, activeId, onSelect, onRename, onDelete,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (conv) => { setEditingId(conv.id); setEditValue(conv.title); };
  const commitEdit = () => {
    const title = editValue.trim();
    if (title) onRename(editingId, title);
    setEditingId(null);
  };

  if (!conversations.length) {
    return <p className="ask-convo-empty muted">No conversations yet.</p>;
  }
  return (
    <ul className="ask-convo-list">
      {conversations.map((conv) => (
        <li key={conv.id}
          className={`ask-convo-item ${conv.id === activeId ? 'active' : ''}`}>
          {editingId === conv.id ? (
            <form className="ask-convo-edit"
              onSubmit={(e) => { e.preventDefault(); commitEdit(); }}>
              <input aria-label="Rename conversation" value={editValue} autoFocus
                onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit} />
              <button type="submit" aria-label="Save name"><FiCheck aria-hidden="true" /></button>
            </form>
          ) : (
            <>
              <button type="button" className="ask-convo-select"
                onClick={() => onSelect(conv.id)} title={conv.title}>
                <FiMessageCircle aria-hidden="true" />
                <span>{conv.title}</span>
              </button>
              <span className="ask-convo-actions">
                <button type="button" aria-label={`Rename ${conv.title}`}
                  onClick={() => startEdit(conv)}><FiEdit2 aria-hidden="true" /></button>
                <button type="button" aria-label={`Delete ${conv.title}`}
                  onClick={() => onDelete(conv.id)}><FiTrash2 aria-hidden="true" /></button>
              </span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function AskCaseTab({ caseData }) {
  const {
    askThreadState, addAskMessage, newAskConversation,
    setActiveConversation, renameAskConversation, deleteAskConversation,
  } = useDemo();
  const caseId = caseData.subject.id;
  const { activeId, conversations } = askThreadState(caseId);
  const activeConv = conversations.find((c) => c.id === activeId);
  const messages = activeConv?.messages || [];

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null); // streamed text of the pending answer
  const [docUrl, setDocUrl] = useState(null);
  const [panelOpen, setPanelOpen] = useState(
    () => localStorage.getItem(PANEL_PREF_KEY) !== 'closed',
  );
  const keyConfigured = Boolean(configuredApiKey());
  const [useGemini, setUseGemini] = useState(
    () => keyConfigured && localStorage.getItem(GEMINI_PREF_KEY) !== 'off',
  );

  const toggleGemini = () => setUseGemini((on) => {
    const next = !on;
    localStorage.setItem(GEMINI_PREF_KEY, next ? 'on' : 'off');
    return next;
  });

  const togglePanel = () => setPanelOpen((open) => {
    const next = !open;
    localStorage.setItem(PANEL_PREF_KEY, next ? 'open' : 'closed');
    return next;
  });

  const startNewConversation = () => {
    if (busy) return;
    newAskConversation(caseId);
    setDraft(null);
    setDocUrl(null);
  };

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
    // first turn of a case (or of a fresh conversation) needs a target thread
    const convId = activeId || newAskConversation(caseId);
    addAskMessage(caseId, convId, { role: 'user', text: q });
    const res = await answerQuestion(caseData, q, {
      history: messages,
      apiKey: useGemini ? configuredApiKey() : '',
      onChunk: (t) => setDraft(t), // live Gemini stream types as it arrives
    });
    if (!res.streamed) await typeOut(res.answer);
    addAskMessage(caseId, convId, {
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
        </div>
      </div>

      <div className="ask-layout">
        <aside className={`ask-sidebar ${panelOpen ? 'open' : 'collapsed'}`}>
          <button type="button" className="ask-panel-toggle" onClick={togglePanel}
            aria-label={panelOpen ? 'Hide conversations' : 'Show conversations'}
            aria-expanded={panelOpen}>
            {panelOpen ? <FiChevronLeft aria-hidden="true" />
              : <FiChevronRight aria-hidden="true" />}
            {panelOpen && <span>Conversations</span>}
          </button>
          {panelOpen && (
            <>
              <button type="button" className="ask-new" onClick={startNewConversation}
                disabled={busy}>
                <FiPlus aria-hidden="true" /> New conversation
              </button>
              <ConversationList conversations={conversations} activeId={activeId}
                onSelect={(id) => setActiveConversation(caseId, id)}
                onRename={(id, title) => renameAskConversation(caseId, id, title)}
                onDelete={(id) => deleteAskConversation(caseId, id)} />
            </>
          )}
        </aside>

        <div className="ask-main">
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
        </div>
      </div>

      <p className="muted ask-disclaimer">
        Demo assistant - answers come only from this case file
        {useGemini ? ', phrased by Gemini' : ''}. AI-assisted; human decision authority.
      </p>
    </div>
  );
}
