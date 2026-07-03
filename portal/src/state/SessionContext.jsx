import { createContext, useContext, useState } from 'react';

const SESSION_STORAGE_KEY = 'demo.session';
const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [signedIn, setSignedIn] = useState(
    () => localStorage.getItem(SESSION_STORAGE_KEY) === 'active');

  const signIn = () => {
    localStorage.setItem(SESSION_STORAGE_KEY, 'active');
    setSignedIn(true);
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSignedIn(false);
  };

  return (
    <SessionContext.Provider value={{ signedIn, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession requires SessionProvider');
  return ctx;
}
