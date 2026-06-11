import { useEffect, useState } from 'react';
import { ShieldAlert, UsersRound } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { listenLeaderboard } from '../services/firestore';

function formatLostMoney(wrongPredictions) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format((wrongPredictions || 0) * 10000);
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);

  useEffect(() => listenLeaderboard(setPlayers), []);

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
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-100 text-[10px] uppercase tracking-[0.18em] text-slate-600 sm:text-xs sm:tracking-[0.25em]">
              <tr>
                <th className="px-4 py-3 sm:px-5 sm:py-4">Người chơi</th>
                <th className="px-4 py-3 text-right sm:px-5 sm:py-4">Dự đoán sai</th>
                <th className="px-4 py-3 text-right sm:px-5 sm:py-4">Số tiền đã ra đi</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-b border-slate-200 last:border-0">
                  <td className="px-4 py-4 sm:px-5">
                    <div className="font-semibold text-slate-950">{player.displayName || 'Người chơi'}</div>
                    <div className="text-sm text-slate-500">{player.username ? `@${player.username}` : player.email}</div>
                  </td>
                  <td className="px-4 py-4 text-right sm:px-5">
                    <span className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-100 px-2.5 py-1.5 font-bold text-rose-700 ring-1 ring-rose-200/80 sm:gap-2 sm:px-3">
                      <ShieldAlert size={16} />
                      {player.wrongPredictions || 0}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-black text-rose-700 sm:px-5">
                    {formatLostMoney(player.wrongPredictions)}
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
