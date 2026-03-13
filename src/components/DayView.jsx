import { useMemo, useRef, useState, useEffect } from 'preact/hooks';
import { expandRecurrence } from '../models/recurrence.js';
import { timeToMinutes } from '../models/booking.js';
import { teamColor } from '../models/teams.js';

const HOUR_START = 8;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

function isSameDay(a, b) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

const FACILITY_TYPE_LABELS = {
  grass: 'Rasen',
  allweather: 'Kunstrasen',
  hall: 'Halle',
};

export function DayView({ facilities, bookings, teams, selectedDate, onSelectBooking, onDateChange }) {
  const touchStartX = useRef(null);
  const [now, setNow] = useState(new Date());
  const nowLineRef = useRef(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    scrolledRef.current = false;
  }, [selectedDate]);

  useEffect(() => {
    if (!scrolledRef.current && nowLineRef.current) {
      nowLineRef.current.scrollIntoView({ inline: 'center', behavior: 'smooth' });
      scrolledRef.current = true;
    }
  });

  const isToday = isSameDay(selectedDate, now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowPercent = ((nowMinutes - HOUR_START * 60) / ((HOUR_END - HOUR_START) * 60)) * 100;

  const dayBookings = useMemo(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    return bookings.filter(b => expandRecurrence(b, dayStart, dayEnd).length > 0);
  }, [bookings, selectedDate]);

  // Nur Nicht-Kabinen-Anlagen anzeigen (Kabinen werden als Badges auf den Buchungen gezeigt)
  const displayFacilities = useMemo(() => {
    return facilities.filter(f => f.type !== 'cabin');
  }, [facilities]);

  const byFacility = useMemo(() => {
    const map = new Map();
    for (const f of displayFacilities) {
      map.set(f.id, []);
    }
    for (const b of dayBookings) {
      const arr = map.get(b.facilityId);
      if (arr) arr.push(b);
    }
    return map;
  }, [displayFacilities, dayBookings]);

  const totalMinutes = (HOUR_END - HOUR_START) * 60;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + (diff < 0 ? 1 : -1));
      onDateChange(d);
    }
    touchStartX.current = null;
  };

  return (
    <div
      class="day-view"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div class="day-grid">
        {/* Header-Zeile mit Stunden */}
        <div class="day-grid-corner" />
        <div class="day-grid-timeline">
          {HOURS.map(h => (
            <div
              key={h}
              class="day-grid-hour-label"
              style={{ left: `${((h - HOUR_START) / (HOUR_END - HOUR_START)) * 100}%` }}
            >
              {String(h).padStart(2, '0')}
            </div>
          ))}

          {/* Now-Line im Header */}
          {isToday && nowPercent >= 0 && nowPercent <= 100 && (
            <div
              class="day-grid-now-marker"
              style={{ left: `${nowPercent}%` }}
            />
          )}
        </div>

        {/* Anlagen-Zeilen */}
        {displayFacilities.map(facility => {
          const fBookings = byFacility.get(facility.id) || [];
          const typeLabel = FACILITY_TYPE_LABELS[facility.type];

          return (
            <Fragment key={facility.id}>
              <div class="day-grid-label" style={{ borderLeftColor: facility.color }}>
                <span class="day-grid-label-name">{facility.name}</span>
                {typeLabel && <span class="day-grid-label-type">{typeLabel}</span>}
              </div>
              <div class="day-grid-row">
                {/* Stundenlinien */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    class="day-grid-vline"
                    style={{ left: `${((h - HOUR_START) / (HOUR_END - HOUR_START)) * 100}%` }}
                  />
                ))}

                {/* Now-Line */}
                {isToday && nowPercent >= 0 && nowPercent <= 100 && (
                  <div
                    ref={nowLineRef}
                    class="day-grid-now-line"
                    style={{ left: `${nowPercent}%` }}
                  />
                )}

                {/* Buchungsblöcke */}
                {fBookings.map(b => {
                  const startMin = timeToMinutes(b.startTime) - HOUR_START * 60;
                  const endMin = timeToMinutes(b.endTime) - HOUR_START * 60;
                  const left = (startMin / totalMinutes) * 100;
                  const width = ((endMin - startMin) / totalMinutes) * 100;
                  const color = teamColor(b.team, teams);

                  return (
                    <div
                      key={b.id}
                      class="day-grid-block"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: color,
                      }}
                      onClick={() => onSelectBooking(b)}
                      title={`${b.title} (${b.startTime}–${b.endTime})`}
                    >
                      <span class="day-grid-block-team">{b.team}</span>
                      {b.title && b.title !== b.team && (
                        <span class="day-grid-block-title">{b.title}</span>
                      )}
                      <span class="day-grid-block-time">{b.startTime}–{b.endTime}</span>
                    </div>
                  );
                })}

                {fBookings.length === 0 && (
                  <span class="day-grid-empty">Frei</span>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>

      <p class="swipe-hint">&#x2190; Wischen für nächsten/vorherigen Tag &#x2192;</p>
    </div>
  );
}

// Preact Fragment
function Fragment({ children }) {
  return children;
}
