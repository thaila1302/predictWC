import { Navigate, useLocation } from 'react-router-dom';
import { SECONDARY_UNIT_ID } from '../context/UnitContext';

const ACTIVE_UNIT_KEY = 'predictwc_active_unit';
const AUTH_SESSION_KEY_PREFIX = 'predictwc_auth_uid';

function readSessionValue(key) {
  if (typeof window === 'undefined') return '';

  try {
    return window.sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

export function setActiveUnit(unitId) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(ACTIVE_UNIT_KEY, unitId);
  } catch {
  }
}

export default function UnitAccessRedirect({ children }) {
  const location = useLocation();
  const activeUnit = readSessionValue(ACTIVE_UNIT_KEY);
  const hasDonviSession = Boolean(readSessionValue(`${AUTH_SESSION_KEY_PREFIX}_${SECONDARY_UNIT_ID}`));
  const isDonviPath =
    location.pathname === `/${SECONDARY_UNIT_ID}` || location.pathname.startsWith(`/${SECONDARY_UNIT_ID}/`);
  const isDefaultPath = !isDonviPath;
  const shouldRedirectToDonvi =
    isDefaultPath && (activeUnit === SECONDARY_UNIT_ID || (!activeUnit && hasDonviSession));

  if (shouldRedirectToDonvi) {
    const targetPath = location.pathname === '/' ? `/${SECONDARY_UNIT_ID}` : `/${SECONDARY_UNIT_ID}${location.pathname}`;
    return <Navigate to={`${targetPath}${location.search}${location.hash}`} replace />;
  }

  return children;
}
