import ScorePill from './ScorePill';

const CARD_ROW_SPAN = 3;
const GRID_ROWS = 32;
const CANVAS_MIN_WIDTH = 2880;
const CANVAS_HEIGHT = 1120;

const gridTemplateColumns = [
  '220px',
  '90px',
  '220px',
  '110px',
  '220px',
  '120px',
  '220px',
  '120px',
  '240px',
  '120px',
  '220px',
  '120px',
  '220px',
  '110px',
  '220px',
  '90px',
  '220px'
].join(' ');

const gridTemplateRows = `repeat(${GRID_ROWS}, 34px)`;

const roundStyles = {
  round_of_32: 'from-cyan-400 to-teal-400',
  round_of_16: 'from-sky-400 to-cyan-400',
  quarter_final: 'from-fuchsia-400 to-pink-500',
  semi_final: 'from-lime-400 to-emerald-500',
  final: 'from-orange-400 to-rose-500',
  third_place: 'from-violet-400 to-indigo-500'
};

const roundLabels = {
  round_of_32: '1/16',
  round_of_16: 'Vòng 1/8',
  quarter_final: 'Tứ kết',
  semi_final: 'Bán kết',
  final: 'Final',
  third_place: 'Hạng ba'
};

const cardSlots = [
  { id: 'm74', key: 'round_of_32-1', round: 'round_of_32', col: 1, row: 1, meta: 'M74', date: '29-Jun', home: 'E1', away: 'ABCDF3' },
  { id: 'm77', key: 'round_of_32-2', round: 'round_of_32', col: 1, row: 5, meta: 'M77', date: '30-Jun', home: 'I1', away: 'CDFGH3' },
  { id: 'm73', key: 'round_of_32-3', round: 'round_of_32', col: 1, row: 9, meta: 'M73', date: '28-Jun', home: 'A2', away: 'B2' },
  { id: 'm75', key: 'round_of_32-4', round: 'round_of_32', col: 1, row: 13, meta: 'M75', date: '29-Jun', home: 'F1', away: 'C2' },
  { id: 'm83', key: 'round_of_32-5', round: 'round_of_32', col: 1, row: 17, meta: 'M83', date: '2-Jul', home: 'K2', away: 'L2' },
  { id: 'm84', key: 'round_of_32-6', round: 'round_of_32', col: 1, row: 21, meta: 'M84', date: '2-Jul', home: 'H1', away: 'J2' },
  { id: 'm81', key: 'round_of_32-7', round: 'round_of_32', col: 1, row: 25, meta: 'M81', date: '1-Jul', home: 'D1', away: 'BEFIJ3' },
  { id: 'm82', key: 'round_of_32-8', round: 'round_of_32', col: 1, row: 29, meta: 'M82', date: '1-Jul', home: 'G1', away: 'AEHIJ3' },

  { id: 'm89', key: 'round_of_16-1', round: 'round_of_16', col: 3, row: 3, meta: 'M89', date: '4-Jul', home: 'Thắng M74', away: 'Thắng M77' },
  { id: 'm90', key: 'round_of_16-2', round: 'round_of_16', col: 3, row: 11, meta: 'M90', date: '4-Jul', home: 'Thắng M73', away: 'Thắng M75' },
  { id: 'm93', key: 'round_of_16-3', round: 'round_of_16', col: 3, row: 19, meta: 'M93', date: '6-Jul', home: 'Thắng M83', away: 'Thắng M84' },
  { id: 'm94', key: 'round_of_16-4', round: 'round_of_16', col: 3, row: 27, meta: 'M94', date: '6-Jul', home: 'Thắng M81', away: 'Thắng M82' },

  { id: 'm97', key: 'quarter_final-25', round: 'quarter_final', col: 5, row: 7, meta: 'M97', date: '9-Jul', home: 'Thắng M89', away: 'Thắng M90' },
  { id: 'm98', key: 'quarter_final-26', round: 'quarter_final', col: 5, row: 23, meta: 'M98', date: '10-Jul', home: 'Thắng M93', away: 'Thắng M94' },
  { id: 'm101', key: 'semi_final-29', round: 'semi_final', col: 7, row: 15, meta: 'M101', date: '14-Jul', home: 'Thắng M97', away: 'Thắng M98' },

  { id: 'final', key: 'final-31', round: 'final', col: 9, row: 13, meta: 'CHUNG KẾT', date: '19-Jul', home: 'Thắng M101', away: 'Thắng M102', featured: true },
  { id: 'bronze', key: 'third_place-32', round: 'third_place', col: 9, row: 19, meta: 'TRANH HẠNG BA', date: '18-Jul', home: 'Thua M101', away: 'Thua M102', featured: true },

  { id: 'm102', key: 'semi_final-30', round: 'semi_final', col: 11, row: 15, meta: 'M102', date: '15-Jul', home: 'Thắng M99', away: 'Thắng M100' },
  { id: 'm99', key: 'quarter_final-27', round: 'quarter_final', col: 13, row: 7, meta: 'M99', date: '11-Jul', home: 'Thắng M91', away: 'Thắng M92' },
  { id: 'm100', key: 'quarter_final-28', round: 'quarter_final', col: 13, row: 23, meta: 'M100', date: '11-Jul', home: 'Thắng M95', away: 'Thắng M96' },

  { id: 'm91', key: 'round_of_16-5', round: 'round_of_16', col: 15, row: 3, meta: 'M91', date: '5-Jul', home: 'Thắng M76', away: 'Thắng M78' },
  { id: 'm92', key: 'round_of_16-6', round: 'round_of_16', col: 15, row: 11, meta: 'M92', date: '5-Jul', home: 'Thắng M79', away: 'Thắng M80' },
  { id: 'm95', key: 'round_of_16-7', round: 'round_of_16', col: 15, row: 19, meta: 'M95', date: '7-Jul', home: 'Thắng M86', away: 'Thắng M88' },
  { id: 'm96', key: 'round_of_16-8', round: 'round_of_16', col: 15, row: 27, meta: 'M96', date: '7-Jul', home: 'Thắng M85', away: 'Thắng M87' },

  { id: 'm76', key: 'round_of_32-9', round: 'round_of_32', col: 17, row: 1, meta: 'M76', date: '29-Jun', home: 'C1', away: 'F2' },
  { id: 'm78', key: 'round_of_32-10', round: 'round_of_32', col: 17, row: 5, meta: 'M78', date: '30-Jun', home: 'E2', away: 'I2' },
  { id: 'm79', key: 'round_of_32-11', round: 'round_of_32', col: 17, row: 9, meta: 'M79', date: '30-Jun', home: 'A1', away: 'CEFHI3' },
  { id: 'm80', key: 'round_of_32-12', round: 'round_of_32', col: 17, row: 13, meta: 'M80', date: '1-Jul', home: 'L1', away: 'EHIJK3' },
  { id: 'm86', key: 'round_of_32-13', round: 'round_of_32', col: 17, row: 17, meta: 'M86', date: '3-Jul', home: 'J1', away: 'H2' },
  { id: 'm88', key: 'round_of_32-14', round: 'round_of_32', col: 17, row: 21, meta: 'M88', date: '3-Jul', home: 'D2', away: 'G2' },
  { id: 'm85', key: 'round_of_32-15', round: 'round_of_32', col: 17, row: 25, meta: 'M85', date: '2-Jul', home: 'B1', away: 'EFGIJ3' },
  { id: 'm87', key: 'round_of_32-16', round: 'round_of_32', col: 17, row: 29, meta: 'M87', date: '3-Jul', home: 'K1', away: 'DEIJL3' }
];

const connectors = [
  { id: 'c74-89', from: 'm74', to: 'm89', col: 2, side: 'left' },
  { id: 'c77-89', from: 'm77', to: 'm89', col: 2, side: 'left' },
  { id: 'c73-90', from: 'm73', to: 'm90', col: 2, side: 'left' },
  { id: 'c75-90', from: 'm75', to: 'm90', col: 2, side: 'left' },
  { id: 'c83-93', from: 'm83', to: 'm93', col: 2, side: 'left' },
  { id: 'c84-93', from: 'm84', to: 'm93', col: 2, side: 'left' },
  { id: 'c81-94', from: 'm81', to: 'm94', col: 2, side: 'left' },
  { id: 'c82-94', from: 'm82', to: 'm94', col: 2, side: 'left' },

  { id: 'c89-97', from: 'm89', to: 'm97', col: 4, side: 'left' },
  { id: 'c90-97', from: 'm90', to: 'm97', col: 4, side: 'left' },
  { id: 'c93-98', from: 'm93', to: 'm98', col: 4, side: 'left' },
  { id: 'c94-98', from: 'm94', to: 'm98', col: 4, side: 'left' },
  { id: 'c97-101', from: 'm97', to: 'm101', col: 6, side: 'left' },
  { id: 'c98-101', from: 'm98', to: 'm101', col: 6, side: 'left' },
  { id: 'c101-final', from: 'm101', to: 'final', col: 8, side: 'left' },
  { id: 'c101-bronze', from: 'm101', to: 'bronze', col: 8, side: 'left' },

  { id: 'c102-final', from: 'm102', to: 'final', col: 10, side: 'right' },
  { id: 'c102-bronze', from: 'm102', to: 'bronze', col: 10, side: 'right' },
  { id: 'c99-102', from: 'm99', to: 'm102', col: 12, side: 'right' },
  { id: 'c100-102', from: 'm100', to: 'm102', col: 12, side: 'right' },
  { id: 'c91-99', from: 'm91', to: 'm99', col: 14, side: 'right' },
  { id: 'c92-99', from: 'm92', to: 'm99', col: 14, side: 'right' },
  { id: 'c95-100', from: 'm95', to: 'm100', col: 14, side: 'right' },
  { id: 'c96-100', from: 'm96', to: 'm100', col: 14, side: 'right' },

  { id: 'c76-91', from: 'm76', to: 'm91', col: 16, side: 'right' },
  { id: 'c78-91', from: 'm78', to: 'm91', col: 16, side: 'right' },
  { id: 'c79-92', from: 'm79', to: 'm92', col: 16, side: 'right' },
  { id: 'c80-92', from: 'm80', to: 'm92', col: 16, side: 'right' },
  { id: 'c86-95', from: 'm86', to: 'm95', col: 16, side: 'right' },
  { id: 'c88-95', from: 'm88', to: 'm95', col: 16, side: 'right' },
  { id: 'c85-96', from: 'm85', to: 'm96', col: 16, side: 'right' },
  { id: 'c87-96', from: 'm87', to: 'm96', col: 16, side: 'right' }
];

function parseActualKey(match) {
  if (!match.round) return '';
  return `${match.round}-${match.order || 0}`;
}

function normalizeMatchId(value) {
  return String(value || '').trim().toLowerCase();
}

function formatBracketDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(date);
}

function buildActualLookup(matches) {
  return matches.reduce((lookup, match) => {
    const key = parseActualKey(match);
    if (key) lookup[key] = match;
    const matchId = normalizeMatchId(match.id);
    if (matchId) lookup[matchId] = match;
    return lookup;
  }, {});
}

function getSlotWithActual(slot, actualLookup) {
  const actual = actualLookup[normalizeMatchId(slot.meta)] || actualLookup[slot.key];
  return {
    ...slot,
    home: actual?.homeTeam || '',
    away: actual?.awayTeam || '',
    date: formatBracketDate(actual?.matchTime),
    homeScore: actual?.homeScore ?? null,
    awayScore: actual?.awayScore ?? null,
    status: actual?.status || 'upcoming'
  };
}

function cardRowSpan(slot) {
  return slot.featured ? CARD_ROW_SPAN + 1 : CARD_ROW_SPAN;
}

function centerRow(slot) {
  return slot.row + cardRowSpan(slot) / 2;
}

function connectorGridArea(connector, slotMap) {
  const from = slotMap.get(connector.from);
  const to = slotMap.get(connector.to);
  const startRow = Math.floor(Math.min(centerRow(from), centerRow(to)));
  const endRow = Math.ceil(Math.max(centerRow(from), centerRow(to)));

  return {
    from,
    to,
    rowStart: Math.max(1, startRow),
    rowEnd: Math.min(GRID_ROWS + 1, endRow + 1)
  };
}

function connectorPath({ from, to, rowStart, rowEnd }, side) {
  const rowSpan = rowEnd - rowStart;
  const fromY = ((centerRow(from) - rowStart) / rowSpan) * 100;
  const toY = ((centerRow(to) - rowStart) / rowSpan) * 100;

  if (side === 'right') {
    return `M 100 ${fromY} H 48 V ${toY} H 0`;
  }

  return `M 0 ${fromY} H 52 V ${toY} H 100`;
}

function seedChipClass(seedLabel) {
  const value = String(seedLabel || '');
  const first = value.charCodeAt(0) || 0;
  const palette = [
    'bg-cyan-400/20 text-cyan-200 ring-cyan-400/25',
    'bg-fuchsia-400/20 text-fuchsia-200 ring-fuchsia-400/25',
    'bg-emerald-400/20 text-emerald-200 ring-emerald-400/25',
    'bg-amber-400/20 text-amber-200 ring-amber-400/25',
    'bg-sky-400/20 text-sky-200 ring-sky-400/25',
    'bg-violet-400/20 text-violet-200 ring-violet-400/25'
  ];
  return palette[first % palette.length];
}

function TeamRow({ label }) {
  return (
    <div className="flex min-h-0 items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="min-w-0 truncate text-sm font-bold text-white">{label || 'Chờ đội'}</span>
      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase ring-1 ${seedChipClass(label || 'Chờ đội')}`}>
        {String(label || 'Chờ đội').slice(0, 3)}
      </span>
    </div>
  );
}

function CompactMatchCard({ slot }) {
  const hasResult = slot.homeScore !== null && slot.awayScore !== null;

  return (
    <article className="relative min-w-0 rounded-[1.3rem] border border-white/10 bg-slate-950/85 p-4 shadow-glow ring-1 ring-white/5">
      <div className={`absolute inset-y-0 left-0 w-1 rounded-l-[1.3rem] bg-gradient-to-b ${roundStyles[slot.round] || roundStyles.round_of_32}`} />
      <div className="mb-3 flex items-center justify-between gap-2 pl-2">
        <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{slot.meta}</span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{slot.date}</span>
      </div>
      <div className="space-y-2 pl-2">
        <TeamRow label={slot.home} />
        <TeamRow label={slot.away} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 pl-2 text-[11px] text-slate-400">
        <span className="truncate uppercase tracking-[0.2em] text-slate-500">{roundLabels[slot.round]}</span>
        {hasResult ? (
          <div className="scale-90 origin-right">
            <ScorePill homeScore={slot.homeScore} awayScore={slot.awayScore} />
          </div>
        ) : (
          <span className="shrink-0 text-slate-300">Chưa có kết quả</span>
        )}
      </div>
    </article>
  );
}

function MatchCard({ slot }) {
  const hasResult = slot.homeScore !== null && slot.awayScore !== null;

  return (
    <article
      className="relative z-10 h-full min-w-0 rounded-[1.3rem] border border-white/10 bg-slate-950/85 p-3 shadow-glow ring-1 ring-white/5"
      style={{
        gridColumn: slot.col,
        gridRow: `${slot.row} / span ${CARD_ROW_SPAN}`
      }}
    >
      <div className={`absolute inset-y-0 left-0 w-1 rounded-l-[1.3rem] bg-gradient-to-b ${roundStyles[slot.round] || roundStyles.round_of_32}`} />
      <div className="mb-2 flex items-center justify-between gap-2 pl-2">
        <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{slot.meta}</span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{slot.date}</span>
      </div>
      <div className="grid h-[calc(100%-1.25rem)] grid-rows-[1fr_1fr_auto] gap-2 pl-2">
        <TeamRow label={slot.home} />
        <TeamRow label={slot.away} />
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <span className="truncate uppercase tracking-[0.2em] text-slate-500">{roundLabels[slot.round]}</span>
          {hasResult ? (
            <div className="scale-90 origin-right">
              <ScorePill homeScore={slot.homeScore} awayScore={slot.awayScore} />
            </div>
          ) : (
            <span className="shrink-0 text-slate-300">Chưa có kết quả</span>
          )}
        </div>
      </div>
    </article>
  );
}

function FeaturedMatchCard({ slot }) {
  return (
    <article
      className="relative z-10 h-full min-w-0 rounded-[1.5rem] border border-white/10 bg-slate-950/90 p-4 shadow-glow ring-1 ring-white/5"
      style={{
        gridColumn: slot.col,
        gridRow: `${slot.row} / span ${CARD_ROW_SPAN + 1}`
      }}
    >
      <div className={`absolute inset-x-0 top-0 rounded-t-[1.5rem] bg-gradient-to-r ${roundStyles[slot.round]} px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.34em] text-slate-950`}>
        {slot.meta}
      </div>
      <div className="mt-8 grid h-[calc(100%-2rem)] grid-rows-[1fr_auto_1fr_auto] gap-2">
        <TeamRow label={slot.home} />
        <div className="flex items-center justify-center">
          <ScorePill homeScore={slot.homeScore} awayScore={slot.awayScore} />
        </div>
        <TeamRow label={slot.away} />
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="uppercase tracking-[0.22em]">{roundLabels[slot.round]}</span>
          <span>{slot.date}</span>
        </div>
      </div>
    </article>
  );
}

function SVGConnectors({ slotMap }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 grid"
      style={{
        gridTemplateColumns,
        gridTemplateRows
      }}
    >
      {connectors.map((connector) => {
        const area = connectorGridArea(connector, slotMap);
        return (
          <svg
            key={connector.id}
            className="h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              gridColumn: connector.col,
              gridRow: `${area.rowStart} / ${area.rowEnd}`
            }}
          >
            <path
              d={connectorPath(area, connector.side)}
              fill="none"
              stroke="rgba(226,232,240,0.62)"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        );
      })}
    </div>
  );
}

export default function KnockoutBracket({ matches = [] }) {
  const actualLookup = buildActualLookup(matches);
  const slots = cardSlots.map((slot) => getSlotWithActual(slot, actualLookup));
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const activeRounds = new Set(matches.map((match) => match.round || match.stage).filter(Boolean));
  const roundOf32Only = activeRounds.size === 1 && activeRounds.has('round_of_32');

  if (roundOf32Only) {
    const leftSlots = slots.filter((slot) => slot.round === 'round_of_32' && slot.col === 1).sort((left, right) => left.row - right.row);
    const rightSlots = slots.filter((slot) => slot.round === 'round_of_32' && slot.col === 17).sort((left, right) => left.row - right.row);

    return (
      <div className="grid gap-4">
        {leftSlots.map((leftSlot, index) => (
          <div key={leftSlot.id} className="grid gap-4 xl:grid-cols-2">
            <CompactMatchCard slot={leftSlot} />
            {rightSlots[index] ? <CompactMatchCard slot={rightSlots[index]} /> : <div />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-[2rem] border border-white/10 bg-slate-950/40 shadow-glow">
      <div
        className="relative grid"
        style={{
          width: CANVAS_MIN_WIDTH,
          minWidth: CANVAS_MIN_WIDTH,
          height: CANVAS_HEIGHT,
          gridTemplateColumns,
          gridTemplateRows
        }}
      >
        <SVGConnectors slotMap={slotMap} />
        {slots.map((slot) =>
          slot.featured ? <FeaturedMatchCard key={slot.id} slot={slot} /> : <MatchCard key={slot.id} slot={slot} />
        )}
      </div>
    </div>
  );
}
