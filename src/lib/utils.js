const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const MATCH_DURATION_MS = 110 * 60 * 1000;

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function toDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

export function toVietnamDate(value) {
  const date = toDate(value);
  if (!date) return null;
  return new Date(date.getTime() + VIETNAM_OFFSET_MS);
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return 'Đang cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
    hourCycle: 'h23'
  }).format(date);
}

export function formatVietnamDay(value) {
  const date = toVietnamDate(value);
  if (!date) return 'Đang cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatVietnamDayKey(value) {
  const date = toVietnamDate(value);
  if (!date) return 'tbd';
  return date.toISOString().slice(0, 10);
}

export function getVietnamCalendarDayKey(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return 'tbd';

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function parseVietnamDateTimeLocal(value) {
  if (!value) return null;
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  if ([year, month, day, hour, minute].some((component) => Number.isNaN(component))) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute));
}

export function toVietnamDateTimeLocal(value) {
  const date = toDate(value);
  if (!date) return '';
  const shifted = new Date(date.getTime() + VIETNAM_OFFSET_MS);
  return shifted.toISOString().slice(0, 16);
}

export function getMatchStatusLabel(status) {
  switch (status) {
    case 'live':
      return 'Đang diễn ra';
    case 'finished':
      return 'Kết thúc';
    default:
      return 'Sắp diễn ra';
  }
}

export function hasMatchScore(match) {
  return (
    match?.homeScore !== null &&
    match?.homeScore !== undefined &&
    match?.awayScore !== null &&
    match?.awayScore !== undefined
  );
}

export function getEffectiveMatchStatus(match, now = Date.now()) {
  if (match?.status === 'finished') return 'finished';

  const matchDate = toDate(match?.matchTime || match?.startTime);
  if (!matchDate || Number.isNaN(matchDate.getTime())) {
    return match?.status || 'upcoming';
  }

  const elapsedMs = now - matchDate.getTime();
  if (elapsedMs >= MATCH_DURATION_MS) return 'finished';
  if (elapsedMs >= 0) return 'live';
  return 'upcoming';
}

export function getResultFromScores(homeScore, awayScore) {
  if (homeScore === null || awayScore === null || homeScore === undefined || awayScore === undefined) {
    return null;
  }
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

export function isMatchStarted(startTime) {
  if (!startTime) return false;
  const date = toDate(startTime);
  if (!date) return false;
  return date.getTime() <= Date.now();
}

export function isPredictionLocked(startTime) {
  if (!startTime) return false;
  const date = toDate(startTime);
  if (!date) return false;
  return Date.now() >= date.getTime() - 30 * 60 * 1000;
}

export function getMatchSortTime(match) {
  const date = toDate(match?.matchTime || match?.startTime);
  return date ? date.getTime() : 0;
}
