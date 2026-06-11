import { useEffect, useState } from 'react';
import { toDate } from '../lib/utils';

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DAY_MS = 24 * 60 * 60 * 1000;

function getVietnamDayNumber(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)) / DAY_MS;
}

export default function useMatchSpotlight(matchTime) {
  const [todayNumber, setTodayNumber] = useState(() => getVietnamDayNumber(new Date()));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTodayNumber(getVietnamDayNumber(new Date()));
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const matchDayNumber = getVietnamDayNumber(matchTime);
  const dayDifference = matchDayNumber === null || todayNumber === null ? null : matchDayNumber - todayNumber;

  return dayDifference === 0 || dayDifference === 1;
}
