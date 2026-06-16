import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Crown, Landmark, ShieldAlert, UsersRound } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { listenAllPredictions, listenLeaderboard, listenMatches } from '../services/firestore';
import { useUnit } from '../context/UnitContext';
import useResumeRefreshKey from '../hooks/useResumeRefreshKey';

function formatLostMoney(lostMoney) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(lostMoney || 0);
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [matches, setMatches] = useState([]);
  const { unitId } = useUnit();
  const resumeRefreshKey = useResumeRefreshKey();

  useEffect(() => listenLeaderboard(unitId, setPlayers), [resumeRefreshKey, unitId]);
  useEffect(() => listenAllPredictions(unitId, setPredictions), [resumeRefreshKey, unitId]);
  useEffect(() => listenMatches(setMatches), [resumeRefreshKey]);

  const finishedMatchCount = useMemo(() => matches.filter((match) => match.status === 'finished').length, [matches]);
  const kingCrabFund = useMemo(() => players.reduce((total, player) => total + (Number(player.lostMoney) || 0), 0), [players]);
  const matchById = useMemo(() => new Map(matches.map((match) => [match.id, match])), [matches]);

  const predictionStatsByUser = useMemo(() => {
    const stats = new Map();

    predictions.forEach((prediction) => {
      const current = stats.get(prediction.userId) || { missed: 0 };
      const match = matchById.get(prediction.matchId);
      const isActiveMissedPrediction =
        prediction.autoMissed &&
        !prediction.predictedResult &&
        prediction.resultStatus === 'wrong' &&
        match?.status === 'finished';

      if (isActiveMissedPrediction) {
        current.missed += 1;
      }
      stats.set(prediction.userId, current);
    });

    return stats;
  }, [matchById, predictions]);

  return (
    <div>
      <SectionHeader
        title="Danh sách người chơi"
        subtitle="Theo dõi số lần dự đoán sai của từng người chơi."
      />

      <div className="glass overflow-hidden rounded-3xl bg-slate-100 shadow-glow sm:rounded-[1.75rem]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200/80 sm:h-11 sm:w-11">
              <UsersRound size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-950 sm:text-xl">Tất cả người chơi</h2>
              <p className="text-sm text-slate-500">{players.length} người chơi</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-2.5 text-amber-800 ring-1 ring-amber-200/80">
              <Landmark size={20} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Quỹ King Crab</p>
                <p className="mt-0.5 font-display text-xl font-black">{formatLostMoney(kingCrabFund)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-2.5 text-emerald-800 ring-1 ring-emerald-200/80">
              <CheckCircle2 size={20} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Tổng số trận đã diễn ra</p>
                <p className="mt-0.5 font-display text-xl font-black">{finishedMatchCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-100 text-[10px] uppercase tracking-[0.18em] text-slate-600 sm:text-xs sm:tracking-[0.25em]">
              <tr>
                <th className="w-16 px-4 py-3 text-center sm:w-20 sm:px-5 sm:py-4">STT</th>
                <th className="px-4 py-3 sm:px-5 sm:py-4">Người chơi</th>
                <th className="px-4 py-3 text-center sm:px-5 sm:py-4">Không dự đoán</th>
                <th className="px-4 py-3 text-center sm:px-5 sm:py-4">Dự đoán sai</th>
                <th className="px-4 py-3 text-center sm:px-5 sm:py-4">Số tiền đã ra đi</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.id} className="border-b border-slate-200 last:border-0">
                  <td className="px-4 py-4 text-center font-bold text-slate-500 sm:px-5">{index + 1}</td>
                  <td className="px-4 py-4 sm:px-5">
                    <div className={index < 3 ? `leaderboard-honoree leaderboard-honoree-${index + 1}` : 'font-semibold text-slate-950'}>
                      {index < 3 ? <Crown className="leaderboard-crown" size={18} fill="currentColor" /> : null}
                      <span>{player.displayName || 'Người chơi'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-amber-700 sm:px-5">
                    {predictionStatsByUser.get(player.id)?.missed || 0}
                  </td>
                  <td className="px-4 py-4 text-center sm:px-5">
                    <span className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-100 px-2.5 py-1.5 font-bold text-rose-700 ring-1 ring-rose-200/80 sm:gap-2 sm:px-3">
                      <ShieldAlert size={16} />
                      {player.wrongPredictions || 0}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-center font-black text-rose-700 sm:px-5">
                    {formatLostMoney(player.lostMoney)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
