export function mergeMatchesById(baseMatches = [], remoteMatches = []) {
  const remoteMap = new Map((remoteMatches || []).map((match) => [match.id, match]));
  const merged = (baseMatches || []).map((match) => ({
    ...match,
    ...(remoteMap.get(match.id) || {})
  }));

  const baseIds = new Set((baseMatches || []).map((match) => match.id));
  const remoteOnly = (remoteMatches || []).filter((match) => !baseIds.has(match.id));

  return [...merged, ...remoteOnly];
}
