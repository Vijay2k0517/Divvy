import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi } from '../utils/api';

export const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('divvy_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('divvy_token'));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      authApi
        .me()
        .then((u) => {
          setUser(u);
          localStorage.setItem('divvy_user', JSON.stringify(u));
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('divvy_token');
          localStorage.removeItem('divvy_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('divvy_token', data.access_token);
    localStorage.setItem('divvy_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const data = await authApi.signup(name, email, password);
    localStorage.setItem('divvy_token', data.access_token);
    localStorage.setItem('divvy_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem('divvy_token');
    localStorage.removeItem('divvy_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await authApi.me();
    setUser(u);
    localStorage.setItem('divvy_user', JSON.stringify(u));
    return u;
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
