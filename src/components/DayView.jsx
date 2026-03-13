import { useMemo, useRef, useState, useEffect } from 'preact/hooks';
import { BookingBlock } from './BookingBlock.jsx';
import { expandRecurrence } from '../models/recurrence.js';
import { timeToMinutes } from '../models/booking.js';

const HOUR_START = 8;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

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
      nowLineRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
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

  // Gruppiere nach Anlage
  const byFacility = useMemo(() => {
    const map = new Map();
    for (const f of facilities) {
      map.set(f.id, { facility: f, bookings: [] });
    }
    for (const b of dayBookings) {
      const entry = map.get(b.facilityId);
      if (entry) entry.bookings.push(b);
    }
    return [...map.values()].filter(e => e.bookings.length > 0 || e.facility.type !== 'cabin');
  }, [facilities, dayBookings]);

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
      {byFacility.map(({ facility, bookings: fBookings }) => (
        <div key={facility.id} class="day-facility">
          <div class="day-facility-header" style={{ borderLeftColor: facility.color }}>
            {facility.name}
            {FACILITY_TYPE_LABELS[facility.type] && (
              <span class="day-facility-type">{FACILITY_TYPE_LABELS[facility.type]}</span>
            )}
          </div>
          <div class="day-facility-body">
            {/* Stundenlinien */}
            {HOURS.map(h => (
              <div key={h} class="day-hour-line" style={{ top: `${((h - HOUR_START) / (HOUR_END - HOUR_START)) * 100}%` }}>
                <span class="day-hour-label">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}

            {/* Now-Line */}
            {isToday && nowPercent >= 0 && nowPercent <= 100 && (
              <div
                ref={nowLineRef}
                class="day-now-line"
                style={{ top: `${nowPercent}%` }}
              />
            )}

            {/* Buchungsblöcke */}
            {fBookings.map(b => {
              const startMin = timeToMinutes(b.startTime) - HOUR_START * 60;
              const endMin = timeToMinutes(b.endTime) - HOUR_START * 60;
              const top = (startMin / totalMinutes) * 100;
              const height = ((endMin - startMin) / totalMinutes) * 100;

              return (
                <BookingBlock
                  key={b.id}
                  booking={b}
                  teams={teams}
                  facilities={facilities}
                  style={{ top: `${top}%`, height: `${height}%` }}
                  onClick={() => onSelectBooking(b)}
                  compact={false}
                />
              );
            })}

            {fBookings.length === 0 && (
              <div class="day-empty">Frei</div>
            )}
          </div>
        </div>
      ))}

      <p class="swipe-hint">&#x2190; Wischen für nächsten/vorherigen Tag &#x2192;</p>
    </div>
  );
}
