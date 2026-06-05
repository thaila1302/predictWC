import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  loginWithUsername,
  migrateLegacyLocalAccountsToFirestore,
  registerWithUsername,
  subscribeAccountByUid
} from '../services/auth';

const AUTH_SESSION_KEY = 'predictwc_auth_uid';

const AuthContext = createContext(null);

function readStoredUid() {
  if (typeof window === 'undefined') return '';

  try {
    return window.sessionStorage.getItem(AUTH_SESSION_KEY) || '';
  } catch {
    return '';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sessionUid, setSessionUid] = useState(() => readStoredUid());

  useEffect(() => {
    let active = true;

    migrateLegacyLocalAccountsToFirestore()
      .catch(() => {})
      .finally(() => {
        if (active) {
          setBootstrapping(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (sessionUid) {
        window.sessionStorage.setItem(AUTH_SESSION_KEY, sessionUid);
      } else {
        window.sessionStorage.removeItem(AUTH_SESSION_KEY);
      }
    } catch {
    }
  }, [sessionUid]);

  useEffect(() => {
    if (!sessionUid) {
      setUser(null);
      return () => {};
    }

    return subscribeAccountByUid(sessionUid, (nextAccount) => {
      if (!nextAccount || nextAccount.isLocked) {
        setUser(null);
        setSessionUid('');
        return;
      }

      setUser({
        uid: nextAccount.uid,
        displayName: nextAccount.displayName,
        username: nextAccount.username,
        email: nextAccount.email || '',
        isAdmin: Boolean(nextAccount.isAdmin),
        isLocked: Boolean(nextAccount.isLocked)
      });
    });
  }, [sessionUid]);

  const login = async (payload) => {
    setLoading(true);
    try {
      const nextUser = await loginWithUsername(payload);
      setUser(nextUser);
      setSessionUid(nextUser.uid);
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const nextUser = await registerWithUsername(payload);
      setUser(nextUser);
      setSessionUid(nextUser.uid);
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSessionUid('');
  };

  const value = useMemo(
    () => ({
      user,
      loading: loading || bootstrapping,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout
    }),
    [user, loading, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
