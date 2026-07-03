import { createContext, useContext, useState } from 'react';
import { PERSONAS } from '../domain.js';

const PersonaContext = createContext(null);

export function PersonaProvider({ children }) {
  const [personaId, setPersonaId] = useState(
    () => localStorage.getItem('demo.persona') || 'adjudicator');
  const persona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[2];
  const setPersona = (id) => {
    localStorage.setItem('demo.persona', id);
    setPersonaId(id);
  };
  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona requires PersonaProvider');
  return ctx;
}
