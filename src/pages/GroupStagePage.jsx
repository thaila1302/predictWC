import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { listenGroups } from '../services/firestore';
import seedGroups from '../../data/groups.json';

const accentBars = [
  'from-cyan-400 to-teal-400',
  'from-sky-400 to-cyan-400',
  'from-amber-400 to-orange-500',
  'from-fuchsia-400 to-pink-500',
  'from-lime-400 to-emerald-500',
  'from-violet-400 to-indigo-500'
];

function GroupCard({ group, index }) {
  const accent = accentBars[index % accentBars.length];

  return (
    <article className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/80 shadow-glow ring-1 ring-white/5">
      <div className={`flex items-start justify-between bg-gradient-to-r ${accent} px-4 py-4 text-slate-950`}>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.38em] text-slate-950/70">Nhóm</p>
          <h2 className="font-display text-3xl font-black leading-none">{group.label}</h2>
        </div>
        <div className="rounded-2xl bg-white/45 px-3 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-slate-800 ring-1 ring-white/50">
          4 Đội
        </div>
      </div>

      <div className="space-y-2 p-4">
        {group.teams.map((team, teamIndex) => (
          <div
            key={`${group.label}-${team.code || team.name}`}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition hover:border-cyan-400/40 hover:bg-white/10"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900/80 text-sm font-black text-white ring-1 ring-white/10">
              {team.code || String(teamIndex + 1).padStart(2, '0')}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{team.name}</p>
              <p className="text-[11px] uppercase tracking-[0.36em] text-slate-400">{team.code}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function GroupStagePage() {
  const [groups, setGroups] = useState(seedGroups);

  useEffect(() => {
    return listenGroups((remoteGroups) => {
      if (remoteGroups.length > 0) {
        setGroups(remoteGroups);
      }
    });
  }, []);

  const orderedGroups = useMemo(
    () =>
      [...groups].sort((left, right) =>
        String(left.label || '').localeCompare(String(right.label || ''))
      ),
    [groups]
  );

  return (
    <div>
      <SectionHeader
        title="Vòng bảng"
        subtitle="12 bảng A đến L, mỗi bảng 4 đội. Dữ liệu được dựng từ file JSON và có thể nhập vào Firestore."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        {orderedGroups.map((group, index) => (
          <span
            key={group.label}
            className={`inline-flex items-center rounded-full bg-gradient-to-r ${
              accentBars[index % accentBars.length]
            } px-4 py-2 text-sm font-black text-slate-950 shadow-sm shadow-cyan-500/10`}
          >
            {group.label}
          </span>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {orderedGroups.map((group, index) => (
          <GroupCard key={group.label} group={group} index={index} />
        ))}
      </div>
    </div>
  );
}
