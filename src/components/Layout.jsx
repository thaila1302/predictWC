import { Link, NavLink, Outlet } from 'react-router-dom';
import { Trophy, ListChecks, Medal, User2, Layers3, GitBranch, LogOut, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/group-stage', label: 'Vòng Bảng', icon: Layers3 },
  { to: '/matches', label: 'Trận Đấu', icon: ListChecks },
  { to: '/knockout', label: '1/16', icon: GitBranch },
  { to: '/round-of-16', label: '1/8', icon: GitBranch },
  { to: '/quarter-finals', label: 'Tứ kết', icon: GitBranch },
  { to: '/semi-finals', label: 'Bán kết', icon: GitBranch },
  { to: '/third-place', label: 'Hạng ba', icon: GitBranch },
  { to: '/final', label: 'Chung kết', icon: GitBranch },
  { to: '/leaderboard', label: 'Bảng Xếp Hạng', icon: Medal },
  { to: '/admin', label: 'Quản trị', icon: Shield }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const visibleNavItems = user?.isAdmin ? navItems : navItems.filter((item) => item.to !== '/admin');

  return (
    <div className="min-h-screen bg-stadium text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[108rem] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/matches" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-500 to-cyan-400 text-slate-950 shadow-glow">
                <Trophy size={22} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-display text-xl font-extrabold tracking-tight text-white">PredictWC</p>
                <p className="text-xs uppercase tracking-[0.3em] text-violet-300">Thử thách World Cup</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 md:flex">
                <User2 size={14} />
                {user?.displayName || user?.username || 'Người chơi'}
              </div>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                <LogOut size={14} />
                Đăng xuất
              </button>
            </div>
          </div>

          <nav className="mt-4 overflow-x-auto">
            <div className="flex min-w-max gap-2 rounded-3xl border border-white/10 bg-white/5 p-2 shadow-glow">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold whitespace-nowrap transition',
                        isActive
                          ? 'bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-950'
                          : 'text-slate-200 hover:bg-white/10'
                      )
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[108rem] px-4 py-6 sm:px-6 lg:px-8">
        <section className="min-w-0">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
