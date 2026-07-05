import { createContext, useContext, useState } from 'react';
import { ALERT_TRANSITIONS } from '../domain.js';

const EMPTY = {
  alertStates: {}, decisions: {}, roiEntries: {}, worksheetRatings: {}, askThreads: {},
};
const DemoContext = createContext(null);

function load() {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem('demo.state') || '{}') };
  } catch {
    return EMPTY;
  }
}

const genId = () => (globalThis.crypto?.randomUUID
  ? globalThis.crypto.randomUUID()
  : `conv-${Date.now()}-${Math.random().toString(16).slice(2)}`);

/* A case's Ask-the-Case state is a set of named conversations plus which one
   is active: { activeId, conversations: [{ id, title, messages: [] }] }.
   Earlier builds stored a single flat message array per case; migrate that
   shape on read so no existing thread is lost. */
function normalizeThread(raw) {
  if (Array.isArray(raw)) {
    if (!raw.length) return { activeId: null, conversations: [] };
    const id = 'conv-1';
    return { activeId: id, conversations: [{ id, title: 'Conversation 1', messages: raw }] };
  }
  if (raw && Array.isArray(raw.conversations)) {
    return { activeId: raw.activeId ?? raw.conversations[0]?.id ?? null,
      conversations: raw.conversations };
  }
  return { activeId: null, conversations: [] };
}

export function DemoProvider({ children }) {
  const [demo, setDemo] = useState(load);

  const persist = (next) => {
    localStorage.setItem('demo.state', JSON.stringify(next));
    setDemo(next);
  };

  const dispositionAlert = (alertId, nextState, currentState) => {
    const effective = demo.alertStates[alertId] || currentState;
    if (!ALERT_TRANSITIONS[effective]?.includes(nextState)) {
      throw new Error(`Illegal alert transition ${effective} -> ${nextState}`);
    }
    persist({ ...demo, alertStates: { ...demo.alertStates, [alertId]: nextState } });
  };

  // functional update: consecutive appends in one turn must not clobber each other
  const appendTo = (bucket, caseId, entry) =>
    setDemo((prev) => {
      const next = {
        ...prev,
        [bucket]: { ...prev[bucket], [caseId]: [...(prev[bucket][caseId] || []), entry] },
      };
      localStorage.setItem('demo.state', JSON.stringify(next));
      return next;
    });

  // functional update over one case's normalized conversation state, so
  // rapid appends (user turn + assistant turn) never clobber each other
  const mutateThreads = (caseId, fn) =>
    setDemo((prev) => {
      const nextThread = fn(normalizeThread(prev.askThreads[caseId]));
      const next = {
        ...prev,
        askThreads: { ...prev.askThreads, [caseId]: nextThread },
      };
      localStorage.setItem('demo.state', JSON.stringify(next));
      return next;
    });

  // read-only selector: the current conversations for a case, migrated forward
  const askThreadState = (caseId) => normalizeThread(demo.askThreads[caseId]);

  // create a fresh conversation, make it active, and return its id
  const newAskConversation = (caseId) => {
    const id = genId();
    mutateThreads(caseId, (t) => ({
      activeId: id,
      conversations: [...t.conversations,
        { id, title: `Conversation ${t.conversations.length + 1}`, messages: [] }],
    }));
    return id;
  };

  const setActiveConversation = (caseId, convId) =>
    mutateThreads(caseId, (t) => ({ ...t, activeId: convId }));

  const renameAskConversation = (caseId, convId, title) =>
    mutateThreads(caseId, (t) => ({
      ...t,
      conversations: t.conversations.map((c) => (
        c.id === convId ? { ...c, title } : c)),
    }));

  const deleteAskConversation = (caseId, convId) =>
    mutateThreads(caseId, (t) => {
      const conversations = t.conversations.filter((c) => c.id !== convId);
      const activeId = t.activeId === convId
        ? (conversations[0]?.id ?? null) : t.activeId;
      return { activeId, conversations };
    });

  // append a message to the given conversation, creating it if it is not
  // present yet (first turn of a brand-new conversation)
  const addAskMessage = (caseId, convId, message) =>
    mutateThreads(caseId, (t) => {
      const exists = t.conversations.some((c) => c.id === convId);
      const conversations = exists
        ? t.conversations.map((c) => (
          c.id === convId ? { ...c, messages: [...c.messages, message] } : c))
        : [...t.conversations, {
          id: convId,
          title: `Conversation ${t.conversations.length + 1}`,
          messages: [message],
        }];
      return { activeId: convId, conversations };
    });

  const setWorksheetRating = (caseId, factorIndex, rating, note) =>
    persist({
      ...demo,
      worksheetRatings: {
        ...demo.worksheetRatings,
        [caseId]: {
          ...(demo.worksheetRatings[caseId] || {}),
          [factorIndex]: { rating, note },
        },
      },
    });

  const value = {
    demo,
    dispositionAlert,
    recordDecision: (caseId, d) => appendTo('decisions', caseId, d),
    addRoiEntry: (caseId, e) => appendTo('roiEntries', caseId, e),
    askThreadState,
    addAskMessage,
    newAskConversation,
    setActiveConversation,
    renameAskConversation,
    deleteAskConversation,
    setWorksheetRating,
    reset: () => persist(EMPTY),
  };
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo requires DemoProvider');
  return ctx;
}
