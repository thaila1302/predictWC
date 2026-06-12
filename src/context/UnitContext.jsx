import { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const DEFAULT_UNIT_ID = 'default';
export const SECONDARY_UNIT_ID = 'donvi';

const UnitContext = createContext(null);

function getUnitFromPathname(pathname) {
  const firstSegment = String(pathname || '')
    .split('/')
    .filter(Boolean)[0];

  return firstSegment === SECONDARY_UNIT_ID ? SECONDARY_UNIT_ID : DEFAULT_UNIT_ID;
}

export function UnitProvider({ children }) {
  const location = useLocation();
  const unitId = getUnitFromPathname(location.pathname);
  const basePath = unitId === DEFAULT_UNIT_ID ? '' : `/${unitId}`;

  const value = useMemo(
    () => ({
      unitId,
      basePath,
      pathFor: (path) => `${basePath}${path.startsWith('/') ? path : `/${path}`}`
    }),
    [basePath, unitId]
  );

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnit() {
  const context = useContext(UnitContext);

  if (!context) {
    throw new Error('useUnit must be used within UnitProvider');
  }

  return context;
}
