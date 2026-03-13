import { teamColor } from '../models/teams.js';

export function MapOverlay({ facility, bookings, teams, onSelectBooking }) {
  const { mapCoords, color, name, maxParts } = facility;
  if (!mapCoords) return null;

  const { x, y, width, height } = mapCoords;
  const isCabin = facility.type === 'cabin';
  const hasBookings = bookings.length > 0;

  // Für Großfelder mit geteilten Buchungen: Teile visualisieren
  const hasSplitBooking = hasBookings && bookings.some(b => b.totalParts > 1);
  if (maxParts > 1 && hasSplitBooking) {
    return (
      <g>
        {/* Hintergrund-Rahmen */}
        <rect
          x={x} y={y} width={width} height={height}
          fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.8)" stroke-width="0.3" rx="0.5"
        />
        {renderParts(facility, bookings, teams, onSelectBooking)}
        <LabelWithShadow x={x + width / 2} y={y - 1} className="map-label">
          {name}
        </LabelWithShadow>
      </g>
    );
  }

  // Nicht teilbare Anlagen oder Großfeld ohne Buchung
  const fillColor = hasBookings ? teamColor(bookings[0].team, teams) : 'rgba(255,255,255,0.25)';
  const label = hasBookings ? bookings[0].team : 'frei';

  return (
    <g
      class="map-facility"
      onClick={() => hasBookings && onSelectBooking(bookings[0])}
      style={{ cursor: hasBookings ? 'pointer' : 'default' }}
    >
      <rect
        x={x} y={y} width={width} height={height}
        fill={fillColor}
        stroke={hasBookings ? 'rgba(255,255,255,0.9)' : color}
        stroke-width="0.4"
        rx={isCabin ? 0.5 : 1}
        opacity={hasBookings ? 0.75 : 0.5}
      />
      {!isCabin && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          text-anchor="middle"
          dominant-baseline="central"
          class="map-text"
        >
          {label}
        </text>
      )}
      {isCabin && hasBookings && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 0.8}
          text-anchor="middle"
          dominant-baseline="central"
          class="map-text-sm"
        >
          {bookings[0].team}
        </text>
      )}
      {!isCabin && (
        <LabelWithShadow x={x + width / 2} y={y - 1} className="map-label">
          {name}
        </LabelWithShadow>
      )}
      {isCabin && (
        <LabelWithShadow x={x + width / 2} y={y - 0.5} className="map-label-sm">
          {name}
        </LabelWithShadow>
      )}
    </g>
  );
}

/** Text mit Schatten — lesbar auf hellen und dunklen Hintergründen */
function LabelWithShadow({ x, y, className, children }) {
  return (
    <g>
      <text
        x={x} y={y}
        text-anchor="middle"
        class={className}
        stroke="rgba(0,0,0,0.6)" stroke-width="0.5"
        paint-order="stroke"
      >
        {children}
      </text>
    </g>
  );
}

/**
 * Part-Layout für Hälften (quer) und Quadranten (2x2):
 * - totalParts=2: Part 1 = obere Hälfte, Part 2 = untere Hälfte
 * - totalParts=4: Part 1 = oben-links, 2 = oben-rechts, 3 = unten-links, 4 = unten-rechts
 */
function getPartRect(part, totalParts, x, y, width, height) {
  if (totalParts === 2) {
    const halfH = height / 2;
    return part === 1
      ? { px: x, py: y, pw: width, ph: halfH }
      : { px: x, py: y + halfH, pw: width, ph: halfH };
  }
  // totalParts === 4: 2x2 Quadranten
  const halfW = width / 2;
  const halfH = height / 2;
  const col = (part - 1) % 2;
  const row = Math.floor((part - 1) / 2);
  return { px: x + col * halfW, py: y + row * halfH, pw: halfW, ph: halfH };
}

function renderParts(facility, bookings, teams, onSelectBooking) {
  const { mapCoords, maxParts } = facility;
  const { x, y, width, height } = mapCoords;
  const elements = [];

  // Finde die aktive Teilung aus den Buchungen
  const totalParts = bookings.length > 0 ? bookings[0].totalParts : maxParts;

  for (let i = 1; i <= totalParts; i++) {
    const booking = bookings.find(b => b.totalParts === totalParts && b.parts.includes(i));
    const { px, py, pw, ph } = getPartRect(i, totalParts, x, y, width, height);

    elements.push(
      <rect
        key={`${facility.id}-part-${i}`}
        x={px} y={py} width={pw} height={ph}
        fill={booking ? teamColor(booking.team, teams) : 'rgba(255,255,255,0.15)'}
        stroke="rgba(255,255,255,0.6)" stroke-width="0.2"
        opacity={booking ? 0.75 : 0.3}
        class="map-facility"
        onClick={() => booking && onSelectBooking(booking)}
        style={{ cursor: booking ? 'pointer' : 'default' }}
      />
    );

    if (booking) {
      elements.push(
        <text
          key={`${facility.id}-text-${i}`}
          x={px + pw / 2}
          y={py + ph / 2}
          text-anchor="middle"
          dominant-baseline="central"
          class="map-text-sm"
        >
          {booking.team}
        </text>
      );
    }
  }

  return elements;
}
