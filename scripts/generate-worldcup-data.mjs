import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFlagUrlByCode } from '../src/lib/teamFlags.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const MATCH_TIME_SHIFT_MS = -7 * 60 * 60 * 1000;
const groupStageSourcePath = join(projectRoot, 'data', 'worldcup2026-group-stage.json');
const matchesPath = join(projectRoot, 'data', 'matches.json');

function shiftMatchTime(date) {
  return new Date(date.getTime() + MATCH_TIME_SHIFT_MS);
}

function parseVietnamDateTime(datePart, timePart) {
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0));
}

const groups = [
  {
    label: 'A',
    teams: [
      { name: 'Mexico', code: 'MEX' },
      { name: 'Nam Phi', code: 'RSA' },
      { name: 'Hàn Quốc', code: 'KOR' },
      { name: 'CH Séc', code: 'CZE' }
    ]
  },
  {
    label: 'B',
    teams: [
      { name: 'Canada', code: 'CAN' },
      { name: 'Bosnia & Herzegovina', code: 'BIH' },
      { name: 'Qatar', code: 'QAT' },
      { name: 'Thụy Sĩ', code: 'SUI' }
    ]
  },
  {
    label: 'C',
    teams: [
      { name: 'Brazil', code: 'BRA' },
      { name: 'Morocco', code: 'MAR' },
      { name: 'Haiti', code: 'HAI' },
      { name: 'Scotland', code: 'SCO' }
    ]
  },
  {
    label: 'D',
    teams: [
      { name: 'Mỹ', code: 'USA' },
      { name: 'Paraguay', code: 'PAR' },
      { name: 'Úc', code: 'AUS' },
      { name: 'Thổ Nhĩ Kỳ', code: 'TUR' }
    ]
  },
  {
    label: 'E',
    teams: [
      { name: 'Đức', code: 'GER' },
      { name: 'Curaçao', code: 'CUW' },
      { name: 'Bờ Biển Ngà', code: 'CIV' },
      { name: 'Ecuador', code: 'ECU' }
    ]
  },
  {
    label: 'F',
    teams: [
      { name: 'Hà Lan', code: 'NED' },
      { name: 'Nhật Bản', code: 'JPN' },
      { name: 'Thụy Điển', code: 'SWE' },
      { name: 'Tunisia', code: 'TUN' }
    ]
  },
  {
    label: 'G',
    teams: [
      { name: 'Bỉ', code: 'BEL' },
      { name: 'Ai Cập', code: 'EGY' },
      { name: 'Iran', code: 'IRN' },
      { name: 'New Zealand', code: 'NZL' }
    ]
  },
  {
    label: 'H',
    teams: [
      { name: 'Tây Ban Nha', code: 'ESP' },
      { name: 'Cabo Verde', code: 'CPV' },
      { name: 'Ả Rập Xê Út', code: 'KSA' },
      { name: 'Uruguay', code: 'URU' }
    ]
  },
  {
    label: 'I',
    teams: [
      { name: 'Pháp', code: 'FRA' },
      { name: 'Senegal', code: 'SEN' },
      { name: 'Iraq', code: 'IRQ' },
      { name: 'Na Uy', code: 'NOR' }
    ]
  },
  {
    label: 'J',
    teams: [
      { name: 'Argentina', code: 'ARG' },
      { name: 'Algeria', code: 'ALG' },
      { name: 'Áo', code: 'AUT' },
      { name: 'Jordan', code: 'JOR' }
    ]
  },
  {
    label: 'K',
    teams: [
      { name: 'Bồ Đào Nha', code: 'POR' },
      { name: 'CH Congo', code: 'COD' },
      { name: 'Uzbekistan', code: 'UZB' },
      { name: 'Colombia', code: 'COL' }
    ]
  },
  {
    label: 'L',
    teams: [
      { name: 'Anh', code: 'ENG' },
      { name: 'Croatia', code: 'CRO' },
      { name: 'Ghana', code: 'GHA' },
      { name: 'Panama', code: 'PAN' }
    ]
  }
];

const groupsWithFlags = groups.map((group) => ({
  ...group,
  teams: group.teams.map((team) => ({
    ...team,
    flagUrl: getFlagUrlByCode(team.code)
  }))
}));

const knockoutRounds = [
  {
    round: 'round_of_32',
    label: 'Vòng 1/16',
    matches: [
      ['Nhất bảng A', 'Nhì bảng B'],
      ['Nhất bảng C', 'Nhì bảng D'],
      ['Nhất bảng E', 'Nhì bảng F'],
      ['Nhất bảng G', 'Nhì bảng H'],
      ['Nhất bảng I', 'Nhì bảng J'],
      ['Nhất bảng K', 'Nhì bảng L'],
      ['Nhất bảng B', 'Hạng 3 bảng A/C/D/F'],
      ['Nhất bảng D', 'Hạng 3 bảng E/F/H/I'],
      ['Nhất bảng F', 'Nhì bảng A'],
      ['Nhất bảng H', 'Nhì bảng C'],
      ['Nhất bảng J', 'Nhì bảng E'],
      ['Nhất bảng L', 'Nhì bảng G'],
      ['Nhì bảng A', 'Hạng 3 bảng B/C/D/E'],
      ['Nhì bảng C', 'Hạng 3 bảng G/H/I/J'],
      ['Nhì bảng E', 'Hạng 3 bảng K/L/A/B'],
      ['Nhì bảng G', 'Hạng 3 bảng C/D/E/F']
    ]
  },
  {
    round: 'round_of_16',
    label: 'Vòng 1/8',
    matches: Array.from({ length: 8 }, (_, index) => [
      `Thắng trận ${index * 2 + 1}`,
      `Thắng trận ${index * 2 + 2}`
    ])
  },
  {
    round: 'quarter_final',
    label: 'Vòng tứ kết',
    matches: Array.from({ length: 4 }, (_, index) => [
      `Thắng trận ${index * 2 + 1}`,
      `Thắng trận ${index * 2 + 2}`
    ])
  },
  {
    round: 'semi_final',
    label: 'Vòng bán kết',
    matches: [
      ['Thắng tứ kết 1', 'Thắng tứ kết 2'],
      ['Thắng tứ kết 3', 'Thắng tứ kết 4']
    ]
  },
  {
    round: 'final',
    label: 'Chung kết',
    matches: [['Thắng bán kết 1', 'Thắng bán kết 2']]
  },
  {
    round: 'third_place',
    label: 'Tranh hạng 3',
    matches: [['Thua bán kết 1', 'Thua bán kết 2']]
  }
];

const teamAliases = new Map([
  ['bosnia', 'Bosnia & Herzegovina'],
  ['marocco', 'Morocco'],
  ['curacao', 'Curaçao'],
  ['saudi arabia', 'Ả Rập Xê Út'],
  ['chdc congo', 'CH Congo']
]);

function normalizeLookup(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function buildTeamIndex() {
  const index = new Map();
  groupsWithFlags.forEach((group) => {
    group.teams.forEach((team) => {
      index.set(normalizeLookup(team.name), { ...team, group: group.label });
    });
  });

  teamAliases.forEach((canonicalName, alias) => {
    const team = index.get(normalizeLookup(canonicalName));
    if (team) {
      index.set(normalizeLookup(alias), team);
    }
  });

  return index;
}

async function buildGroupStageMatches() {
  let source;
  try {
    source = JSON.parse(await readFile(groupStageSourcePath, 'utf8'));
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    const existingMatches = JSON.parse(await readFile(matchesPath, 'utf8'));
    return existingMatches.groupStage || [];
  }

  const teamIndex = buildTeamIndex();

  return source.matches.map((match, index) => {
    const homeTeam = teamIndex.get(normalizeLookup(match.homeTeam));
    const awayTeam = teamIndex.get(normalizeLookup(match.awayTeam));

    if (!homeTeam || !awayTeam) {
      throw new Error(`Unknown team in ${match.id}: ${match.homeTeam} vs ${match.awayTeam}`);
    }

    const matchGroup = homeTeam.group === awayTeam.group ? homeTeam.group : match.group;

    return {
      id: match.id,
      stage: 'group_stage',
      group: matchGroup,
      roundLabel: `Lượt trận ${Math.ceil((match.matchNumber || index + 1) / 24)} vòng bảng`,
      order: match.matchNumber || index + 1,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      homeCode: homeTeam.code,
      awayCode: awayTeam.code,
      homeLogo: homeTeam.flagUrl,
      awayLogo: awayTeam.flagUrl,
      matchTime: parseVietnamDateTime(match.date, match.time).toISOString(),
      status: match.status || 'upcoming',
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      winner: null
    };
  });
}

function buildKnockoutMatches() {
  return [];
}

async function main() {
  const dataDir = join(projectRoot, 'data');
  await mkdir(dataDir, { recursive: true });

  const groupsPath = join(dataDir, 'groups.json');

  const groupsJson = JSON.stringify(groupsWithFlags, null, 2);
  const matchesJson = JSON.stringify(
    {
      groupStage: await buildGroupStageMatches(),
      knockout: buildKnockoutMatches()
    },
    null,
    2
  );

  await writeFile(groupsPath, `${groupsJson}\n`, 'utf8');
  await writeFile(matchesPath, `${matchesJson}\n`, 'utf8');

  console.log('Generated data/groups.json and data/matches.json');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
