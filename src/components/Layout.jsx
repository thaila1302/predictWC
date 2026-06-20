import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Award,
  Crown,
  GitBranch,
  GitFork,
  History,
  ListChecks,
  LogOut,
  Medal,
  Network,
  Pencil,
  Save,
  Shield,
  Trophy,
  User2,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useUnit } from '../context/UnitContext';

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

function RenameDialog({ open, currentName, saving, error, onClose, onSave }) {
  const [displayName, setDisplayName] = useState(currentName || '');

  useEffect(() => {
    if (open) setDisplayName(currentName || '');
  }, [currentName, open]);

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(displayName);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-sm" onMouseDown={onClose}>
      <form
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-black text-slate-950">Đổi tên hiển thị</h2>
            <p className="mt-1 text-sm text-slate-500">Tên mới sẽ hiển thị trên header và bảng người chơi.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Đóng"
          >
            <X size={17} />
          </button>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-bold text-slate-700">Tên hiển thị</span>
          <input
            autoFocus
            maxLength={50}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />
        </label>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-400 to-cyan-400 px-4 py-3 font-black text-slate-950 transition hover:brightness-105 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Đang lưu...' : 'Lưu tên'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Layout() {
  const { user, logout, updateDisplayName } = useAuth();
  const { pathFor } = useUnit();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameSaving, setRenameSaving] = useState(false);
  const [renameError, setRenameError] = useState('');
  const visibleNavItems = user?.isAdmin ? navItems : navItems.filter((item) => item.to !== '/admin');

  const handleRename = async (displayName) => {
    setRenameError('');
    setRenameSaving(true);

    try {
      await updateDisplayName(displayName);
      setRenameOpen(false);
    } catch (error) {
      setRenameError(error.message || 'Không thể đổi tên. Vui lòng thử lại.');
    } finally {
      setRenameSaving(false);
    }
  };

  return (
    <div className="theme-light min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-[108rem] px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <Link to={pathFor('/matches')} className="flex min-w-0 items-center gap-3">
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
              <button
                type="button"
                onClick={() => {
                  setRenameError('');
                  setRenameOpen(true);
                }}
                className="group inline-flex max-w-[10rem] items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 sm:max-w-[15rem] sm:px-4 sm:text-sm"
                title="Đổi tên hiển thị"
              >
                <User2 size={14} className="shrink-0" />
                <span className="truncate">{user?.displayName || user?.username || 'Người chơi'}</span>
                <Pencil size={12} className="hidden shrink-0 text-cyan-600 group-hover:block sm:block" />
              </button>

              <Link
                to={pathFor('/history')}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white sm:px-4 sm:text-sm"
                title="Lịch sử dự đoán"
              >
                <History size={14} />
                <span className="hidden sm:inline">Lịch sử</span>
              </Link>

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
                    to={pathFor(item.to)}
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

      <RenameDialog
        open={renameOpen}
        currentName={user?.displayName || ''}
        saving={renameSaving}
        error={renameError}
        onClose={() => {
          if (!renameSaving) setRenameOpen(false);
        }}
        onSave={handleRename}
      />
    </div>
  );
}
