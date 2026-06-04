import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const MATCH_OVERRIDES_KEY = 'predictwc:match-overrides';

const DevelopModeContext = createContext(null);

function readStoredJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizePatch(patch) {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

export function DevelopModeProvider({ children }) {
  const [matchOverrides, setMatchOverrides] = useState(() => readStoredJson(MATCH_OVERRIDES_KEY, {}));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MATCH_OVERRIDES_KEY, JSON.stringify(matchOverrides));
  }, [matchOverrides]);

  const updateMatchOverride = useCallback((matchId, patch) => {
    if (!matchId) return;

    setMatchOverrides((current) => ({
      ...current,
      [matchId]: {
        ...(current[matchId] || {}),
        ...normalizePatch(patch)
      }
    }));
  }, []);

  const resetMatchOverride = useCallback((matchId) => {
    if (!matchId) return;

    setMatchOverrides((current) => {
      if (!current[matchId]) return current;
      const next = { ...current };
      delete next[matchId];
      return next;
    });
  }, []);

  const resetAllOverrides = useCallback(() => {
    setMatchOverrides({});
  }, []);

  const applyMatchOverrides = useCallback(
    (matches) =>
      matches.map((match) => ({
        ...match,
        ...(matchOverrides[match.id] || {})
      })),
    [matchOverrides]
  );

  const value = useMemo(
    () => ({
      matchOverrides,
      updateMatchOverride,
      resetMatchOverride,
      resetAllOverrides,
      applyMatchOverrides
    }),
    [matchOverrides, updateMatchOverride, resetMatchOverride, resetAllOverrides, applyMatchOverrides]
  );

  return <DevelopModeContext.Provider value={value}>{children}</DevelopModeContext.Provider>;
}

export function useDevelopMode() {
  const context = useContext(DevelopModeContext);

  if (!context) {
    throw new Error('useDevelopMode must be used within DevelopModeProvider');
  }

  return context;
}
