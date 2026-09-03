export function mapSkill(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
  };
}

export function mapArtisanSkillMapping(row: any) {
  return {
    id: row.id,
    artisanId: row.artisanId,
    skillId: row.skillId,
    level: row.level,
  };
}
