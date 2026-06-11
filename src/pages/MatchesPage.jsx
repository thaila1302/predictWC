import { useEffect, useMemo, useState } from 'react';
import { Clock3, Lock } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PredictionButtons from '../components/PredictionButtons';
import PredictionConfirmDialog from '../components/PredictionConfirmDialog';
import MatchCountdown from '../components/MatchCountdown';
import { formatDateTime, formatVietnamDay, getVietnamCalendarDayKey, isMatchStarted, isPredictionLocked, toDate } from '../lib/utils';
import { listenMatches, listenUserPredictions, savePrediction } from '../services/firestore';
import { useDevelopMode } from '../context/DevelopModeContext';
import { useAuth } from '../context/AuthContext';
import { mergeMatchesById } from '../lib/matchMerge';
import useMatchSpotlight from '../hooks/useMatchSpotlight';
import useCurrentTime from '../hooks/useCurrentTime';
import seedMatches from '../../data/matches.json';

function formatDayKey(value) {
  return getVietnamCalendarDayKey(value);
}

function groupMatchesByDay(matches, now) {
  const grouped = new Map();
  const todayKey = getVietnamCalendarDayKey(now);

  matches.forEach((match) => {
    const key = formatDayKey(match.matchTime);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(match);
  });

  return Array.from(grouped.entries())
    .map(([key, items]) => {
      const sortedMatches = [...items].sort((left, right) => {
        const leftTime = toDate(left.matchTime)?.getTime() || 0;
        const rightTime = toDate(right.matchTime)?.getTime() || 0;
        return leftTime - rightTime;
      });
      const allFinished = sortedMatches.every((match) => match.status === 'finished');
      const completed = allFinished || (key !== 'tbd' && key < todayKey);

      return {
        key,
        label: formatVietnamDay(items[0]?.matchTime),
        sortTime: toDate(items[0]?.matchTime)?.getTime() || 0,
        completed,
        matches: sortedMatches
      };
    })
    .sort((left, right) => {
      if (left.completed !== right.completed) return left.completed ? 1 : -1;
      return left.completed ? right.sortTime - left.sortTime : left.sortTime - right.sortTime;
    });
}

function TeamBadge({ team, code, logo, align = 'left' }) {
  const isRight = align === 'right';

  return (
    <div className={`flex min-w-0 items-center gap-2 sm:gap-3 ${isRight ? 'flex-row-reverse justify-start text-right' : ''}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900/80 p-2 ring-1 ring-white/10 sm:h-10 sm:w-10">
        {logo ? (
          <img src={logo} alt={team} className="h-full w-full object-contain" />
        ) : (
          <span className="text-[11px] font-black text-white">{code || (team || '?').slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold leading-tight text-white sm:text-lg">{team}</p>
      </div>
    </div>
  );
}

function MatchSeparatorIcon({ homeScore, awayScore }) {
  const hasScore = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;

  return (
    <div className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-sm sm:px-4 sm:py-2">
      <div className="flex items-center gap-2 text-slate-200">
        <span className="text-xl font-black leading-none sm:text-2xl">{hasScore ? homeScore : '-'}</span>
        <span className="text-xl font-black leading-none sm:text-2xl">:</span>
        <span className="text-xl font-black leading-none sm:text-2xl">{hasScore ? awayScore : '-'}</span>
      </div>
    </div>
  );
}

function MatchCard({ match, prediction, onPredict, saving }) {
  const started = isMatchStarted(match.matchTime);
  const finished = match.status === 'finished';
  const locked = finished || isPredictionLocked(match.matchTime);
  const isSpotlightMatch = useMatchSpotlight(match.matchTime) && match.status !== 'finished';
  const lockLabel = started ? 'Đã khóa' : 'Khóa trước 30 phút';

  return (
    <article className={`self-start overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-950/70 shadow-glow ring-1 ring-white/5 transition hover:border-white/20 ${isSpotlightMatch ? 'match-spotlight-card' : ''} ${finished ? 'finished-match-card' : ''}`}>
      <div className="p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={match.status || 'upcoming'} spotlight={isSpotlightMatch} />
            <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
              {match.group ? `Bảng ${match.group}` : 'Loại trực tiếp'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300 sm:text-xs">
            <Clock3 size={14} />
            <span>{formatDateTime(match.matchTime)}</span>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
          <TeamBadge team={match.homeTeam} code={match.homeCode} logo={match.homeLogo} />

          <div className="mx-auto flex min-h-[58px] min-w-[74px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-center sm:min-h-[88px] sm:min-w-[128px] sm:px-4 sm:py-3">
            <MatchSeparatorIcon homeScore={match.homeScore} awayScore={match.awayScore} />
          </div>

          <TeamBadge team={match.awayTeam} code={match.awayCode} logo={match.awayLogo} align="right" />
        </div>

        <MatchCountdown startTime={match.matchTime} status={match.status || 'upcoming'} />

        {locked ? (
          <div className="mt-4 flex justify-end text-xs text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-rose-200">
              <Lock size={12} />
              {lockLabel}
            </span>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/10 bg-white/5 p-3 pt-3 sm:p-4">
        <PredictionButtons
          value={prediction?.predictedResult}
          disabled={locked || saving}
          onChange={(value) => onPredict(value, { homeLabel: match.homeTeam, awayLabel: match.awayTeam })}
          homeLabel={match.homeTeam}
          awayLabel={match.awayTeam}
        />
      </div>
    </article>
  );
}

export default function MatchesPage() {
  const [matches, setMatches] = useState(seedMatches.groupStage || []);
  const [predictions, setPredictions] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [pendingPrediction, setPendingPrediction] = useState(null);
  const { applyMatchOverrides } = useDevelopMode();
  const { user } = useAuth();
  const now = useCurrentTime();

  useEffect(() => {
    return listenMatches((remoteMatches) => {
      if (remoteMatches.length > 0) {
        setMatches(mergeMatchesById(seedMatches.groupStage || [], remoteMatches));
      }
    });
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    return listenUserPredictions(user.uid, setPredictions);
  }, [user?.uid]);

  const predictionMap = useMemo(() => new Map(predictions.map((item) => [item.matchId, item])), [predictions]);
  const displayMatches = useMemo(() => applyMatchOverrides(matches), [applyMatchOverrides, matches]);
  const sections = useMemo(() => groupMatchesByDay(displayMatches, now), [displayMatches, now]);

  const handlePredict = (match, value, labels) => {
    if (match.status === 'finished' || isPredictionLocked(match.matchTime)) {
      return;
    }

    setPendingPrediction({
      match,
      value,
      currentChoice: predictionMap.get(match.id)?.predictedResult || '',
      homeLabel: labels?.homeLabel || match.homeTeam,
      awayLabel: labels?.awayLabel || match.awayTeam
    });
  };

  const handleConfirmPrediction = async () => {
    if (!pendingPrediction || !user?.uid) return;

    const { match, value } = pendingPrediction;
    setSavingId(match.id);
    try {
      await savePrediction({
        userId: user.uid,
        matchId: match.id,
        predictedResult: value
      });
      setPendingPrediction(null);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      {matches.length === 0 ? (
        <div className="glass rounded-[1.75rem] p-8 text-center shadow-glow">
          <p className="font-display text-2xl font-bold text-white">Chưa có trận đấu nào</p>
          <p className="mt-3 text-slate-300">Hãy yêu cầu quản trị viên nhập `data/matches.json` trước.</p>
        </div>
      ) : null}

      <div className="space-y-5">
        {sections.map((section) => (
          <section
            key={section.key}
            className={`overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-950/70 shadow-glow ring-1 ring-white/5 transition sm:rounded-[1.5rem] ${section.completed ? 'completed-match-day' : ''}`}
          >
            <div className="border-b border-white/10 bg-white/5 px-4 py-3 sm:px-5 sm:py-4">
              <h2 className="font-display text-xl font-black text-white">Vòng bảng - {section.label}</h2>
            </div>

            <div className="grid items-start gap-3 p-3 sm:gap-4 sm:p-4 md:grid-cols-2">
              {section.matches.map((match) => {
                const prediction = predictionMap.get(match.id);

                return (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={prediction}
                    saving={savingId === match.id}
                    onPredict={(value, labels) => handlePredict(match, value, labels)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <PredictionConfirmDialog
        open={Boolean(pendingPrediction)}
        match={pendingPrediction?.match}
        choice={pendingPrediction?.value}
        currentChoice={pendingPrediction?.currentChoice}
        homeLabel={pendingPrediction?.homeLabel}
        awayLabel={pendingPrediction?.awayLabel}
        saving={savingId === pendingPrediction?.match?.id}
        onCancel={() => setPendingPrediction(null)}
        onConfirm={handleConfirmPrediction}
      />
    </div>
  );
}
