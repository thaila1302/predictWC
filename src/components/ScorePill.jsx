export default function ScorePill({ homeScore, awayScore }) {
  return (
    <div className="inline-flex items-center rounded-2xl bg-slate-900/80 px-3 py-2 text-lg font-extrabold tracking-tight text-white ring-1 ring-white/10">
      {homeScore ?? '-'}
      <span className="mx-2 text-white/40">:</span>
      {awayScore ?? '-'}
    </div>
  );
}
