import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, Search, Shield, Target, Users, X } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import DevMatchEditor from '../components/DevMatchEditor';
import {
  cn,
  formatDateTime,
  formatVietnamDay,
  formatVietnamDayKey,
  parseVietnamDateTimeLocal,
  toDate
} from '../lib/utils';
import { listenAllPredictions, listenLeaderboard, listenMatches } from '../services/firestore';
import { updateUserAccess } from '../services/auth';
import { useDevelopMode } from '../context/DevelopModeContext';
import { useAuth } from '../context/AuthContext';
import { mergeMatchesById } from '../lib/matchMerge';
import seedMatches from '../../data/matches.json';
import seedRound32 from '../../data/1-16.json';
import seedRound16 from '../../data/1-8.json';
import seedQuarterFinals from '../../data/quarter-finals.json';
import seedSemiFinals from '../../data/semi-finals.json';
import seedThirdPlace from '../../data/third-place.json';
import seedFinal from '../../data/final.json';

const PRIMARY_ADMIN_NAME = 'Lê Anh Thái';

const adminTabs = [
  { id: 'matches', label: 'Trận đấu', icon: Shield },
  { id: 'users', label: 'Quản lý user', icon: Users },
  { id: 'predictions', label: 'Kèo dự đoán', icon: Target }
];

function normalizeKnockoutSeed(payload, roundLabel) {
  return (payload?.matches || []).map((match, index) => ({
    id: match.id,
    stage: 'knockout',
    round: payload.stage,
    roundLabel,
    order: match.matchNumber || index + 1,
    homeTeam: match.homeTeam || '',
    awayTeam: match.awayTeam || '',
    homeCode: '',
    awayCode: '',
    homeLogo: '',
    awayLogo: '',
    matchTime: parseVietnamDateTimeLocal(`${match.date}T${match.time}`),
    status: match.status || 'upcoming',
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    winner: null
  }));
}

const fallbackMatches = [
  ...(seedMatches.groupStage || []),
  ...normalizeKnockoutSeed(seedRound32, '1/16'),
  ...normalizeKnockoutSeed(seedRound16, '1/8'),
  ...normalizeKnockoutSeed(seedQuarterFinals, 'Tứ kết'),
  ...normalizeKnockoutSeed(seedSemiFinals, 'Bán kết'),
  ...normalizeKnockoutSeed(seedThirdPlace, 'Hạng ba'),
  ...normalizeKnockoutSeed(seedFinal, 'Chung kết')
];

function groupMatchesByDay(matches) {
  const grouped = new Map();

  matches.forEach((match) => {
    const key = formatVietnamDayKey(match.matchTime);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(match);
  });

  return Array.from(grouped.entries())
    .map(([key, items]) => ({
      key,
      label: formatVietnamDay(items[0]?.matchTime),
      sortTime: toDate(items[0]?.matchTime)?.getTime() || 0,
      matches: [...items].sort((left, right) => {
        const leftTime = toDate(left.matchTime)?.getTime() || 0;
        const rightTime = toDate(right.matchTime)?.getTime() || 0;
        return leftTime - rightTime;
      })
    }))
    .sort((left, right) => left.sortTime - right.sortTime);
}

function getMatchMetaLabel(match) {
  if (match?.group) return `Bảng ${match.group}`;
  return match?.roundLabel || 'Loại trực tiếp';
}

function getPredictionLabel(predictedResult, match) {
  switch (predictedResult) {
    case 'home':
      return match?.homeTeam || 'Đội nhà';
    case 'away':
      return match?.awayTeam || 'Đội khách';
    case 'draw':
      return 'Hòa';
    default:
      return 'Chưa chọn';
  }
}

function getPredictionTone(predictedResult) {
  switch (predictedResult) {
    case 'home':
      return 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30';
    case 'away':
      return 'bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/30';
    case 'draw':
      return 'bg-amber-500/15 text-amber-200 ring-amber-400/30';
    default:
      return 'bg-white/5 text-slate-300 ring-white/10';
  }
}

function TeamLine({ label, team, code }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
        <p className="text-base font-bold text-white">{team || 'Chưa chọn'}</p>
      </div>
      <span className="rounded-xl bg-slate-900/80 px-3 py-2 text-xs font-black text-white ring-1 ring-white/10">
        {code || '--'}
      </span>
    </div>
  );
}

function AdminMatchCard({ match }) {
  return (
    <article className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-950/70 shadow-glow ring-1 ring-white/5">
      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={match.status || 'upcoming'} />
            <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{getMatchMetaLabel(match)}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Clock3 size={14} />
            <span>{formatDateTime(match.matchTime)}</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <TeamLine label="Đội nhà" team={match.homeTeam} code={match.homeCode} />
          <TeamLine label="Đội khách" team={match.awayTeam} code={match.awayCode} />
        </div>
      </div>

      <DevMatchEditor match={match} />
    </article>
  );
}

function AdminTabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
        active
          ? 'bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-950'
          : 'bg-white/5 text-slate-200 hover:bg-white/10'
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/60 p-4 shadow-glow ring-1 ring-white/5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 shadow-glow ring-1 ring-white/5">
      <Search size={16} className="text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
      />
    </label>
  );
}

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/5 transition focus:border-cyan-400/40"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-slate-950 text-white">
          {option.label}
        </option>
      ))}
    </select>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 px-6 py-12 text-center">
      <p className="text-lg font-bold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

function TogglePill({ enabled, onClick, disabled, trueLabel, falseLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold ring-1 transition',
        enabled
          ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30 hover:bg-emerald-500/20'
          : 'bg-rose-500/15 text-rose-200 ring-rose-400/30 hover:bg-rose-500/20',
        disabled ? 'cursor-not-allowed opacity-50' : ''
      )}
    >
      {enabled ? <Check size={14} /> : <X size={14} />}
      {enabled ? trueLabel : falseLabel}
    </button>
  );
}

function UsersTab({ users, predictionCountByUser, currentUserId, onToggleAdmin, onToggleLocked }) {
  const [query, setQuery] = useState('');
  const [savingUserId, setSavingUserId] = useState('');

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((user) => {
      const haystack = [user.displayName, user.username, user.uid || user.id].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [query, users]);

  const handleToggleAdmin = async (user) => {
    const userId = user.uid || user.id;
    setSavingUserId(userId);
    try {
      await onToggleAdmin(user);
    } finally {
      setSavingUserId('');
    }
  };

  const handleToggleLocked = async (user) => {
    const userId = user.uid || user.id;
    setSavingUserId(userId);
    try {
      await onToggleLocked(user);
    } finally {
      setSavingUserId('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Tổng user" value={users.length} helper="Danh sách lấy trực tiếp từ Firebase users" />
        <StatCard
          label="Đã tham gia dự đoán"
          value={users.filter((user) => (predictionCountByUser.get(user.uid || user.id) || 0) > 0).length}
          helper="Có ít nhất một lựa chọn"
        />
        <StatCard
          label="Tổng lượt chọn"
          value={Array.from(predictionCountByUser.values()).reduce((sum, count) => sum + count, 0)}
          helper="Tổng số predictions của tất cả user"
        />
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Tìm theo họ tên, tài khoản hoặc UID" />

      {filteredUsers.length === 0 ? (
        <EmptyState title="Chưa có user phù hợp" description="Thử lại với từ khóa khác hoặc tạo thêm tài khoản để kiểm tra." />
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70 shadow-glow ring-1 ring-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5">
                <tr className="text-left text-xs uppercase tracking-[0.24em] text-slate-400">
                  <th className="px-4 py-4 font-semibold">Người dùng</th>
                  <th className="px-4 py-4 font-semibold">Tài khoản</th>
                  <th className="px-4 py-4 font-semibold">Đúng / Sai</th>
                  <th className="px-4 py-4 font-semibold">Kèo</th>
                  <th className="px-4 py-4 font-semibold">Admin</th>
                  <th className="px-4 py-4 font-semibold">Khóa</th>
                  <th className="px-4 py-4 font-semibold">UID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.map((user) => {
                  const userId = user.uid || user.id;
                  const predictionCount = predictionCountByUser.get(userId) || 0;
                  const saving = savingUserId === userId;
                  const isPrimaryAdmin = user.displayName === PRIMARY_ADMIN_NAME;

                  return (
                    <tr key={userId} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">{user.displayName || 'Chưa đặt tên'}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {isPrimaryAdmin ? 'Admin gốc' : user.isAdmin ? 'Đang là admin' : 'User thường'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-200">@{user.username || 'no-username'}</td>
                      <td className="px-4 py-4 text-slate-200">
                        đúng {user.correctPredictions || 0} / sai {user.wrongPredictions || 0}
                      </td>
                      <td className="px-4 py-4 text-slate-200">{predictionCount}</td>
                      <td className="px-4 py-4">
                        <TogglePill
                          enabled={Boolean(user.isAdmin)}
                          onClick={() => handleToggleAdmin(user)}
                          disabled={saving || isPrimaryAdmin}
                          trueLabel="Có quyền admin"
                          falseLabel="User thường"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <TogglePill
                          enabled={Boolean(user.isLocked)}
                          onClick={() => handleToggleLocked(user)}
                          disabled={saving || isPrimaryAdmin || userId === currentUserId}
                          trueLabel="Đã khóa"
                          falseLabel="Đang mở"
                        />
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        <span className="break-all">{userId}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PredictionsTab({ predictions, matches, users }) {
  const [query, setQuery] = useState('');
  const [roundFilter, setRoundFilter] = useState('');
  const [matchFilter, setMatchFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const userById = useMemo(() => new Map(users.map((user) => [user.uid || user.id, user])), [users]);
  const matchById = useMemo(() => new Map(matches.map((match) => [match.id, match])), [matches]);

  const roundOptions = useMemo(() => {
    const map = new Map();
    matches.forEach((match) => {
      const value = match.group ? `group:${match.group}` : `round:${match.round || match.roundLabel || 'knockout'}`;
      const label = match.group ? `Bảng ${match.group}` : match.roundLabel || 'Loại trực tiếp';
      if (!map.has(value)) {
        map.set(value, { value, label });
      }
    });
    return Array.from(map.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [matches]);

  const matchOptions = useMemo(() => {
    return matches
      .map((match) => ({
        value: match.id,
        label: `${match.homeTeam || 'TBD'} vs ${match.awayTeam || 'TBD'}`
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [matches]);

  const userOptions = useMemo(() => {
    return users
      .map((user) => ({
        value: user.uid || user.id,
        label: `${user.displayName || 'Chưa đặt tên'}${user.username ? ` (@${user.username})` : ''}`
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [users]);

  const predictionRows = useMemo(() => {
    return predictions
      .map((prediction) => {
        const user = userById.get(prediction.userId);
        const match = matchById.get(prediction.matchId);

        return {
          ...prediction,
          user,
          match,
          sortTime: toDate(match?.matchTime)?.getTime() || 0
        };
      })
      .sort((left, right) => {
        if (left.sortTime !== right.sortTime) return left.sortTime - right.sortTime;
        return String(left.matchId || '').localeCompare(String(right.matchId || ''));
      });
  }, [matchById, predictions, userById]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return predictionRows.filter((row) => {
      if (roundFilter) {
        const currentRound = row.match?.group
          ? `group:${row.match.group}`
          : `round:${row.match?.round || row.match?.roundLabel || 'knockout'}`;
        if (currentRound !== roundFilter) return false;
      }

      if (matchFilter && row.matchId !== matchFilter) {
        return false;
      }

      if (userFilter && row.userId !== userFilter) {
        return false;
      }

      if (!keyword) return true;

      const haystack = [
        row.user?.displayName,
        row.user?.username,
        row.match?.homeTeam,
        row.match?.awayTeam,
        row.match?.group ? `bang ${row.match.group}` : row.match?.roundLabel,
        getPredictionLabel(row.predictedResult, row.match),
        row.matchId
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [predictionRows, query, roundFilter, matchFilter, userFilter]);

  const groupedPredictions = useMemo(() => {
    const grouped = new Map();

    filteredRows.forEach((row) => {
      const key = row.match?.id || row.matchId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          match: row.match,
          sortTime: row.sortTime,
          rows: [],
          counts: { home: 0, draw: 0, away: 0 }
        });
      }

      const bucket = grouped.get(key);
      bucket.rows.push(row);
      if (row.predictedResult === 'home') bucket.counts.home += 1;
      if (row.predictedResult === 'draw') bucket.counts.draw += 1;
      if (row.predictedResult === 'away') bucket.counts.away += 1;
    });

    return Array.from(grouped.values()).sort((left, right) => {
      if (left.sortTime !== right.sortTime) return left.sortTime - right.sortTime;
      return String(left.key).localeCompare(String(right.key));
    });
  }, [filteredRows]);

  const uniqueUsers = useMemo(() => new Set(predictions.map((item) => item.userId)).size, [predictions]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Tổng kèo đã chọn" value={predictions.length} helper="Tất cả predictions hiện có" />
        <StatCard label="Người chơi tham gia" value={uniqueUsers} helper="Đếm theo userId có prediction" />
        <StatCard label="Trận có dự đoán" value={groupedPredictions.length} helper="Nhóm theo matchId" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <SearchInput value={query} onChange={setQuery} placeholder="Tìm theo user, trận đấu, bảng hoặc lựa chọn" />
        <FilterSelect value={roundFilter} onChange={setRoundFilter} options={roundOptions} placeholder="Tất cả vòng / bảng" />
        <FilterSelect value={matchFilter} onChange={setMatchFilter} options={matchOptions} placeholder="Tất cả trận" />
        <FilterSelect value={userFilter} onChange={setUserFilter} options={userOptions} placeholder="Tất cả user" />
      </div>

      {groupedPredictions.length === 0 ? (
        <EmptyState title="Chưa có kèo dự đoán" description="User chưa chọn kèo nào hoặc không có kết quả khớp từ khóa tìm kiếm." />
      ) : (
        <div className="space-y-4">
          {groupedPredictions.map((group) => {
            const match = group.match;
            const matchTitle =
              match?.homeTeam && match?.awayTeam ? `${match.homeTeam} vs ${match.awayTeam}` : `Match ${group.key}`;

            return (
              <section
                key={group.key}
                className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70 shadow-glow ring-1 ring-white/5"
              >
                <div className="border-b border-white/10 bg-white/5 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-white">{matchTitle}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                        {match ? <StatusBadge status={match.status || 'upcoming'} /> : null}
                        <span>{match ? getMatchMetaLabel(match) : group.key}</span>
                        <span className="text-slate-500">•</span>
                        <span>{match ? formatDateTime(match.matchTime) : 'Chưa có lịch'}</span>
                      </div>
                    </div>

                    <div className="grid min-w-[220px] grid-cols-3 gap-2">
                      <span className="rounded-2xl bg-cyan-500/15 px-3 py-2 text-center text-xs font-semibold text-cyan-200 ring-1 ring-cyan-400/30">
                        Nhà thắng: {group.counts.home}
                      </span>
                      <span className="rounded-2xl bg-amber-500/15 px-3 py-2 text-center text-xs font-semibold text-amber-200 ring-1 ring-amber-400/30">
                        Hòa: {group.counts.draw}
                      </span>
                      <span className="rounded-2xl bg-fuchsia-500/15 px-3 py-2 text-center text-xs font-semibold text-fuchsia-200 ring-1 ring-fuchsia-400/30">
                        Khách thắng: {group.counts.away}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-[minmax(220px,1.2fr)_minmax(180px,1fr)_140px_170px] gap-3 border-b border-white/10 bg-slate-900/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      <span>Người chơi</span>
                      <span>Lựa chọn</span>
                      <span>Kết quả</span>
                      <span>Mã kèo</span>
                    </div>

                    <div className="divide-y divide-white/10">
                      {group.rows.map((row) => {
                        const user = row.user;
                        const resultLabel =
                          row.resultStatus === 'correct' ? 'Đúng' : row.resultStatus === 'wrong' ? 'Sai' : 'Chờ kết quả';
                        const resultTone =
                          row.resultStatus === 'correct'
                            ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30'
                            : row.resultStatus === 'wrong'
                              ? 'bg-rose-500/15 text-rose-200 ring-rose-400/30'
                              : 'bg-white/5 text-slate-300 ring-white/10';

                        return (
                          <div
                            key={row.id}
                            className="grid grid-cols-[minmax(220px,1.2fr)_minmax(180px,1fr)_140px_170px] items-center gap-3 px-5 py-3 transition hover:bg-white/[0.03]"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-white">{user?.displayName || 'User không xác định'}</p>
                              <p className="mt-1 truncate text-sm text-slate-400">@{user?.username || row.userId}</p>
                            </div>

                            <div>
                              <span
                                className={cn(
                                  'inline-flex max-w-full items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1',
                                  getPredictionTone(row.predictedResult)
                                )}
                              >
                                <span className="truncate">{getPredictionLabel(row.predictedResult, match)}</span>
                              </span>
                            </div>

                            <div>
                              <span className={cn('inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ring-1', resultTone)}>
                                {resultLabel}
                              </span>
                            </div>

                            <div className="truncate text-xs uppercase tracking-[0.18em] text-slate-500">{row.id}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState(fallbackMatches);
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const { applyMatchOverrides, resetAllOverrides } = useDevelopMode();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    return listenMatches((remoteMatches) => {
      if (remoteMatches.length > 0) {
        setMatches(mergeMatchesById(fallbackMatches, remoteMatches));
      }
    });
  }, []);

  useEffect(() => listenLeaderboard(setUsers), []);
  useEffect(() => listenAllPredictions(setPredictions), []);

  const displayMatches = useMemo(() => applyMatchOverrides(matches), [applyMatchOverrides, matches]);
  const sections = useMemo(() => groupMatchesByDay(displayMatches), [displayMatches]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((left, right) => {
      const adminDiff = Number(Boolean(right.isAdmin)) - Number(Boolean(left.isAdmin));
      if (adminDiff !== 0) return adminDiff;
      return String(left.displayName || '').localeCompare(String(right.displayName || ''));
    });
  }, [users]);

  const predictionCountByUser = useMemo(() => {
    const counts = new Map();
    predictions.forEach((prediction) => {
      counts.set(prediction.userId, (counts.get(prediction.userId) || 0) + 1);
    });
    return counts;
  }, [predictions]);

  const handleToggleAdmin = async (targetUser) => {
    await updateUserAccess(targetUser.uid || targetUser.id, {
      isAdmin: !targetUser.isAdmin
    });
  };

  const handleToggleLocked = async (targetUser) => {
    await updateUserAccess(targetUser.uid || targetUser.id, {
      isLocked: !targetUser.isLocked
    });
  };

  const headerSubtitle =
    activeTab === 'matches'
      ? 'Chỉnh thông tin trận đấu tại đây. Mọi thay đổi đang áp dụng cục bộ lên giao diện hiện tại.'
      : activeTab === 'users'
        ? 'Quản lý tài khoản theo dạng bảng. Có thể khóa tài khoản hoặc bật quyền admin trực tiếp.'
        : 'Kiểm tra các lựa chọn thắng - hòa - thua mà user đã lưu theo từng trận đấu.';

  return (
    <div>
      <SectionHeader
        title="Quản trị"
        subtitle={headerSubtitle}
        action={
          activeTab === 'matches' ? (
            <button
              type="button"
              onClick={resetAllOverrides}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Reset tất cả
            </button>
          ) : null
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {adminTabs.map((tab) => (
          <AdminTabButton
            key={tab.id}
            active={activeTab === tab.id}
            icon={tab.icon}
            label={tab.label}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {activeTab === 'matches' ? (
        <div className="space-y-5">
          {sections.map((section) => (
            <section
              key={section.key}
              className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70 shadow-glow ring-1 ring-white/5"
            >
              <div className="border-b border-white/10 bg-white/5 px-5 py-4">
                <h2 className="font-display text-xl font-black text-white">{section.label}</h2>
              </div>

              <div className="grid items-start gap-4 p-4 md:grid-cols-2">
                {section.matches.map((match) => (
                  <AdminMatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {activeTab === 'users' ? (
        <UsersTab
          users={sortedUsers}
          predictionCountByUser={predictionCountByUser}
          currentUserId={currentUser?.uid}
          onToggleAdmin={handleToggleAdmin}
          onToggleLocked={handleToggleLocked}
        />
      ) : null}

      {activeTab === 'predictions' ? (
        <PredictionsTab predictions={predictions} matches={displayMatches} users={sortedUsers} />
      ) : null}
    </div>
  );
}
