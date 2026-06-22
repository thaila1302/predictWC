import { useEffect, useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PredictionButtons from './PredictionButtons';
import PredictionConfirmDialog from './PredictionConfirmDialog';
import MatchCountdown from './MatchCountdown';
import {
  formatDateTime,
  formatVietnamDay,
  getEffectiveMatchStatus,
  getVietnamCalendarDayKey,
  hasMatchScore,
  isPredictionLocked,
  parseVietnamDateTimeLocal,
  toDate
} from '../lib/utils';
import { listenMatches, listenUserPredictions, savePrediction } from '../services/firestore';
import { useDevelopMode } from '../context/DevelopModeContext';
import { useAuth } from '../context/AuthContext';
import { mergeMatchesById } from '../lib/matchMerge';
import useMatchSpotlight from '../hooks/useMatchSpotlight';
import useCurrentTime from '../hooks/useCurrentTime';
import { useUnit } from '../context/UnitContext';

function normalizeRoundSeed(payload, roundKey, roundLabel) {
  return (payload?.matches || []).map((match, index) => ({
    id: match.id,
    stage: 'knockout',
    round: roundKey,
    roundLabel,
    order: match.matchNumber || index + 1,
    homeTeam: match.homeTeam || '',
    awayTeam: match.awayTeam || '',
    homeCode: '',
    awayCode: '',
    homeLogo: '',
    awayLogo: '',
    matchTime: parseVietnamDateTimeLocal(`${match.date}T${match.time}`),
    status: match.status || 'upcoming',
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    winner: null
  }));
}

function compareByNearestTime(left, right) {
  const now = Date.now();
  const leftTime = toDate(left)?.getTime() || 0;
  const rightTime = toDate(right)?.getTime() || 0;
  const leftDelta = leftTime - now;
  const rightDelta = rightTime - now;
  const leftFuture = leftDelta >= 0;
  const rightFuture = rightDelta >= 0;

  if (leftFuture && !rightFuture) return -1;
  if (!leftFuture && rightFuture) return 1;
  if (leftFuture && rightFuture) return leftDelta - rightDelta;
  return Math.abs(leftDelta) - Math.abs(rightDelta);
}

function groupMatchesByNearestDay(matches, now) {
  const grouped = new Map();
  const todayKey = getVietnamCalendarDayKey(now);

  matches.forEach((match) => {
    const key = getVietnamCalendarDayKey(match.matchTime);
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
      return left.completed
        ? right.sortTime - left.sortTime
        : compareByNearestTime(left.sortTime, right.sortTime);
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

function MatchSeparatorIcon({ match }) {
  const hasScore = hasMatchScore(match);

  return (
    <div className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-sm sm:px-4 sm:py-2">
      {match.status === 'finished' && !hasScore ? (
        <span className="max-w-28 text-center text-[10px] font-bold leading-tight text-amber-200 sm:text-xs">
          Đang chờ cập nhật tỉ số
        </span>
      ) : (
        <div className="flex items-center gap-2 text-slate-200">
          <span className="text-xl font-black leading-none sm:text-2xl">{hasScore ? match.homeScore : '-'}</span>
          <span className="text-xl font-black leading-none sm:text-2xl">:</span>
          <span className="text-xl font-black leading-none sm:text-2xl">{hasScore ? match.awayScore : '-'}</span>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, prediction, onPredict, saving, roundLabel, teamNameOverride }) {
  const { matchOverrides } = useDevelopMode();
  const finished = match.status === 'finished';
  const locked = finished || isPredictionLocked(match.matchTime);
  const isSpotlightMatch = useMatchSpotlight(match.matchTime) && match.status !== 'finished';
  const override = matchOverrides[match.id] || {};
  const homeTeamName = Object.prototype.hasOwnProperty.call(override, 'homeTeam')
    ? match.homeTeam
    : teamNameOverride || match.homeTeam;
  const awayTeamName = Object.prototype.hasOwnProperty.call(override, 'awayTeam')
    ? match.awayTeam
    : teamNameOverride || match.awayTeam;

  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-950/70 shadow-glow ring-1 ring-white/5 transition hover:border-white/20 ${isSpotlightMatch ? 'match-spotlight-card' : ''} ${finished ? 'finished-match-card' : ''}`}>
      <div className="p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={match.status || 'upcoming'} spotlight={isSpotlightMatch} />
            <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{roundLabel}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300 sm:text-xs">
            <Clock3 size={14} />
            <span>{formatDateTime(match.matchTime)}</span>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
          <TeamBadge team={homeTeamName} code={match.homeCode} logo={match.homeLogo} />

          <div className="mx-auto flex min-h-[58px] min-w-[74px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-center sm:min-h-[88px] sm:min-w-[128px] sm:px-4 sm:py-3">
            <MatchSeparatorIcon match={match} />
          </div>

          <TeamBadge team={awayTeamName} code={match.awayCode} logo={match.awayLogo} align="right" />
        </div>

        <MatchCountdown startTime={match.matchTime} status={match.status || 'upcoming'} />

      </div>

      <div className="mt-auto border-t border-white/10 bg-white/5 p-3 pt-3 sm:p-4">
        <PredictionButtons
          value={prediction?.predictedResult}
          disabled={locked || saving}
          onChange={(value) => onPredict(value, { homeLabel: homeTeamName, awayLabel: awayTeamName })}
          homeLabel={homeTeamName}
          awayLabel={awayTeamName}
        />
      </div>
    </article>
  );
}

export default function KnockoutRoundPage({
  roundKey,
  roundLabel,
  emptyTitle,
  emptyHint,
  seedData,
  teamNameOverride = ''
}) {
  const [matches, setMatches] = useState(() => normalizeRoundSeed(seedData, roundKey, roundLabel));
  const [predictions, setPredictions] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [pendingPrediction, setPendingPrediction] = useState(null);
  const { applyMatchOverrides } = useDevelopMode();
  const { user } = useAuth();
  const { unitId } = useUnit();
  const now = useCurrentTime();

  useEffect(() => {
    return listenMatches((remoteMatches) => {
      const knockoutMatches = remoteMatches.filter((match) => {
        const round = match.round || match.stage;
        return round === roundKey || (match.stage === 'knockout' && (!match.round || match.round === roundKey));
      });

      if (knockoutMatches.length > 0) {
        setMatches(mergeMatchesById(normalizeRoundSeed(seedData, roundKey, roundLabel), knockoutMatches));
      }
    });
  }, [roundKey, roundLabel, seedData]);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    return listenUserPredictions(user.uid, unitId, setPredictions);
  }, [unitId, user?.uid]);

  const predictionMap = useMemo(() => new Map(predictions.map((item) => [item.matchId, item])), [predictions]);
  const displayMatches = useMemo(
    () => applyMatchOverrides(matches).map((match) => ({ ...match, status: getEffectiveMatchStatus(match, now) })),
    [applyMatchOverrides, matches, now]
  );
  const sections = useMemo(() => groupMatchesByNearestDay(displayMatches, now), [displayMatches, now]);

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
        unitId,
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
          <p className="font-display text-2xl font-bold text-white">{emptyTitle}</p>
          <p className="mt-3 text-slate-300">{emptyHint}</p>
        </div>
      ) : null}

      <div className="space-y-5">
        {sections.map((section) => (
          <section
            key={section.key}
            className={`overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-950/70 shadow-glow ring-1 ring-white/5 transition sm:rounded-[1.5rem] ${section.completed ? 'completed-match-day' : ''}`}
          >
            <div className="border-b border-white/10 bg-white/5 px-4 py-3 sm:px-5 sm:py-4">
              <h2 className="font-display text-lg font-black text-white sm:text-xl">
                {roundLabel} - {section.label}
              </h2>
            </div>

            <div className="grid items-stretch gap-3 p-3 sm:gap-4 sm:p-4 md:grid-cols-2">
              {section.matches.map((match) => {
                const prediction = predictionMap.get(match.id);
                const isSingleMatchSection = section.matches.length === 1;

                return (
                  <div key={match.id} className={isSingleMatchSection ? 'md:col-span-2' : ''}>
                    <MatchCard
                      match={match}
                      prediction={prediction}
                      saving={savingId === match.id}
                      roundLabel={roundLabel}
                      teamNameOverride={teamNameOverride}
                      onPredict={(value, labels) => handlePredict(match, value, labels)}
                    />
                  </div>
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
