import { AlertCircle } from 'lucide-react';

function getPredictionLabel(choice, homeLabel, awayLabel) {
  switch (choice) {
    case 'home':
      return homeLabel || 'Đội nhà';
    case 'away':
      return awayLabel || 'Đội khách';
    case 'draw':
      return 'Hòa';
    default:
      return '';
  }
}

export default function PredictionConfirmDialog({
  open,
  match,
  choice,
  homeLabel,
  awayLabel,
  currentChoice,
  saving,
  onCancel,
  onConfirm
}) {
  if (!open || !match || !choice) return null;

  const nextLabel = getPredictionLabel(choice, homeLabel, awayLabel);
  const currentLabel = currentChoice ? getPredictionLabel(currentChoice, homeLabel, awayLabel) : '';
  const isChanging = currentChoice && currentChoice !== choice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-950/95 p-6 shadow-glow ring-1 ring-white/5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-amber-500/15 p-3 text-amber-300">
            <AlertCircle size={20} />
          </div>

          <div className="min-w-0">
            <h3 className="text-xl font-black text-white">Xác nhận dự đoán</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Bạn đang chọn <span className="font-bold text-white">{nextLabel}</span> cho trận{' '}
              <span className="font-bold text-white">
                {homeLabel} đấu với {awayLabel}
              </span>
              .
            </p>
            {isChanging ? (
              <p className="mt-2 text-sm text-amber-200">
                Dự đoán hiện tại sẽ đổi từ <span className="font-bold">{currentLabel}</span> sang{' '}
                <span className="font-bold">{nextLabel}</span>.
              </p>
            ) : null}
            {!currentChoice ? <p className="mt-2 text-sm text-slate-400">Sau khi xác nhận, lựa chọn sẽ được lưu vào tài khoản của bạn.</p> : null}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 rounded-2xl bg-gradient-to-r from-violet-400 to-cyan-400 px-4 py-3 font-bold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
