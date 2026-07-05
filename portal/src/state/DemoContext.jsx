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
    addAskMessage: (caseId, m) => appendTo('askThreads', caseId, m),
    clearAskThread: (caseId) => persist({
      ...demo,
      askThreads: { ...demo.askThreads, [caseId]: [] },
    }),
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
