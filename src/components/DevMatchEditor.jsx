import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, RotateCcw, Save, Search } from 'lucide-react';
import { getResultFromScores, parseVietnamDateTimeLocal, toVietnamDateTimeLocal } from '../lib/utils';
import { useDevelopMode } from '../context/DevelopModeContext';
import { teamOptions } from '../lib/teamOptions';
import { saveMatchAndSyncScores } from '../services/firestore';

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function createDraftFromMatch(match) {
  return {
    homeTeam: match.homeTeam || '',
    awayTeam: match.awayTeam || '',
    homeCode: match.homeCode || '',
    awayCode: match.awayCode || '',
    homeLogo: match.homeLogo || '',
    awayLogo: match.awayLogo || '',
    matchTime: toVietnamDateTimeLocal(match.matchTime),
    status: match.status || 'upcoming',
    homeScore: match.homeScore ?? '',
    awayScore: match.awayScore ?? ''
  };
}

function SearchableTeamSelect({ label, value, code, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery('');
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();
  const selectedFlagUrl = teamOptions.find((team) => team.code === code)?.flagUrl || '';

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return teamOptions;
    }

    return teamOptions.filter((team) => {
      const haystacks = [team.name, team.code, `Bảng ${team.group}`];
      return haystacks.some((item) => String(item).toLowerCase().includes(normalizedQuery));
    });
  }, [normalizedQuery]);

  const handleSelect = (team) => {
    setQuery(team.name);
    setOpen(false);
    onSelect(team);
  };

  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <div className="relative" ref={containerRef}>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white focus-within:border-cyan-400/50">
          <Search size={14} className="shrink-0 text-slate-400" />
          {selectedFlagUrl ? (
            <img src={selectedFlagUrl} alt={value || code} className="h-4 w-5 shrink-0 rounded-sm object-cover" />
          ) : null}
          <input
            value={query}
            onClick={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            placeholder={value || 'Tìm quốc gia...'}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          <span className="rounded-lg bg-white/5 px-2 py-1 text-[11px] font-bold text-slate-300">
            {code || '--'}
          </span>
          <button
            type="button"
            aria-label={open ? 'Đóng danh sách đội' : 'Mở danh sách đội'}
            onClick={() => setOpen((current) => !current)}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {open ? (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur">
            <div className="mb-2 flex items-center justify-between border-b border-white/10 px-2 pb-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Chọn đội</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/15"
              >
                Đóng
              </button>
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((team) => (
                <button
                  key={`${team.name}-${team.code}`}
                  type="button"
                  onClick={() => handleSelect(team)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {team.flagUrl ? (
                      <img src={team.flagUrl} alt={team.name} className="h-5 w-7 shrink-0 rounded-sm object-cover" />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{team.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Bảng {team.group}</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-white/5 px-2 py-1 text-[11px] font-bold text-slate-300">
                    {team.code}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-slate-400">Không tìm thấy đội phù hợp.</div>
            )}
          </div>
        ) : null}
      </div>
    </label>
  );
}

export default function DevMatchEditor({ match }) {
  const { updateMatchOverride, resetMatchOverride } = useDevelopMode();
  const [draft, setDraft] = useState(() => createDraftFromMatch(match));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(createDraftFromMatch(match));
  }, [match]);

  const hasChanges = useMemo(() => {
    const current = createDraftFromMatch(match);
    return JSON.stringify(draft) !== JSON.stringify(current);
  }, [draft, match]);

  const handleSave = async () => {
    const payload = {
      homeTeam: draft.homeTeam,
      awayTeam: draft.awayTeam,
      homeCode: draft.homeCode.toUpperCase(),
      awayCode: draft.awayCode.toUpperCase(),
      homeLogo: draft.homeLogo,
      awayLogo: draft.awayLogo,
      matchTime: draft.matchTime
        ? parseVietnamDateTimeLocal(draft.matchTime)?.toISOString() || match.matchTime
        : match.matchTime,
      status: draft.status,
      homeScore: toNumberOrNull(draft.homeScore),
      awayScore: toNumberOrNull(draft.awayScore)
    };

    updateMatchOverride(match.id, {
      ...payload,
      winner: payload.status === 'finished' ? getResultFromScores(payload.homeScore, payload.awayScore) : null
    });

    setSaving(true);
    try {
      await saveMatchAndSyncScores(match.id, payload);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    resetMatchOverride(match.id);
    setDraft(createDraftFromMatch(match));
  };

  return (
    <div className="border-t border-cyan-400/20 bg-cyan-400/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Quản trị trận đấu</p>
          <p className="text-xs text-slate-400">Chỉnh bản nháp và bấm Lưu để áp dụng.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <RotateCcw size={13} />
            Đặt lại
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={13} />
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SearchableTeamSelect
          label="Đội nhà"
          value={draft.homeTeam}
          code={draft.homeCode}
          onSelect={(team) =>
            setDraft((current) => ({
              ...current,
              homeTeam: team.name,
              homeCode: team.code,
              homeLogo: team.flagUrl || ''
            }))
          }
        />

        <SearchableTeamSelect
          label="Đội khách"
          value={draft.awayTeam}
          code={draft.awayCode}
          onSelect={(team) =>
            setDraft((current) => ({
              ...current,
              awayTeam: team.name,
              awayCode: team.code,
              awayLogo: team.flagUrl || ''
            }))
          }
        />

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-300">Mã đội nhà</span>
          <input
            value={draft.homeCode}
            onChange={(event) => setDraft((current) => ({ ...current, homeCode: event.target.value.toUpperCase() }))}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-300">Mã đội khách</span>
          <input
            value={draft.awayCode}
            onChange={(event) => setDraft((current) => ({ ...current, awayCode: event.target.value.toUpperCase() }))}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50"
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium text-slate-300">Thời gian thi đấu</span>
          <input
            type="datetime-local"
            value={draft.matchTime}
            onChange={(event) => setDraft((current) => ({ ...current, matchTime: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-300">Trạng thái</span>
          <select
            value={draft.status}
            onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50"
          >
            <option value="upcoming">Sắp diễn ra</option>
            <option value="live">Đang diễn ra</option>
            <option value="finished">Đã kết thúc</option>
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-300">Tỷ số nhà</span>
            <input
              type="number"
              min="0"
              value={draft.homeScore}
              onChange={(event) => setDraft((current) => ({ ...current, homeScore: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-300">Tỷ số khách</span>
            <input
              type="number"
              min="0"
              value={draft.awayScore}
              onChange={(event) => setDraft((current) => ({ ...current, awayScore: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
