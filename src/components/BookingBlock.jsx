import { teamColor } from '../models/teams.js';

export function BookingBlock({ booking, teams, facilities, style, onClick, compact }) {
  const color = teamColor(booking.team, teams);
  const facility = facilities?.find(f => f.id === booking.facilityId);
  const cabinNames = (booking.cabins || [])
    .map(id => facilities?.find(f => f.id === id)?.name)
    .filter(Boolean);

  return (
    <div
      class={`booking-block ${compact ? 'booking-block--compact' : ''}`}
      style={{
        ...style,
        backgroundColor: color,
      }}
      onClick={onClick}
      title={`${booking.title} (${booking.startTime}–${booking.endTime})`}
    >
      <span class="booking-block-team">{booking.team}</span>
      {!compact && (
        <>
          <span class="booking-block-time">{booking.startTime}–{booking.endTime}</span>
          {facility && <span class="booking-block-facility">{facility.name}</span>}
          {cabinNames.length > 0 && <span class="booking-block-cabins">{cabinNames.join(', ')}</span>}
        </>
      )}
    </div>
  );
}
