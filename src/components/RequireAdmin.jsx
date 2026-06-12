import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnit } from '../context/UnitContext';

export default function RequireAdmin({ children }) {
  const { user } = useAuth();
  const { pathFor } = useUnit();

  if (!user?.isAdmin) {
    return <Navigate to={pathFor('/matches')} replace />;
  }

  return children;
}
