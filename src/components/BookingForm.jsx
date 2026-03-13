import { useState, useMemo } from 'preact/hooks';
import { FieldPartPicker } from './FieldPartPicker.jsx';
import { hasConflict, hasCabinConflict } from '../models/booking.js';

const DAYS = [
  { code: 'MO', label: 'Mo' },
  { code: 'TU', label: 'Di' },
  { code: 'WE', label: 'Mi' },
  { code: 'TH', label: 'Do' },
  { code: 'FR', label: 'Fr' },
  { code: 'SA', label: 'Sa' },
  { code: 'SU', label: 'So' },
];

function generateId() {
  return 'b-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function BookingForm({ facilities, bookings, teams, editBooking, defaults, onSave, onClose }) {
  const teamNames = (teams || []).filter(t => t.active !== false).map(t => t.name);
  const isEdit = !!editBooking;

  const [facilityId, setFacilityId] = useState(editBooking?.facilityId || '');
  const [totalParts, setTotalParts] = useState(editBooking?.totalParts || 1);
  const [parts, setParts] = useState(editBooking?.parts || [1]);
  const [team, setTeam] = useState(editBooking?.team || '');
  const [customTeam, setCustomTeam] = useState('');
  const [title, setTitle] = useState(editBooking?.title || '');
  const [startTime, setStartTime] = useState(editBooking?.startTime || defaults?.startTime || '17:00');
  const [endTime, setEndTime] = useState(editBooking?.endTime || defaults?.endTime || '19:00');
  const [isRecurring, setIsRecurring] = useState(!!editBooking?.rrule);
  const [rruleDays, setRruleDays] = useState(() => {
    if (editBooking?.rrule) {
      const match = editBooking.rrule.match(/BYDAY=([A-Z,]+)/);
      return match ? match[1].split(',') : [];
    }
    return [];
  });
  const [rruleStart, setRruleStart] = useState(editBooking?.rruleStart || defaults?.date || new Date().toISOString().slice(0, 10));
  const [rruleEnd, setRruleEnd] = useState(editBooking?.rruleEnd || '');
  const [cabins, setCabins] = useState(editBooking?.cabins || []);
  const [cabinTeams, setCabinTeams] = useState(editBooking?.cabinTeams || {});
  const [notes, setNotes] = useState(editBooking?.notes || '');
  const [error, setError] = useState('');

  const fieldFacilities = facilities.filter(f => f.type !== 'cabin');
  const cabinFacilities = facilities.filter(f => f.type === 'cabin');
  const selectedFacility = facilities.find(f => f.id === facilityId);

  // Auto-fill title when team changes
  const effectiveTeam = team === 'Sonstige' ? customTeam : team;
  const effectiveTitle = title || (effectiveTeam ? `Training ${effectiveTeam}` : '');

  // Konfliktprüfung — berücksichtigt Wochentage und Zeiträume
  const conflicts = useMemo(() => {
    if (!facilityId || !startTime || !endTime) return [];

    const candidate = {
      id: editBooking?.id || '__new__',
      facilityId,
      parts,
      totalParts,
      startTime,
      endTime,
    };

    // Wochentage der neuen Buchung ermitteln
    const candidateDays = isRecurring ? new Set(rruleDays) : null;
    const candidateDate = !isRecurring ? rruleStart : null;

    return bookings.filter(b => {
      if (b.id === editBooking?.id) return false;
      if (!hasConflict(candidate, b)) return false;

      // Zeitraum-Überlappung prüfen
      const cStart = isRecurring ? rruleStart : rruleStart;
      const cEnd = isRecurring ? rruleEnd : rruleStart;
      const bStart = b.rruleStart || '';
      const bEnd = b.rruleEnd || '';
      if (cEnd && bStart && cEnd < bStart) return false;
      if (bEnd && cStart && cStart > bEnd) return false;

      // Wochentage prüfen
      if (b.rrule) {
        const bDayMatch = b.rrule.match(/BYDAY=([A-Z,]+)/);
        const bDays = bDayMatch ? new Set(bDayMatch[1].split(',')) : new Set();

        if (candidateDays) {
          // Beide wiederkehrend: mindestens ein gemeinsamer Tag?
          let overlap = false;
          for (const d of candidateDays) { if (bDays.has(d)) { overlap = true; break; } }
          if (!overlap) return false;
        } else {
          // Neue Buchung einmalig: fällt der Tag auf einen Wochentag der bestehenden?
          const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
          const dateDay = dayMap[new Date(candidateDate + 'T12:00:00').getDay()];
          if (!bDays.has(dateDay)) return false;
        }
      } else {
        // Bestehende Buchung einmalig
        if (candidateDays) {
          // Neue wiederkehrend, bestehende einmalig: fällt der Tag der bestehenden auf einen Wochentag der neuen?
          const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
          const dateDay = dayMap[new Date(b.rruleStart + 'T12:00:00').getDay()];
          if (!candidateDays.has(dateDay)) return false;
        } else {
          // Beide einmalig: gleiches Datum?
          if (candidateDate !== b.rruleStart) return false;
        }
      }

      return true;
    });
  }, [facilityId, parts, totalParts, startTime, endTime, isRecurring, rruleDays, rruleStart, rruleEnd, bookings, editBooking]);

  // Kabinenkonflikte — welche Kabinen sind zur gleichen Zeit schon belegt?
  const cabinConflicts = useMemo(() => {
    if (!cabins.length || !startTime || !endTime) return {};

    const candidate = {
      id: editBooking?.id || '__new__',
      cabins,
      startTime,
      endTime,
    };

    const candidateDays = isRecurring ? new Set(rruleDays) : null;
    const candidateDate = !isRecurring ? rruleStart : null;

    const conflictMap = {}; // cabinId -> [booking, ...]

    for (const b of bookings) {
      if (b.id === editBooking?.id) continue;
      if (!hasCabinConflict(candidate, b)) continue;

      // Zeitraum-Überlappung prüfen
      const cStart = rruleStart;
      const cEnd = isRecurring ? rruleEnd : rruleStart;
      const bStart = b.rruleStart || '';
      const bEnd = b.rruleEnd || '';
      if (cEnd && bStart && cEnd < bStart) continue;
      if (bEnd && cStart && cStart > bEnd) continue;

      // Wochentage prüfen
      if (b.rrule) {
        const bDayMatch = b.rrule.match(/BYDAY=([A-Z,]+)/);
        const bDays = bDayMatch ? new Set(bDayMatch[1].split(',')) : new Set();
        if (candidateDays) {
          let overlap = false;
          for (const d of candidateDays) { if (bDays.has(d)) { overlap = true; break; } }
          if (!overlap) continue;
        } else {
          const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
          const dateDay = dayMap[new Date(candidateDate + 'T12:00:00').getDay()];
          if (!bDays.has(dateDay)) continue;
        }
      } else {
        if (candidateDays) {
          const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
          const dateDay = dayMap[new Date(b.rruleStart + 'T12:00:00').getDay()];
          if (!candidateDays.has(dateDay)) continue;
        } else {
          if (candidateDate !== b.rruleStart) continue;
        }
      }

      // Gemeinsame Kabinen finden
      for (const cId of cabins) {
        if (b.cabins?.includes(cId)) {
          if (!conflictMap[cId]) conflictMap[cId] = [];
          conflictMap[cId].push(b);
        }
      }
    }
    return conflictMap;
  }, [cabins, startTime, endTime, isRecurring, rruleDays, rruleStart, rruleEnd, bookings, editBooking]);

  const toggleDay = (code) => {
    setRruleDays(prev =>
      prev.includes(code) ? prev.filter(d => d !== code) : [...prev, code]
    );
  };

  const toggleCabin = (id) => {
    setCabins(prev => {
      if (prev.includes(id)) {
        setCabinTeams(ct => {
          const next = { ...ct };
          delete next[id];
          return next;
        });
        return prev.filter(c => c !== id);
      }
      return [...prev, id];
    });
  };

  const setCabinTeam = (cabinId, teamName) => {
    setCabinTeams(prev => {
      if (!teamName) {
        const next = { ...prev };
        delete next[cabinId];
        return next;
      }
      return { ...prev, [cabinId]: teamName };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!facilityId) { setError('Bitte Anlage wählen.'); return; }
    if (!effectiveTeam) { setError('Bitte Team wählen.'); return; }
    if (!startTime || !endTime) { setError('Bitte Zeiten eingeben.'); return; }
    if (startTime >= endTime) { setError('Endzeit muss nach Startzeit liegen.'); return; }
    if (parts.length === 0) { setError('Bitte mindestens einen Feldteil wählen.'); return; }
    if (isRecurring && rruleDays.length === 0) { setError('Bitte mindestens einen Wochentag wählen.'); return; }
    if (isRecurring && !rruleStart) { setError('Bitte Startdatum angeben.'); return; }

    if (conflicts.length > 0) {
      const msg = conflicts.map(c => `${c.team} (${c.startTime}–${c.endTime})`).join(', ');
      if (!confirm(`Konflikt mit: ${msg}\nTrotzdem speichern?`)) return;
    }

    const booking = {
      id: editBooking?.id || generateId(),
      facilityId,
      parts,
      totalParts,
      team: effectiveTeam,
      title: effectiveTitle,
      startTime,
      endTime,
      rrule: isRecurring ? `FREQ=WEEKLY;BYDAY=${rruleDays.join(',')}` : '',
      rruleStart: isRecurring ? rruleStart : rruleStart,
      rruleEnd: isRecurring ? rruleEnd : '',
      exceptions: editBooking?.exceptions || [],
      cabins,
      cabinTeams: Object.keys(cabinTeams).length > 0 ? cabinTeams : undefined,
      notes,
      createdBy: editBooking?.createdBy || 'admin',
      createdAt: editBooking?.createdAt || new Date().toISOString(),
    };

    onSave(booking);
  };

  return (
    <div class="drawer-overlay" onClick={onClose}>
      <div class="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>{isEdit ? 'Buchung bearbeiten' : 'Neue Buchung'}</h2>
          <button class="btn-icon drawer-close" onClick={onClose}>&times;</button>
        </div>

        <form class="modal-body" onSubmit={handleSubmit}>
          {error && <div class="form-error">{error}</div>}

          {conflicts.length > 0 && (
            <div class="form-warning">
              Konflikt mit: {conflicts.map(c => `${c.team} (${c.startTime}–${c.endTime})`).join(', ')}
            </div>
          )}

          {/* Anlage */}
          <label class="form-field">
            <span class="form-label">Anlage</span>
            <select
              class="form-input"
              value={facilityId}
              onChange={(e) => {
                setFacilityId(e.target.value);
                const fac = facilities.find(f => f.id === e.target.value);
                if (fac) {
                  setTotalParts(1);
                  setParts([1]);
                }
              }}
            >
              <option value="">— Anlage wählen —</option>
              {fieldFacilities.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>

          {/* Feldteil-Picker */}
          {selectedFacility && selectedFacility.maxParts > 1 && (
            <FieldPartPicker
              maxParts={selectedFacility.maxParts}
              totalParts={totalParts}
              selectedParts={parts}
              onTotalPartsChange={setTotalParts}
              onPartsChange={setParts}
            />
          )}

          {/* Team */}
          <label class="form-field">
            <span class="form-label">Team</span>
            <select class="form-input" value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">— Team wählen —</option>
              {teamNames.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          {team === 'Sonstige' && (
            <label class="form-field">
              <span class="form-label">Teamname</span>
              <input
                class="form-input"
                type="text"
                value={customTeam}
                onInput={(e) => setCustomTeam(e.target.value)}
                placeholder="z.B. Bambini"
              />
            </label>
          )}

          {/* Titel */}
          <label class="form-field">
            <span class="form-label">Titel</span>
            <input
              class="form-input"
              type="text"
              value={title}
              onInput={(e) => setTitle(e.target.value)}
              placeholder={effectiveTeam ? `Training ${effectiveTeam}` : 'z.B. Training U15'}
            />
          </label>

          {/* Zeiten */}
          <div class="form-row">
            <label class="form-field">
              <span class="form-label">Von</span>
              <input
                class="form-input"
                type="time"
                value={startTime}
                onInput={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label class="form-field">
              <span class="form-label">Bis</span>
              <input
                class="form-input"
                type="time"
                value={endTime}
                onInput={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>

          {/* Wiederholung */}
          <label class="form-field form-checkbox">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <span>Wiederkehrender Termin</span>
          </label>

          {isRecurring && (
            <>
              <div class="form-field">
                <span class="form-label">Wochentage</span>
                <div class="day-picker">
                  {DAYS.map(d => (
                    <button
                      key={d.code}
                      type="button"
                      class={`day-btn ${rruleDays.includes(d.code) ? 'day-btn--active' : ''}`}
                      onClick={() => toggleDay(d.code)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div class="form-row">
                <label class="form-field">
                  <span class="form-label">Ab</span>
                  <input
                    class="form-input"
                    type="date"
                    value={rruleStart}
                    onInput={(e) => setRruleStart(e.target.value)}
                  />
                </label>
                <label class="form-field">
                  <span class="form-label">Bis</span>
                  <input
                    class="form-input"
                    type="date"
                    value={rruleEnd}
                    onInput={(e) => setRruleEnd(e.target.value)}
                  />
                </label>
              </div>
            </>
          )}

          {!isRecurring && (
            <label class="form-field">
              <span class="form-label">Datum</span>
              <input
                class="form-input"
                type="date"
                value={rruleStart}
                onInput={(e) => setRruleStart(e.target.value)}
              />
            </label>
          )}

          {/* Kabinen */}
          {cabinFacilities.length > 0 && (
            <div class="form-field">
              <span class="form-label">Kabinen</span>
              <div class="cabin-picker">
                {cabinFacilities.map(c => {
                  const cConflicts = cabinConflicts[c.id] || [];
                  const isSelected = cabins.includes(c.id);
                  const hasConflictFlag = isSelected && cConflicts.length > 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      class={`cabin-btn ${isSelected ? 'cabin-btn--active' : ''} ${hasConflictFlag ? 'cabin-btn--conflict' : ''}`}
                      onClick={() => toggleCabin(c.id)}
                      title={hasConflictFlag ? `Belegt von: ${cConflicts.map(b => b.team).join(', ')}` : ''}
                    >
                      {c.name}
                      {hasConflictFlag && ' ⚠'}
                    </button>
                  );
                })}
              </div>
              {/* Team-Zuweisung pro Kabine */}
              {cabins.length > 0 && (
                <div class="cabin-team-assignments">
                  {cabins.map(cabinId => {
                    const cabin = cabinFacilities.find(c => c.id === cabinId);
                    return (
                      <div key={cabinId} class="cabin-team-row">
                        <span class="cabin-team-label">{cabin?.name}:</span>
                        <input
                          class="form-input cabin-team-input"
                          type="text"
                          value={cabinTeams[cabinId] || ''}
                          onInput={(e) => setCabinTeam(cabinId, e.target.value)}
                          placeholder={effectiveTeam || 'Team'}
                        />
                      </div>
                    );
                  })}
                  <span class="cabin-team-hint">Leer = Hauptteam. Für Gegner o.ä. Team-Name eintragen.</span>
                </div>
              )}

              {Object.keys(cabinConflicts).some(id => cabins.includes(id)) && (
                <div class="form-warning" style={{ marginTop: '0.5rem' }}>
                  Kabinenkonflikt: {Object.entries(cabinConflicts)
                    .filter(([id]) => cabins.includes(id))
                    .map(([id, bs]) => {
                      const cabin = cabinFacilities.find(c => c.id === id);
                      return `${cabin?.name}: ${bs.map(b => `${b.team} (${b.startTime}–${b.endTime})`).join(', ')}`;
                    }).join(' | ')}
                </div>
              )}
            </div>
          )}

          {/* Notizen */}
          <label class="form-field">
            <span class="form-label">Notizen</span>
            <textarea
              class="form-input"
              rows="2"
              value={notes}
              onInput={(e) => setNotes(e.target.value)}
            />
          </label>

          <div class="form-actions">
            <button type="button" class="btn-secondary" onClick={onClose}>Abbrechen</button>
            <button type="submit" class="btn-primary">
              {isEdit ? 'Speichern' : 'Buchung anlegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
