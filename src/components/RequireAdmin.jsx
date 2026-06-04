import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAdmin({ children }) {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/matches" replace />;
  }

  return children;
}
