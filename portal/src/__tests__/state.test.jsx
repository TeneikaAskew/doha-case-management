import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { PersonaProvider, usePersona } from '../state/PersonaContext.jsx';
import { DemoProvider, useDemo } from '../state/DemoContext.jsx';

beforeEach(() => localStorage.clear());

describe('PersonaContext', () => {
  it('defaults to adjudicator and persists changes', () => {
    const wrapper = ({ children }) => <PersonaProvider>{children}</PersonaProvider>;
    const { result } = renderHook(() => usePersona(), { wrapper });
    expect(result.current.persona.id).toBe('adjudicator');
    act(() => result.current.setPersona('analyst'));
    expect(result.current.persona.id).toBe('analyst');
    expect(localStorage.getItem('demo.persona')).toBe('analyst');
  });
});

describe('DemoContext', () => {
  const wrapper = ({ children }) => <DemoProvider>{children}</DemoProvider>;

  it('dispositions alerts through legal transitions only', () => {
    const { result } = renderHook(() => useDemo(), { wrapper });
    act(() => result.current.dispositionAlert('ALERT-1', 'IDENTITY_CONFIRMED', 'NEW'));
    expect(result.current.demo.alertStates['ALERT-1']).toBe('IDENTITY_CONFIRMED');
    expect(() =>
      act(() => result.current.dispositionAlert('ALERT-1', 'ADJUDICATED', 'IDENTITY_CONFIRMED'))
    ).toThrow();
  });

  it('records decisions and roi entries per case, and resets', () => {
    const { result } = renderHook(() => useDemo(), { wrapper });
    act(() => result.current.recordDecision('SUBJ-001',
      { date: '2026-07-02', adjudicator: 'Demo user', action: 'SOR', rationale: 'Test' }));
    act(() => result.current.addRoiEntry('SUBJ-001',
      { date: '2026-07-02', investigator: 'Demo user', item: 'Financial', text: 'Note' }));
    expect(result.current.demo.decisions['SUBJ-001']).toHaveLength(1);
    expect(result.current.demo.roiEntries['SUBJ-001']).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('demo.state')).decisions['SUBJ-001']).toHaveLength(1);
    act(() => result.current.reset());
    expect(result.current.demo.decisions).toEqual({});
  });
});
