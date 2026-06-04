import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import MatchesPage from './pages/MatchesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import GroupStagePage from './pages/GroupStagePage';
import KnockoutPage from './pages/KnockoutPage';
import RoundOf16Page from './pages/RoundOf16Page';
import QuarterFinalsPage from './pages/QuarterFinalsPage';
import SemiFinalsPage from './pages/SemiFinalsPage';
import ThirdPlacePage from './pages/ThirdPlacePage';
import FinalPage from './pages/FinalPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import { DevelopModeProvider } from './context/DevelopModeContext';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';

export default function App() {
  return (
    <DevelopModeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/matches" replace />} />
            <Route path="group-stage" element={<GroupStagePage />} />
            <Route path="knockout" element={<KnockoutPage />} />
            <Route path="round-of-16" element={<RoundOf16Page />} />
            <Route path="quarter-finals" element={<QuarterFinalsPage />} />
            <Route path="semi-finals" element={<SemiFinalsPage />} />
            <Route path="third-place" element={<ThirdPlacePage />} />
            <Route path="final" element={<FinalPage />} />
            <Route path="matches" element={<MatchesPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </DevelopModeProvider>
  );
}
