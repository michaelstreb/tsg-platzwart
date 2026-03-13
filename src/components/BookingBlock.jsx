import { teamColor } from '../models/teams.js';

export function BookingBlock({ booking, teams, style, onClick, compact }) {
  const color = teamColor(booking.team, teams);

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
        <span class="booking-block-time">{booking.startTime}–{booking.endTime}</span>
      )}
    </div>
  );
}
