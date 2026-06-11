export const DEFAULT_STAKE = 10000;

const STAKES_BY_ROUND = {
  group_stage: 10000,
  round_of_32: 10000,
  round_of_16: 20000,
  quarter_final: 30000,
  quarter_finals: 30000,
  semi_final: 50000,
  semi_finals: 50000,
  third_place: 50000,
  final: 100000
};

export function getMatchStake(match) {
  const round = match?.round || match?.stage;
  return STAKES_BY_ROUND[round] || DEFAULT_STAKE;
}
