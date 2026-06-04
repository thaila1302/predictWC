import { cn } from '../lib/utils';

export default function PredictionButtons({ value, disabled, onChange, homeLabel, awayLabel }) {
  const options = [
    { value: 'home', label: homeLabel || 'Chủ nhà', accent: 'from-emerald-400 to-green-500' },
    { value: 'draw', label: 'Hòa', accent: 'from-amber-300 to-orange-400' },
    { value: 'away', label: awayLabel || 'Khách', accent: 'from-sky-400 to-blue-500' }
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-2xl border px-4 py-3 text-sm font-bold transition',
              active
                ? `border-transparent bg-gradient-to-r ${option.accent} text-slate-950 shadow-lg shadow-black/20`
                : 'border-white/10 bg-white/5 text-white hover:bg-white/10',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
