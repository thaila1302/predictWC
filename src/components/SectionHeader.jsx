export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
