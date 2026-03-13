import { RRule } from 'rrule';

/**
 * Expandiert einen wiederkehrenden Termin für einen Datumsbereich.
 * Gibt ein Array von Date-Objekten zurück, an denen der Termin stattfindet.
 */
export function expandRecurrence(booking, rangeStart, rangeEnd) {
  if (!booking.rrule) {
    // Einmaliger Termin — prüfe ob rruleStart im Bereich liegt
    const d = new Date(booking.rruleStart + 'T00:00:00');
    if (d >= rangeStart && d <= rangeEnd) return [d];
    return [];
  }

  const rule = RRule.fromString(
    `DTSTART:${booking.rruleStart.replace(/-/g, '')}T000000Z\nRRULE:${booking.rrule}`
  );

  const until = booking.rruleEnd ? new Date(booking.rruleEnd + 'T23:59:59Z') : rangeEnd;
  const effectiveEnd = until < rangeEnd ? until : rangeEnd;

  const dates = rule.between(rangeStart, effectiveEnd, true);

  const exceptions = new Set(booking.exceptions || []);
  return dates.filter(d => {
    const iso = d.toISOString().slice(0, 10);
    return !exceptions.has(iso);
  });
}

/**
 * Prüft ob ein Termin an einem bestimmten Datum stattfindet.
 */
export function occursOnDate(booking, date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  return expandRecurrence(booking, dayStart, dayEnd).length > 0;
}
