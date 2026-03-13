import { useState, useMemo } from 'preact/hooks';
import { teamColor } from '../models/teams.js';

export function BookingList({ bookings, facilities, teams, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [filterFacility, setFilterFacility] = useState('');

  const filtered = useMemo(() => {
    let result = bookings;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.team.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        b.notes?.toLowerCase().includes(q)
      );
    }

    if (filterFacility) {
      result = result.filter(b => b.facilityId === filterFacility);
    }

    return result.sort((a, b) => a.team.localeCompare(b.team));
  }, [bookings, search, filterFacility]);

  const facilityName = (id) => facilities.find(f => f.id === id)?.name || id;

  const formatDays = (rrule) => {
    if (!rrule) return 'Einmalig';
    const dayMap = { MO: 'Mo', TU: 'Di', WE: 'Mi', TH: 'Do', FR: 'Fr', SA: 'Sa', SU: 'So' };
    const match = rrule.match(/BYDAY=([A-Z,]+)/);
    if (match) {
      return match[1].split(',').map(d => dayMap[d] || d).join(', ');
    }
    return rrule;
  };

  return (
    <div class="booking-list">
      <div class="bl-toolbar">
        <input
          type="search"
          class="form-input bl-search"
          placeholder="Suchen..."
          value={search}
          onInput={(e) => setSearch(e.target.value)}
        />
        <select
          class="form-input bl-filter"
          value={filterFacility}
          onChange={(e) => setFilterFacility(e.target.value)}
        >
          <option value="">Alle Anlagen</option>
          {facilities.filter(f => f.type !== 'cabin').map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div class="bl-count">{filtered.length} Buchung{filtered.length !== 1 ? 'en' : ''}</div>

      <div class="bl-cards">
        {filtered.map(b => (
          <div key={b.id} class="bl-card">
            <div
              class="bl-card-color"
              style={{ backgroundColor: teamColor(b.team, teams) }}
            />
            <div class="bl-card-body">
              <div class="bl-card-header">
                <strong>{b.team}</strong>
                <span class="bl-card-time">{b.startTime}–{b.endTime}</span>
              </div>
              <div class="bl-card-sub">
                {facilityName(b.facilityId)}
                {b.totalParts > 1 && ` (Teil ${b.parts.join(',')}/${b.totalParts})`}
              </div>
              <div class="bl-card-days">{formatDays(b.rrule)}</div>
              {b.rruleStart && (
                <div class="bl-card-period">{b.rruleStart} — {b.rruleEnd || 'offen'}</div>
              )}
              {b.notes && <div class="bl-card-notes">{b.notes}</div>}
            </div>
            <div class="bl-card-actions">
              <button class="btn-sm" onClick={() => onEdit(b)}>Bearbeiten</button>
              <button class="btn-sm btn-sm--danger" onClick={() => {
                if (confirm(`"${b.title}" wirklich löschen?`)) onDelete(b.id);
              }}>
                Löschen
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p class="bl-empty">Keine Buchungen gefunden.</p>
        )}
      </div>
    </div>
  );
}
