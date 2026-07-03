import { createContext, useContext, useState } from 'react';
import { ALERT_TRANSITIONS } from '../domain.js';

const EMPTY = { alertStates: {}, decisions: {}, roiEntries: {} };
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

  const appendTo = (bucket, caseId, entry) =>
    persist({
      ...demo,
      [bucket]: { ...demo[bucket], [caseId]: [...(demo[bucket][caseId] || []), entry] },
    });

  const value = {
    demo,
    dispositionAlert,
    recordDecision: (caseId, d) => appendTo('decisions', caseId, d),
    addRoiEntry: (caseId, e) => appendTo('roiEntries', caseId, e),
    reset: () => persist(EMPTY),
  };
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo requires DemoProvider');
  return ctx;
}
