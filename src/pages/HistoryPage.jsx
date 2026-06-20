import { useEffect, useMemo, useState } from 'react';
import { Clock3, CalendarDays } from 'lucide-react';
import { formatDateTime, formatVietnamDay, getEffectiveMatchStatus, toDate } from '../lib/utils';
import { listenMatches, listenUserPredictions } from '../services/firestore';
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
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    return listenMatches((remoteMatches) => {
      setMatches(remoteMatches.map((match) => ({
        ...match,
        status: getEffectiveMatchStatus(match)
      })));
    });
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return listenUserPredictions(user.uid, unitId, setPredictions);
  }, [user?.uid, unitId]);

  const rows = useMemo(() => {
    const matchesById = new Map(matches.map((match) => [match.id, match]));

    return predictions
      .map((prediction) => {
        const match = matchesById.get(prediction.matchId) || {};
        const confirmedAt = prediction.createdAt || prediction.updatedAt || match.matchTime;
        const hasResult = match.homeScore !== null && match.homeScore !== undefined && match.awayScore !== null && match.awayScore !== undefined;
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
  }, [matches, predictions]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-6 shadow-glow ring-1 ring-slate-200/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-500">Lịch sử dự đoán</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Tất cả dự đoán của bạn</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Xem lại những trận bạn đã dự đoán, lựa chọn kết quả, thời gian và ngày thi đấu.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-3xl bg-cyan-50 px-4 py-3 text-cyan-700 ring-1 ring-cyan-200">
            <Clock3 size={18} />
            <span>{user?.displayName || user?.username || 'Người chơi'}</span>
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
            <div className="p-8 text-center text-slate-500">Bạn chưa có dự đoán nào.</div>
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
