import { useMemo, useState, useEffect, useRef } from 'preact/hooks';
import { BookingBlock } from './BookingBlock.jsx';
import { expandRecurrence } from '../models/recurrence.js';
import { timeToMinutes, minutesToTime } from '../models/booking.js';

const HOUR_START = 8;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getWeekDays(date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    day.setHours(0, 0, 0, 0);
    return day;
  });
}

export function WeekView({ facilities, bookings, teams, selectedDate, onSelectBooking, admin, onCreateBooking }) {
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const [now, setNow] = useState(new Date());
  const nowLineRef = useRef(null);
  const scrolledRef = useRef(false);

  // Update now every 60s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to now-line on mount / date change
  useEffect(() => {
    scrolledRef.current = false;
  }, [selectedDate]);

  useEffect(() => {
    if (!scrolledRef.current && nowLineRef.current) {
      nowLineRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
      scrolledRef.current = true;
    }
  });

  const todayIndex = weekDays.findIndex(d => isSameDay(d, now));
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowPercent = ((nowMinutes - HOUR_START * 60) / ((HOUR_END - HOUR_START) * 60)) * 100;

  const weekBookings = useMemo(() => {
    const weekStart = weekDays[0];
    const weekEnd = new Date(weekDays[6]);
    weekEnd.setHours(23, 59, 59, 999);

    const result = [];
    for (const b of bookings) {
      const dates = expandRecurrence(b, weekStart, weekEnd);
      for (const date of dates) {
        result.push({ ...b, date: new Date(date) });
      }
    }
    return result;
  }, [bookings, weekDays]);

  const getBookingsForDay = (dayIndex) => {
    const day = weekDays[dayIndex];
    return weekBookings.filter(b => {
      const bDate = new Date(b.date);
      return bDate.getDate() === day.getDate() &&
             bDate.getMonth() === day.getMonth() &&
             bDate.getFullYear() === day.getFullYear();
    });
  };

  const totalMinutes = (HOUR_END - HOUR_START) * 60;

  const handleDayClick = (e, day) => {
    if (!admin || !onCreateBooking) return;
    // Nur reagieren wenn direkt auf den Body geklickt wurde (nicht auf einen Block)
    if (e.target !== e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const yPercent = (e.clientY - rect.top) / rect.height;
    const clickedMinutes = Math.round((yPercent * totalMinutes + HOUR_START * 60) / 15) * 15;
    const startTime = minutesToTime(Math.max(HOUR_START * 60, Math.min(clickedMinutes, (HOUR_END - 1) * 60)));
    const endMinutes = Math.min(clickedMinutes + 120, HOUR_END * 60);
    const endTime = minutesToTime(endMinutes);
    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

    onCreateBooking({ date: dateStr, startTime, endTime });
  };

  return (
    <div class="week-view">
      <div class="week-grid">
        {/* Zeitspalte */}
        <div class="week-time-col">
          <div class="week-header-cell" />
          {HOURS.map(h => (
            <div key={h} class="week-time-label" style={{ top: `${((h - HOUR_START) / (HOUR_END - HOUR_START)) * 100}%` }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Tagesspalten */}
        {weekDays.map((day, di) => {
          const dayBookings = getBookingsForDay(di);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={di} class={`week-day-col ${isToday ? 'week-day-col--today' : ''}`}>
              <div class="week-header-cell">
                <span class="week-day-name">{DAY_NAMES[di]}</span>
                <span class="week-day-date">{day.getDate()}.{day.getMonth() + 1}.</span>
              </div>
              <div
                class={`week-day-body ${admin ? 'week-day-body--admin' : ''}`}
                onClick={(e) => handleDayClick(e, day)}
              >
                {/* Stundenlinien */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    class="week-hour-line"
                    style={{ top: `${((h - HOUR_START) / (HOUR_END - HOUR_START)) * 100}%` }}
                  />
                ))}

                {/* Now-Line */}
                {di === todayIndex && nowPercent >= 0 && nowPercent <= 100 && (
                  <div
                    ref={nowLineRef}
                    class="week-now-line"
                    style={{ top: `${nowPercent}%` }}
                  />
                )}

                {/* Buchungsblöcke */}
                {dayBookings.map(b => {
                  const startMin = timeToMinutes(b.startTime) - HOUR_START * 60;
                  const endMin = timeToMinutes(b.endTime) - HOUR_START * 60;
                  const top = (startMin / totalMinutes) * 100;
                  const height = ((endMin - startMin) / totalMinutes) * 100;

                  return (
                    <BookingBlock
                      key={`${b.id}-${di}`}
                      booking={b}
                      teams={teams}
                      facilities={facilities}
                      style={{ top: `${top}%`, height: `${height}%` }}
                      onClick={() => onSelectBooking(b)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isSameDay(a, b) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}
