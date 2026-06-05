export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-end sm:gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
