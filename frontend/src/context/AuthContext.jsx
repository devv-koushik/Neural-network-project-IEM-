import { createContext, useEffect, useState } from 'react';
import { loginUser, registerUser, logoutUser, setAuthToken } from '../services/api';

export const AuthContext = createContext(null);

const USER_STORAGE_KEY = 'sc_auth_user';
const DEMO_ADMIN_NAME = 'Koushik Admin';

function normalizeUser(userData) {
  if (!userData || typeof userData !== 'object') return null;

  if (userData.email === 'admin@demo.com' && userData.name !== DEMO_ADMIN_NAME) {
    return { ...userData, name: DEMO_ADMIN_NAME };
  }

  return userData;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return normalizeUser(parsed);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // The JWT itself lives in localStorage (see api.js) and is attached to
  // every request by apiClient's interceptor, so there's nothing extra to
  // rehydrate here on mount beyond the cached `user` object above.

  useEffect(() => {
    if (user) {
      const normalizedUser = normalizeUser(user);
      if (!normalizedUser) {
        localStorage.removeItem(USER_STORAGE_KEY);
        return;
      }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
      if (normalizedUser !== user) setUser(normalizedUser);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  async function login(email, password) {
    setLoading(true);
    try {
      const account = await loginUser({ email, password });
      const normalizedAccount = normalizeUser(account);
      setUser(normalizedAccount);
      return normalizedAccount;
    } finally {
      setLoading(false);
    }
  }

  async function register(name, email, password) {
    setLoading(true);
    try {
      const account = await registerUser({ name, email, password });
      setUser(account);
      return account;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    // Synchronously clear both storage keys FIRST before any async work
    // so a fast navigation after logout never sees stale auth state.
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('sc_auth_token');
    setUser(null);
    // Best-effort server-side logout (stateless JWT, so failure is harmless)
    try { await logoutUser(); } catch { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
