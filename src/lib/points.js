export function getPredictionPoints(predictedResult, actualResult) {
  if (!predictedResult || !actualResult) return 0;
  return String(predictedResult).toLowerCase() === String(actualResult).toLowerCase() ? 1 : -1;
}

export function calculateWinner(homeScore, awayScore) {
  if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) {
    return null;
  }

  if (homeScore > awayScore) return 'HOME';
  if (awayScore > homeScore) return 'AWAY';
  return 'DRAW';
}
