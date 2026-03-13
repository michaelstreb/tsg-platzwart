import { useMemo, useRef, useState, useEffect } from 'preact/hooks';
import { expandRecurrence } from '../models/recurrence.js';
import { timeToMinutes } from '../models/booking.js';
import { teamColor } from '../models/teams.js';

const HOUR_START = 8;
const HOUR_END = 22;

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

const PART_LABELS = {
  '1/2-1': '½ oben',
  '1/2-2': '½ unten',
  '1/4-1': 'Q1',
  '1/4-2': 'Q2',
  '1/4-3': 'Q3',
  '1/4-4': 'Q4',
};

function getPartLabel(b) {
  if (!b.totalParts || b.totalParts <= 1) return null;
  const key = `1/${b.totalParts}-${b.part}`;
  return PART_LABELS[key] || `${b.part}/${b.totalParts}`;
}

function getCabinLabel(b, facilities) {
  const cabins = b.cabins || [];
  if (cabins.length === 0) return null;
  return cabins.map(id => {
    const name = facilities?.find(f => f.id === id)?.name;
    if (!name) return null;
    const short = name;
    const assignedTeam = b.cabinTeams?.[id];
    return assignedTeam ? `${short} (${assignedTeam})` : short;
  }).filter(Boolean).join(', ');
}

export function DayView({ facilities, bookings, teams, selectedDate, onSelectBooking, onDateChange }) {
  const touchStartX = useRef(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const isToday = isSameDay(selectedDate, now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const dayBookings = useMemo(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    return bookings.filter(b => expandRecurrence(b, dayStart, dayEnd).length > 0);
  }, [bookings, selectedDate]);

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
    // Sort by start time
    for (const [, arr] of map) {
      arr.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    }
    return map;
  }, [displayFacilities, dayBookings]);

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

  // Prüfe ob Buchung gerade aktiv ist
  const isActive = (b) => {
    if (!isToday) return false;
    const start = timeToMinutes(b.startTime);
    const end = timeToMinutes(b.endTime);
    return nowMinutes >= start && nowMinutes < end;
  };

  return (
    <div
      class="day-view"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Aktuelle Uhrzeit */}
      {isToday && (
        <div class="day-now-banner">
          <span class="day-now-dot" />
          Jetzt: {nowTimeStr} Uhr
        </div>
      )}

      {displayFacilities.map(facility => {
        const fBookings = byFacility.get(facility.id) || [];
        const typeLabel = FACILITY_TYPE_LABELS[facility.type];

        return (
          <div key={facility.id} class="day-facility">
            <div class="day-facility-header" style={{ borderLeftColor: facility.color }}>
              <span class="day-facility-name">{facility.name}</span>
              {typeLabel && <span class="day-facility-type">{typeLabel}</span>}
              {fBookings.length === 0 && <span class="day-facility-free">Frei</span>}
            </div>

            {fBookings.length > 0 && (
              <div class="day-booking-list">
                {fBookings.map(b => {
                  const color = teamColor(b.team, teams);
                  const partLabel = getPartLabel(b);
                  const cabinLabel = getCabinLabel(b, facilities);
                  const active = isActive(b);

                  return (
                    <div
                      key={b.id}
                      class={`day-booking-card ${active ? 'day-booking-card--active' : ''}`}
                      style={{ '--booking-color': color }}
                      onClick={() => onSelectBooking(b)}
                    >
                      <div class="day-booking-color" style={{ backgroundColor: color }} />
                      <div class="day-booking-time">
                        <span class="day-booking-start">{b.startTime}</span>
                        <span class="day-booking-sep">–</span>
                        <span class="day-booking-end">{b.endTime}</span>
                      </div>
                      <div class="day-booking-info">
                        <div class="day-booking-main">
                          <span class="day-booking-team">{b.team}</span>
                          {b.rrule && <span class="day-booking-repeat">&#x21bb;</span>}
                        </div>
                        {b.title && b.title !== b.team && (
                          <div class="day-booking-title">{b.title}</div>
                        )}
                        {(partLabel || cabinLabel) && (
                          <div class="day-booking-details">
                            {partLabel && <span class="day-booking-badge">{partLabel}</span>}
                            {cabinLabel && <span class="day-booking-badge">{cabinLabel}</span>}
                          </div>
                        )}
                        {b.notes && (
                          <div class="day-booking-notes">{b.notes}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <p class="swipe-hint">&#x2190; Wischen für nächsten/vorherigen Tag &#x2192;</p>
    </div>
  );
}
