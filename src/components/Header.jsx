export function Header({ view, onViewChange, selectedDate, onDateChange, onRefresh, admin, onAdminClick, onNewBooking }) {
  const formatDate = (d) => d.toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  const changeDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    onDateChange(d);
  };

  const changeWeek = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta * 7);
    onDateChange(d);
  };

  const goToday = () => onDateChange(new Date());

  return (
    <header class="header">
      <div class="header-top">
        <div class="header-brand">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" class="header-logo" onError={(e) => e.target.style.display = 'none'} />
          <h1 class="header-title">Platzwart</h1>
        </div>
        <div class="header-actions">
          {admin && (
            <button class="btn-icon" onClick={onNewBooking} title="Neue Buchung">+</button>
          )}
          <button class="btn-icon" onClick={onRefresh} title="Aktualisieren">&#x21bb;</button>
          <button
            class={`btn-admin ${admin ? 'btn-admin--active' : ''}`}
            onClick={onAdminClick}
            title={admin ? 'Abmelden' : 'Admin-Login'}
          >
            {admin ? 'Abmelden' : 'Admin'}
          </button>
        </div>
      </div>

      <nav class="view-tabs">
        <button
          class={`tab ${view === 'dashboard' ? 'tab--active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          Dashboard
        </button>
        <button
          class={`tab ${view === 'map' ? 'tab--active' : ''}`}
          onClick={() => onViewChange('map')}
        >
          Karte
        </button>
        <button
          class={`tab ${view === 'week' ? 'tab--active' : ''}`}
          onClick={() => onViewChange('week')}
        >
          Woche
        </button>
        <button
          class={`tab ${view === 'day' ? 'tab--active' : ''}`}
          onClick={() => onViewChange('day')}
        >
          Tag
        </button>
        {admin && (
          <button
            class={`tab ${view === 'list' ? 'tab--active' : ''}`}
            onClick={() => onViewChange('list')}
          >
            Liste
          </button>
        )}
        {admin && (
          <button
            class={`tab ${view === 'teams' ? 'tab--active' : ''}`}
            onClick={() => onViewChange('teams')}
          >
            Teams
          </button>
        )}
      </nav>

      {view !== 'list' && (
        <div class="date-nav">
          {view === 'week' && (
            <button class="btn-icon" onClick={() => changeWeek(-1)} title="Vorherige Woche">&laquo;</button>
          )}
          <button class="btn-icon" onClick={() => changeDay(-1)} title="Vorheriger Tag">&lsaquo;</button>
          <button class="btn-today" onClick={goToday}>Heute</button>
          <span class="date-display">{formatDate(selectedDate)}</span>
          <button class="btn-icon" onClick={() => changeDay(1)} title="Nächster Tag">&rsaquo;</button>
          {view === 'week' && (
            <button class="btn-icon" onClick={() => changeWeek(1)} title="Nächste Woche">&raquo;</button>
          )}
        </div>
      )}
    </header>
  );
}
