export function BookingDetail({ booking, facilities, onClose, admin, onEdit, onDelete }) {
  const facility = facilities.find(f => f.id === booking.facilityId);
  const cabinNames = (booking.cabins || [])
    .map(id => facilities.find(f => f.id === id)?.name)
    .filter(Boolean);

  const partsLabel = booking.totalParts > 1
    ? `Teil ${booking.parts.join(', ')} von ${booking.totalParts}`
    : 'Ganzes Feld';

  const rruleLabel = booking.rrule
    ? formatRRule(booking.rrule)
    : 'Einmalig';

  const handleDelete = () => {
    if (confirm(`"${booking.title}" wirklich löschen?`)) {
      onDelete(booking.id);
    }
  };

  return (
    <div class="drawer-overlay" onClick={onClose}>
      <div class="drawer" onClick={(e) => e.stopPropagation()}>
        <div class="drawer-header">
          <h2>{booking.title}</h2>
          <button class="btn-icon drawer-close" onClick={onClose}>&times;</button>
        </div>
        <div class="drawer-body">
          <dl class="detail-list">
            <dt>Team</dt>
            <dd>{booking.team}</dd>

            <dt>Anlage</dt>
            <dd>{facility?.name || booking.facilityId}</dd>

            <dt>Belegung</dt>
            <dd>{partsLabel}</dd>

            <dt>Zeit</dt>
            <dd>{booking.startTime} – {booking.endTime}</dd>

            <dt>Wiederholung</dt>
            <dd>{rruleLabel}</dd>

            {booking.rruleStart && (
              <>
                <dt>Zeitraum</dt>
                <dd>{booking.rruleStart} bis {booking.rruleEnd || '–'}</dd>
              </>
            )}

            {booking.exceptions?.length > 0 && (
              <>
                <dt>Ausnahmen</dt>
                <dd>{booking.exceptions.join(', ')}</dd>
              </>
            )}

            {cabinNames.length > 0 && (
              <>
                <dt>Kabinen</dt>
                <dd>{cabinNames.join(', ')}</dd>
              </>
            )}

            {booking.notes && (
              <>
                <dt>Hinweis</dt>
                <dd>{booking.notes}</dd>
              </>
            )}
          </dl>

          {admin && (
            <div class="detail-actions">
              <button class="btn-primary" onClick={() => onEdit(booking)}>
                Bearbeiten
              </button>
              <button class="btn-sm btn-sm--danger" onClick={handleDelete}>
                Löschen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRRule(rrule) {
  const dayMap = { MO: 'Mo', TU: 'Di', WE: 'Mi', TH: 'Do', FR: 'Fr', SA: 'Sa', SU: 'So' };
  const match = rrule.match(/BYDAY=([A-Z,]+)/);
  if (match) {
    const days = match[1].split(',').map(d => dayMap[d] || d).join(', ');
    if (rrule.includes('WEEKLY')) return `Wöchentlich: ${days}`;
  }
  if (rrule.includes('DAILY')) return 'Täglich';
  if (rrule.includes('WEEKLY')) return 'Wöchentlich';
  return rrule;
}
