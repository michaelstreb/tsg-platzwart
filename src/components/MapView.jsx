import { useState, useMemo, useEffect } from 'preact/hooks';
import { MapOverlay } from './MapOverlay.jsx';
import { TimeSlider } from './TimeSlider.jsx';
import { expandRecurrence } from '../models/recurrence.js';
import { isActiveAtTime, timeToMinutes } from '../models/booking.js';
import { teamColor } from '../models/teams.js';

export function MapView({ facilities, bookings, teams, selectedDate, onSelectBooking, hideSlider }) {
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [hasSatellite, setHasSatellite] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 100, h: 75 });

  // Auto-Update jede Minute wenn Slider versteckt (Dashboard-Modus)
  useEffect(() => {
    if (!hideSlider) return;
    const id = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(id);
  }, [hideSlider]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setHasSatellite(true);
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => setHasSatellite(false);
    img.src = `${import.meta.env.BASE_URL}satellite.jpg`;
  }, []);

  // Alle Buchungen des Tages (für "nächste Belegung")
  const dayBookings = useMemo(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    return bookings.filter(b => expandRecurrence(b, dayStart, dayEnd).length > 0);
  }, [bookings, selectedDate]);

  const activeBookings = useMemo(() => {
    return dayBookings.filter(b => isActiveAtTime(b, currentMinutes));
  }, [dayBookings, currentMinutes]);

  const bookingsByFacility = useMemo(() => {
    const map = {};
    for (const b of activeBookings) {
      if (!map[b.facilityId]) map[b.facilityId] = [];
      map[b.facilityId].push(b);
    }
    return map;
  }, [activeBookings]);

  // Nächste Belegung pro Anlage (nur für freie Plätze)
  const nextBookingByFacility = useMemo(() => {
    const map = {};
    for (const b of dayBookings) {
      const start = timeToMinutes(b.startTime);
      if (start > currentMinutes) {
        if (!map[b.facilityId] || start < timeToMinutes(map[b.facilityId].startTime)) {
          map[b.facilityId] = b;
        }
      }
    }
    return map;
  }, [dayBookings, currentMinutes]);

  // Kabinen von Plätzen trennen
  const fieldFacilities = facilities.filter(f => f.type !== 'cabin');
  const cabinFacilities = facilities.filter(f => f.type === 'cabin');

  // Kabinenbelegung: welche Buchung belegt welche Kabine?
  const cabinBookings = useMemo(() => {
    const map = {};
    for (const b of activeBookings) {
      for (const cabinId of (b.cabins || [])) {
        if (!map[cabinId]) map[cabinId] = [];
        map[cabinId].push(b);
      }
    }
    return map;
  }, [activeBookings]);

  // Nächste Kabinenbelegung (für freie Kabinen)
  const nextCabinBookings = useMemo(() => {
    const map = {};
    for (const b of dayBookings) {
      const start = timeToMinutes(b.startTime);
      if (start > currentMinutes) {
        for (const cabinId of (b.cabins || [])) {
          if (!map[cabinId] || start < timeToMinutes(map[cabinId].startTime)) {
            map[cabinId] = b;
          }
        }
      }
    }
    return map;
  }, [dayBookings, currentMinutes]);

  const aspect = imgSize.h / imgSize.w;
  const vbWidth = 100;
  const vbHeight = Math.round(vbWidth * aspect);

  return (
    <div class="map-view">
      {/* Satellitenbild / Kartenansicht */}
      <div class="map-container">
        <svg
          viewBox={`0 0 ${vbWidth} ${vbHeight}`}
          class="map-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {hasSatellite ? (
            <image
              href={`${import.meta.env.BASE_URL}satellite.jpg`}
              x="0" y="0"
              width={vbWidth} height={vbHeight}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <rect x="0" y="0" width={vbWidth} height={vbHeight} fill="#e8f5e9" rx="2" />
          )}

          {fieldFacilities.map(facility => (
            <MapOverlay
              key={facility.id}
              facility={facility}
              bookings={bookingsByFacility[facility.id] || []}
              nextBooking={nextBookingByFacility[facility.id] || null}
              teams={teams}
              onSelectBooking={onSelectBooking}
            />
          ))}
        </svg>
      </div>

      {/* Kabinen separat unter dem Bild */}
      {cabinFacilities.length > 0 && (
        <div class="cabin-strip">
          <span class="cabin-strip-title">Kabinen</span>
          <div class="cabin-strip-grid">
            {cabinFacilities.map(cabin => {
              const cBookings = cabinBookings[cabin.id] || [];
              const occupied = cBookings.length > 0;
              const team = occupied
                ? (cBookings[0].cabinTeams?.[cabin.id] || cBookings[0].team)
                : null;
              const color = team ? teamColor(team, teams) : null;
              const nextCabin = !occupied ? nextCabinBookings[cabin.id] : null;
              const nextCabinTeam = nextCabin
                ? (nextCabin.cabinTeams?.[cabin.id] || nextCabin.team)
                : null;

              return (
                <div
                  key={cabin.id}
                  class={`cabin-card ${occupied ? 'cabin-card--occupied' : ''}`}
                  style={occupied ? { borderColor: color, backgroundColor: color + '18' } : {}}
                  onClick={() => {
                    if (occupied) onSelectBooking(cBookings[0]);
                    else if (nextCabin) onSelectBooking(nextCabin);
                  }}
                >
                  <span class="cabin-card-name">{cabin.name}</span>
                  {occupied ? (
                    <span class="cabin-card-team" style={{ color }}>{team}</span>
                  ) : nextCabin ? (
                    <span class="cabin-card-next">ab {nextCabin.startTime} {nextCabinTeam}</span>
                  ) : (
                    <span class="cabin-card-free">frei</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hideSlider && (
        <TimeSlider
          value={currentMinutes}
          onChange={setCurrentMinutes}
        />
      )}

      {activeBookings.length === 0 && (
        <p class="map-empty">Keine Belegung um diese Uhrzeit</p>
      )}
    </div>
  );
}
