export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stadium text-slate-100">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-glow">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-amber-400" />
          <p className="font-display text-lg font-bold tracking-wide">Đang tải PredictWC...</p>
        </div>
      </div>
    </div>
  );
}
