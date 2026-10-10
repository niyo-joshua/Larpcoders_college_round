import React, { createContext, useContext, useMemo, useState } from 'react';
import { setAdminToken, clearAdminToken } from '../api/client.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  // In-memory only. Refreshing the page logs the admin out — this is intentional.
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState(null);

  const value = useMemo(
    () => ({
      isAuthed,
      user,
      login: (token, userInfo) => {
        setAdminToken(token);
        setUser(userInfo || null);
        setIsAuthed(true);
      },
      logout: () => {
        clearAdminToken();
        setUser(null);
        setIsAuthed(false);
      },
    }),
    [isAuthed, user]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}