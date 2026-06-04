import groups from '../../data/groups.json';

export const teamOptions = groups
  .flatMap((group) =>
    (group.teams || []).map((team) => ({
      name: team.name || '',
      code: team.code || '',
      group: group.label || ''
    }))
  )
  .filter((team, index, source) => {
    const key = `${team.name}:${team.code}`;
    return source.findIndex((item) => `${item.name}:${item.code}` === key) === index;
  })
  .sort((left, right) => left.name.localeCompare(right.name));
