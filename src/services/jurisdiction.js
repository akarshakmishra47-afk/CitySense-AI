const DISTRICT_ALIASES = new Map([
  ['rae bareli', 'Raebareli'],
  ['rae-bareli', 'Raebareli'],
  ['raebareli', 'Raebareli']
]);

function normalizeDistrict(value) {
  if (typeof value !== 'string') return value || null;
  const district = value.trim();
  return DISTRICT_ALIASES.get(district.toLowerCase()) || district;
}

function buildLocalBodyId(district, localBodyName) {
  if (!district || !localBodyName) return null;
  const slug = value => value.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9]/g, '_');
  return `UP_${slug(normalizeDistrict(district))}_${slug(localBodyName)}`;
}

function normalizeLocalBodyId(value) {
  if (typeof value !== 'string') return value || null;
  return value.replace(/^UP_RAE[_-]?BARELI_/i, 'UP_RAEBARELI_');
}

module.exports = { normalizeDistrict, buildLocalBodyId, normalizeLocalBodyId };