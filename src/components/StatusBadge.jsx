import { cn, getMatchStatusLabel } from '../lib/utils';

const styles = {
  upcoming: 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30',
  live: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30',
  finished: 'bg-slate-700 !text-white ring-slate-500/70 shadow-sm'
};

export default function StatusBadge({ status, spotlight = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1',
        styles[status] || styles.upcoming,
        spotlight && status === 'upcoming' && 'match-spotlight-status'
      )}
    >
      {getMatchStatusLabel(status)}
    </span>
  );
}
