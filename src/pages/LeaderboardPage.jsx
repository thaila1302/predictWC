import { useEffect, useMemo, useState } from 'react';
import { Crown, Medal, Trophy } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { listenLeaderboard } from '../services/firestore';

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);

  useEffect(() => listenLeaderboard(setPlayers), []);

  const topPlayers = useMemo(() => players.slice(0, 3), [players]);

  return (
    <div>
      <SectionHeader
        title="Bảng Xếp Hạng"
        subtitle="Bảng xếp hạng realtime theo số lần dự đoán đúng. Nếu bằng nhau thì người có ít dự đoán sai hơn sẽ đứng trên."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {topPlayers.map((player, index) => {
          const labels = ['Hạng 1', 'Hạng 2', 'Hạng 3'];
          const gradients = [
            'from-amber-400 to-orange-500',
            'from-sky-400 to-cyan-400',
            'from-fuchsia-400 to-pink-500'
          ];

          return (
            <div key={player.id} className="glass rounded-[1.75rem] p-5 shadow-glow">
              <div
                className={`mb-4 inline-flex rounded-2xl bg-gradient-to-r ${gradients[index]} px-4 py-2 text-sm font-extrabold text-slate-950`}
              >
                {labels[index]}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950/80 ring-1 ring-white/10">
                  {index === 0 ? <Crown className="text-amber-300" /> : <Medal className="text-slate-300" />}
                </div>
                <div>
                  <p className="text-xl font-extrabold text-white">{player.displayName || 'Người chơi'}</p>
                  <p className="text-sm text-slate-300">
                    {player.correctPredictions || 0} đúng • {player.wrongPredictions || 0} sai
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Đúng / Sai</p>
                  <p className="font-display text-4xl font-extrabold text-white">
                    {player.correctPredictions || 0}
                    <span className="mx-2 text-slate-500">/</span>
                    <span className="text-rose-300">{player.wrongPredictions || 0}</span>
                  </p>
                </div>
                <Trophy className="text-cyan-300/80" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass overflow-hidden rounded-[1.75rem] shadow-glow">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-xl font-bold text-white">Tất cả người chơi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.25em] text-slate-300">
              <tr>
                <th className="px-5 py-4">Hạng</th>
                <th className="px-5 py-4">Người chơi</th>
                <th className="px-5 py-4">Đúng</th>
                <th className="px-5 py-4">Sai</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-4 text-sm font-bold text-slate-200">#{index + 1}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{player.displayName || 'Người chơi'}</div>
                    <div className="text-sm text-slate-400">{player.username ? `@${player.username}` : player.email}</div>
                  </td>
                  <td className="px-5 py-4 font-bold text-cyan-300">{player.correctPredictions || 0}</td>
                  <td className="px-5 py-4 text-rose-200">{player.wrongPredictions || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
