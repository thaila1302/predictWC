import { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LockKeyhole, LogIn, UserRoundPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { value: 'login', label: 'Đăng nhập', icon: LogIn },
  { value: 'register', label: 'Đăng ký', icon: UserRoundPlus }
];

export default function AuthPage() {
  const location = useLocation();
  const { isAuthenticated, login, register, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    displayName: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const redirectTo = useMemo(() => location.state?.from || '/matches', [location.state]);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(loginForm);
    } catch (loginError) {
      setError(loginError.message || 'Đăng nhập thất bại.');
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    try {
      await register({
        displayName: registerForm.displayName,
        username: registerForm.username,
        password: registerForm.password
      });
    } catch (registerError) {
      setError(registerError.message || 'Đăng ký thất bại.');
    }
  };

  return (
    <div className="min-h-screen bg-stadium px-4 py-10 text-slate-100">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-8 shadow-glow ring-1 ring-white/5">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
            <LockKeyhole size={16} />
            PredictWC Access
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Đăng nhập để dự đoán World Cup.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-300">
            Tạo tài khoản đơn giản bằng họ và tên, tài khoản, mật khẩu. Sau khi đăng nhập, bạn có thể dự đoán và theo dõi bảng xếp hạng.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['Dự đoán nhanh', 'Chọn kết quả từng trận ngay trên card'],
              ['Realtime', 'Điểm và bảng xếp hạng cập nhật trực tiếp'],
              ['Quản trị', 'Tinh chỉnh thông tin trận đấu tại trang quản trị']
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-bold text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-glow ring-1 ring-white/5">
          <div className="mb-5 flex rounded-2xl border border-white/10 bg-white/5 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = mode === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setMode(tab.value);
                    setError('');
                  }}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    active
                      ? 'bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-950'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon size={16} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {mode === 'login' ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Tài khoản</span>
                <input
                  value={loginForm.username}
                  onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Mật khẩu</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-400 to-cyan-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-60"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Họ và tên</span>
                <input
                  value={registerForm.displayName}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, displayName: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Tài khoản</span>
                <input
                  value={registerForm.username}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, username: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Mật khẩu</span>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Nhập lại mật khẩu</span>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-400 to-cyan-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-60"
              >
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
