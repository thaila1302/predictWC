import { useEffect, useMemo, useState } from 'react';
import { Clock3, CalendarDays } from 'lucide-react';
import { formatDateTime, formatVietnamDay, getEffectiveMatchStatus, toDate } from '../lib/utils';
import { listenMatches, listenAllPredictions, listenLeaderboard } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import { useUnit } from '../context/UnitContext';

function getPredictionLabel(predictedResult, match) {
  switch (predictedResult) {
    case 'home':
      return match?.homeTeam || 'Đội nhà';
    case 'away':
      return match?.awayTeam || 'Đội khách';
    case 'draw':
      return 'Hòa';
    default:
      return 'Chưa dự đoán';
  }
}

function historyRowClass(status) {
  if (status === 'finished') return 'bg-slate-100 ring-slate-200 text-slate-900';
  if (status === 'live') return 'bg-emerald-50 ring-emerald-200 text-slate-900';
  return 'bg-white ring-slate-200 text-slate-900';
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { unitId } = useUnit();
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [allPredictions, setAllPredictions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    return listenMatches((remoteMatches) => {
      setMatches(remoteMatches.map((match) => ({
        ...match,
        status: getEffectiveMatchStatus(match)
      })));
    });
  }, []);

  useEffect(() => {
    return listenLeaderboard(unitId, setUsers);
  }, [unitId]);

  useEffect(() => {
    return listenAllPredictions(unitId, setAllPredictions);
  }, [unitId]);

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id);
    }
  }, [selectedUserId, users]);

  const selectedUser = useMemo(
    () => users.find((item) => item.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const predictionCountByUser = useMemo(() => {
    const counts = new Map();

    allPredictions.forEach((prediction) => {
      counts.set(prediction.userId, (counts.get(prediction.userId) || 0) + 1);
    });

    return counts;
  }, [allPredictions]);

  const filteredPredictions = useMemo(
    () => allPredictions.filter((prediction) => prediction.userId === selectedUserId),
    [allPredictions, selectedUserId]
  );

  const rows = useMemo(() => {
    const matchesById = new Map(matches.map((match) => [match.id, match]));

    return filteredPredictions
      .map((prediction) => {
        const match = matchesById.get(prediction.matchId) || {};
        const confirmedAt = prediction.createdAt || prediction.updatedAt || match.matchTime;
        const hasResult =
          match.homeScore !== null &&
          match.homeScore !== undefined &&
          match.awayScore !== null &&
          match.awayScore !== undefined;
        const resultLabel = hasResult
          ? match.homeScore === match.awayScore
            ? 'Hòa'
            : match.homeScore > match.awayScore
              ? match.homeTeam || 'Đội nhà'
              : match.awayTeam || 'Đội khách'
          : 'Chưa có';

        return {
          id: prediction.id,
          matchId: prediction.matchId,
          homeTeam: match.homeTeam || 'Đang cập nhật',
          awayTeam: match.awayTeam || 'Đang cập nhật',
          matchTime: match.matchTime,
          matchDateLabel: formatVietnamDay(match.matchTime),
          matchTimeLabel: formatDateTime(match.matchTime),
          status: match.status || 'upcoming',
          predictionLabel: getPredictionLabel(prediction.predictedResult, match),
          predictedResult: prediction.predictedResult || 'none',
          confirmedAt,
          confirmedAtLabel: formatDateTime(confirmedAt),
          resultLabel
        };
      })
      .sort((left, right) => {
        const leftTime = toDate(left.matchTime)?.getTime() || 0;
        const rightTime = toDate(right.matchTime)?.getTime() || 0;
        return leftTime - rightTime;
      });
  }, [matches, filteredPredictions]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-4 shadow-glow ring-1 ring-slate-200/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Danh sách người dùng</p>
            <p className="mt-1 text-sm text-slate-500">
              {selectedUser
                ? `Đang xem lịch sử của ${selectedUser.displayName || selectedUser.username}`
                : 'Chọn một người dùng để xem lịch sử dự đoán.'}
            </p>
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {selectedUser ? `${predictionCountByUser.get(selectedUser.id) || 0} dự đoán` : ''}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <div className="flex gap-2">
            {users.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedUserId(item.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${
                  selectedUserId === item.id
                    ? 'bg-cyan-500 text-white border-cyan-500'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {item.displayName || item.username || 'Người dùng'}
                <span className="ml-2 text-xs font-medium text-slate-500">
                  ({predictionCountByUser.get(item.id) || 0})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-slate-50 shadow-glow ring-1 ring-slate-200/70">
        <div className="grid grid-cols-[2fr_1.4fr_1.3fr_1.2fr_1.2fr] gap-0 border-b border-slate-200/70 bg-white px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-500 sm:grid-cols-[2fr_1.4fr_1.3fr_1.2fr_1.2fr] sm:px-5">
          <span>Trận đấu</span>
          <span>Thời gian bắt đầu</span>
          <span>Thời gian dự đoán</span>
          <span>DỰ ĐOÁN CỦA BẠN</span>
          <span>Kết quả</span>
        </div>
        <div>
          {rows.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Không có dự đoán cho người dùng này.</div>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className={`grid grid-cols-[2fr_1.4fr_1.3fr_1.2fr_1.2fr] gap-0 border-b border-slate-200/70 px-4 py-4 text-sm sm:grid-cols-[2fr_1.4fr_1.3fr_1.2fr_1.2fr] sm:px-5 ${historyRowClass(row.status)}`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{row.homeTeam} vs {row.awayTeam}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.status === 'finished' ? 'Kết thúc' : row.status === 'live' ? 'Đang diễn ra' : 'Sắp diễn ra'}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CalendarDays size={14} />
                  <span>{row.matchTimeLabel}</span>
                </div>
                <div className="text-slate-700">{row.confirmedAtLabel}</div>
                <div>
                  <span className="inline-flex rounded-2xl bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 ring-1 ring-cyan-200">
                    {row.predictionLabel}
                  </span>
                </div>
                <div>
                  <span className="inline-flex rounded-2xl bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 ring-1 ring-cyan-200">
                    {row.resultLabel}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
