import { useMemo } from 'preact/hooks';
import { teamColor } from '../models/teams.js';

export function TeamLegend({ bookings, teams }) {
  const visibleTeams = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const b of bookings) {
      if (!seen.has(b.team)) {
        seen.add(b.team);
        result.push({ name: b.team, color: teamColor(b.team, teams) });
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [bookings, teams]);

  if (visibleTeams.length === 0) return null;

  return (
    <div class="team-legend">
      {visibleTeams.map(t => (
        <span key={t.name} class="team-legend-item">
          <span class="team-legend-dot" style={{ background: t.color }} />
          {t.name}
        </span>
      ))}
    </div>
  );
}
