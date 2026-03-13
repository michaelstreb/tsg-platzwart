import { teamColor } from '../models/teams.js';

const PART_LABELS = {
  '1/2-1': '½ oben',
  '1/2-2': '½ unten',
  '1/4-1': 'Q1',
  '1/4-2': 'Q2',
  '1/4-3': 'Q3',
  '1/4-4': 'Q4',
};

function getPartLabel(booking) {
  if (!booking.totalParts || booking.totalParts <= 1) return null;
  const key = `1/${booking.totalParts}-${booking.part}`;
  return PART_LABELS[key] || `${booking.part}/${booking.totalParts}`;
}

export function BookingBlock({ booking, teams, facilities, style, onClick, compact }) {
  const color = teamColor(booking.team, teams);
  const facility = facilities?.find(f => f.id === booking.facilityId);
  const partLabel = getPartLabel(booking);

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
      {booking.rrule && <span class="booking-block-repeat">&#x21bb;</span>}
      <span class="booking-block-team">{booking.team}</span>
      {!compact && (
        <>
          {booking.title && booking.title !== booking.team && (
            <span class="booking-block-title">{booking.title}</span>
          )}
          <span class="booking-block-time">{booking.startTime}–{booking.endTime}</span>
          {facility && <span class="booking-block-facility">{facility.name}</span>}
          {partLabel && <span class="booking-block-parts">{partLabel}</span>}
        </>
      )}
    </div>
  );
}
