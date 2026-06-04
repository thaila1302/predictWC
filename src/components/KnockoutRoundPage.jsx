import { useEffect, useMemo, useState } from 'react';
import { Clock3, Lock } from 'lucide-react';
import SectionHeader from './SectionHeader';
import StatusBadge from './StatusBadge';
import PredictionButtons from './PredictionButtons';
import PredictionConfirmDialog from './PredictionConfirmDialog';
import MatchCountdown from './MatchCountdown';
import {
  formatDateTime,
  formatVietnamDay,
  formatVietnamDayKey,
  isMatchStarted,
  isPredictionLocked,
  parseVietnamDateTimeLocal,
  toDate
} from '../lib/utils';
import { listenMatches, listenUserPredictions, savePrediction } from '../services/firestore';
import { useDevelopMode } from '../context/DevelopModeContext';
import { useAuth } from '../context/AuthContext';
import { mergeMatchesById } from '../lib/matchMerge';

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

function groupMatchesByNearestDay(matches) {
  const grouped = new Map();

  matches.forEach((match) => {
    const key = formatVietnamDayKey(match.matchTime);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(match);
  });

  return Array.from(grouped.entries())
    .map(([key, items]) => ({
      key,
      label: formatVietnamDay(items[0]?.matchTime),
      sortTime: toDate(items[0]?.matchTime)?.getTime() || 0,
      matches: [...items].sort((left, right) => {
        const leftTime = toDate(left.matchTime)?.getTime() || 0;
        const rightTime = toDate(right.matchTime)?.getTime() || 0;
        return leftTime - rightTime;
      })
    }))
    .sort((left, right) => compareByNearestTime(left.sortTime, right.sortTime));
}

function TeamBadge({ team, code, logo, align = 'left' }) {
  const isRight = align === 'right';

  return (
    <div className={`flex items-center gap-3 ${isRight ? 'flex-row-reverse text-right' : ''}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/80 p-2 ring-1 ring-white/10">
        {logo ? (
          <img src={logo} alt={team} className="h-full w-full object-contain" />
        ) : (
          <span className="text-[11px] font-black text-white">{code || (team || '?').slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-white sm:text-lg">{team}</p>
      </div>
    </div>
  );
}

function MatchSeparatorIcon({ homeScore, awayScore }) {
  const hasScore = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;

  return (
    <div className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2 text-slate-200">
        <span className="text-2xl font-black leading-none">{hasScore ? homeScore : '-'}</span>
        <span className="text-2xl font-black leading-none">:</span>
        <span className="text-2xl font-black leading-none">{hasScore ? awayScore : '-'}</span>
      </div>
    </div>
  );
}

function MatchCard({ match, prediction, onPredict, saving, roundLabel, teamNameOverride }) {
  const { matchOverrides } = useDevelopMode();
  const started = isMatchStarted(match.matchTime);
  const locked = isPredictionLocked(match.matchTime);
  const lockLabel = started ? 'Da khoa' : 'Khoa truoc 30 phut';
  const override = matchOverrides[match.id] || {};
  const homeTeamName = Object.prototype.hasOwnProperty.call(override, 'homeTeam')
    ? match.homeTeam
    : teamNameOverride || match.homeTeam;
  const awayTeamName = Object.prototype.hasOwnProperty.call(override, 'awayTeam')
    ? match.awayTeam
    : teamNameOverride || match.awayTeam;

  return (
    <article className="self-start overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-950/70 shadow-glow ring-1 ring-white/5 transition hover:border-white/20">
      <div className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={match.status || 'upcoming'} />
            <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{roundLabel}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Clock3 size={14} />
            <span>{formatDateTime(match.matchTime)}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <TeamBadge team={homeTeamName} code={match.homeCode} logo={match.homeLogo} />

          <div className="mx-auto flex min-h-[88px] min-w-[128px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
            <MatchSeparatorIcon homeScore={match.homeScore} awayScore={match.awayScore} />
          </div>

          <TeamBadge team={awayTeamName} code={match.awayCode} logo={match.awayLogo} align="right" />
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

      <div className="border-t border-white/10 bg-white/5 p-4 pt-3">
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
  title,
  subtitle,
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

    return listenUserPredictions(user.uid, setPredictions);
  }, [user?.uid]);

  const predictionMap = useMemo(() => new Map(predictions.map((item) => [item.matchId, item])), [predictions]);
  const displayMatches = useMemo(() => applyMatchOverrides(matches), [applyMatchOverrides, matches]);
  const sections = useMemo(() => groupMatchesByNearestDay(displayMatches), [displayMatches]);

  const handlePredict = (match, value, labels) => {
    if (isPredictionLocked(match.matchTime)) {
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
      <SectionHeader title={title} subtitle={subtitle} />

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
            className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70 shadow-glow ring-1 ring-white/5"
          >
            <div className="border-b border-white/10 bg-white/5 px-5 py-4">
              <h2 className="font-display text-xl font-black text-white">
                {roundLabel} - {section.label}
              </h2>
            </div>

            <div className="grid items-start gap-4 p-4 md:grid-cols-2">
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
