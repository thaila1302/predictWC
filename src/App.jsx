import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import MatchesPage from './pages/MatchesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import KnockoutPage from './pages/KnockoutPage';
import RoundOf16Page from './pages/RoundOf16Page';
import QuarterFinalsPage from './pages/QuarterFinalsPage';
import SemiFinalsPage from './pages/SemiFinalsPage';
import ThirdPlacePage from './pages/ThirdPlacePage';
import FinalPage from './pages/FinalPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import HistoryPage from './pages/HistoryPage';
import { DevelopModeProvider } from './context/DevelopModeContext';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';

export default function App() {
  const unitRoutes = (prefix = '') => (
    <>
      <Route path={`${prefix}/auth`} element={<AuthPage />} />
      <Route
        path={prefix || '/'}
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to={`${prefix}/matches`} replace />} />
        <Route path="knockout" element={<KnockoutPage />} />
        <Route path="round-of-16" element={<RoundOf16Page />} />
        <Route path="quarter-finals" element={<QuarterFinalsPage />} />
        <Route path="semi-finals" element={<SemiFinalsPage />} />
        <Route path="third-place" element={<ThirdPlacePage />} />
        <Route path="final" element={<FinalPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route
          path="history"
          element={
            <RequireAdmin>
              <HistoryPage />
            </RequireAdmin>
          }
        />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
      </Route>
    </>
  );

  return (
    <DevelopModeProvider>
      <AuthProvider>
        <Routes>
          {unitRoutes()}
          {unitRoutes('/donvi')}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </DevelopModeProvider>
  );
}
