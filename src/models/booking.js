/**
 * Prüft ob zwei Zeitbereiche überlappen.
 */
function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/**
 * Konvertiert "HH:MM" zu Minuten seit Mitternacht.
 */
export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Konvertiert Minuten seit Mitternacht zu "HH:MM".
 */
export function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Ermittelt welche Feldbereiche (normalisiert auf Quadranten 1-4) belegt sind.
 * - totalParts=1 (Ganz): belegt alle 4 Quadranten
 * - totalParts=2 (Hälften): Hälfte 1 = Quadrant 1,2 / Hälfte 2 = Quadrant 3,4
 * - totalParts=4 (Quadranten): direkt 1:1
 */
function toQuadrants(parts, totalParts) {
  if (totalParts === 1) return new Set([1, 2, 3, 4]);
  if (totalParts === 2) {
    const q = new Set();
    for (const p of parts) {
      if (p === 1) { q.add(1); q.add(2); }
      if (p === 2) { q.add(3); q.add(4); }
    }
    return q;
  }
  return new Set(parts);
}

/**
 * Prüft ob zwei Buchungen auf derselben Anlage und zur selben Zeit in Konflikt stehen.
 * Normalisiert beide auf Quadranten und prüft Überlappung.
 */
export function hasConflict(a, b) {
  if (a.facilityId !== b.facilityId) return false;
  if (a.id === b.id) return false;

  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);

  if (!timesOverlap(aStart, aEnd, bStart, bEnd)) return false;

  const qA = toQuadrants(a.parts, a.totalParts);
  const qB = toQuadrants(b.parts, b.totalParts);

  for (const q of qB) {
    if (qA.has(q)) return true;
  }
  return false;
}

/**
 * Prüft ob eine Buchung zu einer bestimmten Uhrzeit (Minuten) aktiv ist.
 */
export function isActiveAtTime(booking, minutes) {
  const start = timeToMinutes(booking.startTime);
  const end = timeToMinutes(booking.endTime);
  return minutes >= start && minutes < end;
}
