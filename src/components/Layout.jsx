import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Award,
  Crown,
  GitBranch,
  GitFork,
  ListChecks,
  LogOut,
  Medal,
  Network,
  Shield,
  Trophy,
  User2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/matches', label: 'Vòng Bảng', icon: ListChecks },
  { to: '/knockout', label: '1/16', icon: Network },
  { to: '/round-of-16', label: '1/8', icon: GitFork },
  { to: '/quarter-finals', label: 'Tứ kết', icon: GitBranch },
  { to: '/semi-finals', label: 'Bán kết', icon: Award },
  { to: '/third-place', label: 'Hạng ba', icon: Medal },
  { to: '/final', label: 'Chung kết', icon: Crown },
  { to: '/leaderboard', label: 'Bảng Xếp Hạng', icon: Medal },
  { to: '/admin', label: 'Quản trị', icon: Shield }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const visibleNavItems = user?.isAdmin ? navItems : navItems.filter((item) => item.to !== '/admin');

  return (
    <div className="theme-light min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-[108rem] px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <Link to="/matches" className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-500 to-cyan-400 text-slate-950 shadow-glow sm:h-11 sm:w-11">
                <Trophy size={20} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">PredictWC</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600 sm:text-xs sm:tracking-[0.3em]">
                  Worldcup 2026
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 md:flex">
                <User2 size={14} />
                {user?.displayName || user?.username || 'Người chơi'}
              </div>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white sm:px-4 sm:text-sm"
                aria-label="Đăng xuất"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>

          <nav className="-mx-3 mt-3 overflow-x-auto px-3 sm:mx-0 sm:mt-4 sm:px-0">
            <div className="flex min-w-max justify-between gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5 shadow-glow sm:gap-2 sm:rounded-3xl sm:p-2 lg:min-w-0 lg:w-full">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm lg:flex-1',
                        isActive
                          ? 'bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-950'
                          : 'text-slate-700 hover:bg-white/70'
                      )
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[108rem] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="min-w-0">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
