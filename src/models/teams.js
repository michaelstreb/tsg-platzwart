const STORAGE_KEY = 'belegung_teams';

/** Standard-Teams als Fallback. */
export const DEFAULT_TEAMS = [
  { name: 'Kindergarten',    color: '#F48FB1', active: true },
  { name: 'Bambini',         color: '#CE93D8', active: true },
  { name: 'G-Jugend',        color: '#EF9A9A', active: true },
  { name: 'F-Jugend',        color: '#E91E63', active: true },
  { name: 'E-Jugend',        color: '#FF5722', active: true },
  { name: 'D-Jugend',        color: '#FF9800', active: true },
  { name: 'C-Jugend',        color: '#FFC107', active: true },
  { name: 'B-Jugend',        color: '#4CAF50', active: true },
  { name: 'A-Jugend',        color: '#2196F3', active: true },
  { name: 'U7',              color: '#EF9A9A', active: true },
  { name: 'U8',              color: '#E91E63', active: true },
  { name: 'U9',              color: '#F44336', active: true },
  { name: 'U10',             color: '#FF5722', active: true },
  { name: 'U11',             color: '#FF7043', active: true },
  { name: 'U12',             color: '#FF9800', active: true },
  { name: 'U13',             color: '#FFA726', active: true },
  { name: 'U14',             color: '#FFC107', active: true },
  { name: 'U15',             color: '#CDDC39', active: true },
  { name: 'U16',             color: '#8BC34A', active: true },
  { name: 'U17',             color: '#4CAF50', active: true },
  { name: 'U18',             color: '#009688', active: true },
  { name: 'U19',             color: '#2196F3', active: true },
  { name: '1. Mannschaft',   color: '#3F51B5', active: true },
  { name: '2. Mannschaft',   color: '#5C6BC0', active: true },
  { name: '3. Mannschaft',   color: '#7986CB', active: true },
  { name: 'AH',              color: '#795548', active: true },
  { name: 'Frauen',          color: '#9C27B0', active: true },
  { name: 'Sonstige',        color: '#607D8B', active: true },
];

/** Lade Teams aus localStorage (oder Defaults). Migriert alte Einträge ohne active-Feld. */
export function loadTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const teams = JSON.parse(raw);
      return teams.map(t => t.active === undefined ? { ...t, active: true } : t);
    }
  } catch { /* ignore */ }
  return DEFAULT_TEAMS;
}

/** Speichere Teams in localStorage. */
export function saveTeams(teams) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

/** Farbe für einen Teamnamen aus der übergebenen Teamliste. Fallback grau. */
export function teamColor(team, teams) {
  if (!teams) teams = loadTeams();
  const entry = teams.find(t => t.name === team);
  return entry ? entry.color : '#607D8B';
}
