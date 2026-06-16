import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  loginWithUsername,
  migrateLegacyLocalAccountsToFirestore,
  registerWithUsername,
  subscribeAccountByUid,
  updateUserDisplayName
} from '../services/auth';
import { DEFAULT_UNIT_ID, SECONDARY_UNIT_ID, useUnit } from './UnitContext';
import { setActiveUnit } from '../components/UnitAccessRedirect';
import useResumeRefreshKey from '../hooks/useResumeRefreshKey';

const AUTH_SESSION_KEY_PREFIX = 'predictwc_auth_uid';

const AuthContext = createContext(null);

function readStoredUid(unitId) {
  if (typeof window === 'undefined') return '';

  try {
    const unitSession = window.sessionStorage.getItem(`${AUTH_SESSION_KEY_PREFIX}_${unitId}`) || '';
    if (unitSession || unitId !== 'default') return unitSession;

    return window.sessionStorage.getItem(AUTH_SESSION_KEY_PREFIX) || '';
  } catch {
    return '';
  }
}

export function AuthProvider({ children }) {
  const { unitId } = useUnit();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sessionUid, setSessionUid] = useState(() => readStoredUid(unitId));
  const resumeRefreshKey = useResumeRefreshKey();

  useEffect(() => {
    setUser(null);
    setSessionUid(readStoredUid(unitId));
  }, [unitId]);

  useEffect(() => {
    let active = true;
    setBootstrapping(true);

    migrateLegacyLocalAccountsToFirestore(unitId)
      .catch(() => {})
      .finally(() => {
        if (active) {
          setBootstrapping(false);
        }
      });

    return () => {
      active = false;
    };
  }, [unitId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (sessionUid) {
        window.sessionStorage.setItem(`${AUTH_SESSION_KEY_PREFIX}_${unitId}`, sessionUid);
        if (unitId === 'default') {
          window.sessionStorage.removeItem(AUTH_SESSION_KEY_PREFIX);
        }
      } else {
        window.sessionStorage.removeItem(`${AUTH_SESSION_KEY_PREFIX}_${unitId}`);
      }
    } catch {
    }
  }, [sessionUid, unitId]);

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

      if (nextAccount.unitId !== unitId) {
        setActiveUnit(nextAccount.unitId);
        setUser(null);

        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem(`${AUTH_SESSION_KEY_PREFIX}_${nextAccount.unitId}`, sessionUid);
            window.sessionStorage.removeItem(`${AUTH_SESSION_KEY_PREFIX}_${unitId}`);
          } catch {
          }

          const currentPath = window.location.pathname;
          const nextPath =
            nextAccount.unitId === SECONDARY_UNIT_ID
              ? currentPath === '/'
                ? `/${SECONDARY_UNIT_ID}`
                : `/${SECONDARY_UNIT_ID}${currentPath}`
              : currentPath.replace(new RegExp(`^/${SECONDARY_UNIT_ID}(?=/|$)`), '') || '/';
          window.location.replace(`${nextPath}${window.location.search}${window.location.hash}`);
        }
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
  }, [resumeRefreshKey, sessionUid, unitId]);

  const login = async (payload) => {
    setLoading(true);
    try {
      const nextUser = await loginWithUsername({ ...payload, unitId });
      setActiveUnit(nextUser.unitId);
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
      const nextUser = await registerWithUsername({ ...payload, unitId });
      setActiveUnit(nextUser.unitId);
      setUser(nextUser);
      setSessionUid(nextUser.uid);
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setActiveUnit(DEFAULT_UNIT_ID);
    setUser(null);
    setSessionUid('');
  };

  const updateDisplayName = async (displayName) => {
    if (!user?.uid) {
      throw new Error('Không tìm thấy tài khoản.');
    }

    await updateUserDisplayName(user.uid, displayName);
  };

  const value = useMemo(
    () => ({
      user,
      loading: loading || bootstrapping,
      isAuthenticated: Boolean(user),
      login,
      register,
      updateDisplayName,
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
