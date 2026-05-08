import React, { createContext, useState, useEffect } from 'react';
import { getUser, setAuth as setLocalAuth, clearAuth as clearLocalAuth } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (u) setUser(u);
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    setLocalAuth(token, userData);
    setUser(userData);
  };

  const logout = () => {
    clearLocalAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
