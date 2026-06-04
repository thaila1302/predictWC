import { useEffect, useMemo, useState } from 'react';
import { TimerReset } from 'lucide-react';
import { toDate } from '../lib/utils';

function formatCountdownParts(totalMs) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (days > 0) {
    return `${days} ngày ${hh}:${mm}:${ss}`;
  }

  return `${hh}:${mm}:${ss}`;
}

export default function MatchCountdown({ startTime, status }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const matchDate = toDate(startTime);
    if (!matchDate) return undefined;
    if (status === 'finished') return undefined;

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [startTime, status]);

  const content = useMemo(() => {
    const matchDate = toDate(startTime);
    if (!matchDate) {
      return { label: 'Đang cập nhật giờ', tone: 'text-slate-300 bg-white/5 border-white/10' };
    }

    const delta = matchDate.getTime() - now;

    if (status === 'finished') {
      return { label: 'Trận đã kết thúc', tone: 'text-slate-300 bg-white/5 border-white/10' };
    }

    if (delta <= 0 || status === 'live') {
      return { label: 'Trận đang diễn ra', tone: 'text-emerald-200 bg-emerald-500/15 border-emerald-400/30' };
    }

    return {
      label: `Bắt đầu sau ${formatCountdownParts(delta)}`,
      tone: 'text-cyan-200 bg-cyan-500/15 border-cyan-400/30'
    };
  }, [now, startTime, status]);

  return (
    <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${content.tone}`}>
      <TimerReset size={12} />
      {content.label}
    </div>
  );
}
