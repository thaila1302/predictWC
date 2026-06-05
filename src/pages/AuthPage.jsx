import { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LogIn, UserRoundPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { value: 'login', label: 'Đăng nhập', icon: LogIn },
  { value: 'register', label: 'Đăng ký', icon: UserRoundPlus }
];

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const rawText = await response.text();
  let payload = {};

  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error('Không thể xử lý yêu cầu. Vui lòng thử lại sau.');
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'Yeu cau khong thanh cong.');
  }

  return payload;
}

export default function AuthPage() {
  const location = useLocation();
  const { isAuthenticated, login, register, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    displayName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [resetForm, setResetForm] = useState({
    identifier: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const redirectTo = useMemo(() => location.state?.from || '/matches', [location.state]);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    try {
      await login(loginForm);
    } catch (loginError) {
      setError(loginError.message || 'Đăng nhập thất bại.');
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    try {
      await register({
        displayName: registerForm.displayName,
        email: registerForm.email,
        username: registerForm.username,
        password: registerForm.password
      });
    } catch (registerError) {
      setError(registerError.message || 'Đăng ký thất bại.');
    }
  };

  const handleRequestPasswordReset = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!resetForm.identifier.trim()) {
      setError('Vui lòng nhập email hoặc tài khoản.');
      return;
    }

    setResetLoading(true);
    try {
      await postJson('/api/request-password-reset', { identifier: resetForm.identifier });

      setResetCodeSent(true);
      setNotice('Mã xác nhận đã được gửi. Vui lòng kiểm tra email của bạn.');
    } catch (resetError) {
      setError(resetError.message || 'Không gửi được mã xác nhận.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!resetForm.identifier.trim()) {
      setError('Vui lòng nhập email hoặc tài khoản.');
      return;
    }

    if (!resetForm.code.trim()) {
      setError('Vui lòng nhập mã xác nhận.');
      return;
    }

    if (!resetForm.newPassword) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setResetLoading(true);
    try {
      await postJson('/api/confirm-password-reset', {
        identifier: resetForm.identifier,
        code: resetForm.code,
        newPassword: resetForm.newPassword
      });

      setMode('login');
      setResetCodeSent(false);
      setResetForm({ identifier: '', code: '', newPassword: '', confirmPassword: '' });
      setNotice('Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
    } catch (resetError) {
      setError(resetError.message || 'Không đổi được mật khẩu.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stadium px-4 py-10 text-slate-100">
      <div className="w-full max-w-[28rem]">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-cyan-300/80">Chào mừng đến với</p>
          <h1 className="mx-auto max-w-md bg-gradient-to-r from-violet-300 via-cyan-200 to-sky-300 bg-clip-text text-4xl font-extrabold leading-tight text-transparent sm:text-5xl hero-title">
            Predict Worldcup 2026
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300/80">
            Dự đoán từng trận, chinh phục bảng xếp hạng và tìm ra nhà vô địch.
          </p>
        </div>
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-glow ring-1 ring-white/5 backdrop-blur auth-panel">
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
                    setNotice('');
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

          {notice ? (
            <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              {notice}
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

              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError('');
                  setNotice('');
                }}
                className="w-full text-sm font-semibold text-cyan-200 transition hover:text-cyan-100"
              >
                Quên mật khẩu?
              </button>
            </form>
          ) : mode === 'register' ? (
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
                <span className="text-sm font-medium text-slate-300">Email</span>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
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
          ) : (
            <form className="space-y-5" onSubmit={resetCodeSent ? handleConfirmPasswordReset : handleRequestPasswordReset}>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      !resetCodeSent ? 'bg-cyan-400 text-slate-950' : 'bg-emerald-400 text-slate-950'
                    }`}
                  >
                    1
                  </span>
                  <span>Gửi mã xác nhận</span>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-300">Email hoặc tài khoản</span>
                  <input
                    value={resetForm.identifier}
                    disabled={resetCodeSent}
                    onChange={(event) => setResetForm((current) => ({ ...current, identifier: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </label>

                {!resetCodeSent ? (
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Nhập email hoặc tài khoản đã đăng ký để nhận mã xác nhận đổi mật khẩu.
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={resetLoading}
                    onClick={() => {
                      setResetCodeSent(false);
                      setNotice('');
                      setError('');
                      setResetForm((current) => ({ ...current, code: '', newPassword: '', confirmPassword: '' }));
                    }}
                    className="mt-3 text-sm font-semibold text-cyan-200 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Đổi email/tài khoản khác
                  </button>
                )}
              </div>

              {resetCodeSent ? (
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400 text-slate-950">2</span>
                    <span>Nhập mã và mật khẩu mới</span>
                  </div>

                  <div className="space-y-4">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-300">Mã xác nhận</span>
                      <input
                        value={resetForm.code}
                        onChange={(event) => setResetForm((current) => ({ ...current, code: event.target.value }))}
                        placeholder="Nhập mã 6 số"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-300">Mật khẩu mới</span>
                      <input
                        type="password"
                        value={resetForm.newPassword}
                        onChange={(event) => setResetForm((current) => ({ ...current, newPassword: event.target.value }))}
                        placeholder="Nhập mật khẩu mới"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-300">Nhập lại mật khẩu mới</span>
                      <input
                        type="password"
                        value={resetForm.confirmPassword}
                        onChange={(event) =>
                          setResetForm((current) => ({ ...current, confirmPassword: event.target.value }))
                        }
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || resetLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-400 to-cyan-400 px-4 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resetLoading
                  ? resetCodeSent
                    ? 'Đang đổi mật khẩu...'
                    : 'Đang gửi mã...'
                  : resetCodeSent
                    ? 'Đổi mật khẩu'
                    : 'Gửi mã xác nhận'}
              </button>

              <button
                type="button"
                disabled={resetLoading}
                onClick={() => {
                  setMode('login');
                  setError('');
                  setNotice('');
                  setResetCodeSent(false);
                  setResetForm({ identifier: '', code: '', newPassword: '', confirmPassword: '' });
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Quay lại đăng nhập
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
