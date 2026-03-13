import { useState, useEffect, useCallback } from 'preact/hooks';
import { loadFacilities, loadBookings, saveBookings } from './api/webdav.js';
import { isAdmin, clearCredentials } from './api/auth.js';
import { loadTeams, saveTeams } from './models/teams.js';
import { Header } from './components/Header.jsx';
import { MapView } from './components/MapView.jsx';
import { WeekView } from './components/WeekView.jsx';
import { DayView } from './components/DayView.jsx';
import { BookingDetail } from './components/BookingDetail.jsx';
import { BookingForm } from './components/BookingForm.jsx';
import { BookingList } from './components/BookingList.jsx';
import { AdminLogin } from './components/AdminLogin.jsx';
import { FacilityFilter } from './components/FacilityFilter.jsx';
import { TeamManager } from './components/TeamManager.jsx';

export function App() {
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [teams, setTeams] = useState(() => loadTeams());
  const [view, setView] = useState('map');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [hiddenFacilities, setHiddenFacilities] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin state
  const [admin, setAdmin] = useState(() => isAdmin());
  const [showLogin, setShowLogin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [formDefaults, setFormDefaults] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [facData, bookData] = await Promise.all([
        loadFacilities(),
        loadBookings(),
      ]);
      setFacilities(facData.facilities);
      setBookings(bookData.bookings);

      try {
        localStorage.setItem('facilities_cache', JSON.stringify(facData));
        localStorage.setItem('bookings_cache', JSON.stringify(bookData));
        localStorage.setItem('cache_time', new Date().toISOString());
      } catch { /* ignore */ }
    } catch (err) {
      setError(err.message);
      try {
        const facCache = JSON.parse(localStorage.getItem('facilities_cache'));
        const bookCache = JSON.parse(localStorage.getItem('bookings_cache'));
        if (facCache && bookCache) {
          setFacilities(facCache.facilities);
          setBookings(bookCache.bookings);
          setError('Offline-Daten geladen (Stand: ' +
            new Date(localStorage.getItem('cache_time')).toLocaleString('de-DE') + ')');
        }
      } catch { /* no cache */ }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleFacility = (id) => {
    setHiddenFacilities(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLogin = () => {
    setAdmin(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    clearCredentials();
    setAdmin(false);
    setView(prev => (prev === 'list' || prev === 'teams') ? 'map' : prev);
  };

  const handleSaveBooking = async (booking) => {
    let updated;
    const existing = bookings.find(b => b.id === booking.id);
    if (existing) {
      updated = bookings.map(b => b.id === booking.id ? booking : b);
    } else {
      updated = [...bookings, booking];
    }

    try {
      await saveBookings({ bookings: updated });
    } catch (err) {
      setError(err.message);
      return;
    }

    setBookings(updated);
    setShowForm(false);
    setEditBooking(null);
  };

  const handleDeleteBooking = async (id) => {
    const updated = bookings.filter(b => b.id !== id);

    try {
      await saveBookings({ bookings: updated });
    } catch (err) {
      setError(err.message);
      return;
    }

    setBookings(updated);
  };

  const handleEditBooking = (booking) => {
    setEditBooking(booking);
    setShowForm(true);
  };

  const handleSaveTeams = (updatedTeams) => {
    saveTeams(updatedTeams);
    setTeams(updatedTeams);
  };

  const visibleFacilities = facilities.filter(f => !hiddenFacilities.has(f.id));

  if (loading) {
    return <div class="loading">Lade Platzwart...</div>;
  }

  return (
    <div class="app">
      <Header
        view={view}
        onViewChange={setView}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onRefresh={loadData}
        admin={admin}
        onAdminClick={() => admin ? handleLogout() : setShowLogin(true)}
        onNewBooking={() => { setEditBooking(null); setFormDefaults(null); setShowForm(true); }}
      />

      {view !== 'list' && view !== 'teams' && (
        <FacilityFilter
          facilities={facilities}
          hiddenFacilities={hiddenFacilities}
          onToggle={toggleFacility}
        />
      )}

      {error && <div class="error-banner">{error}</div>}

      <main class="main-content">
        {view === 'map' && (
          <MapView
            facilities={visibleFacilities}
            bookings={bookings}
            teams={teams}
            selectedDate={selectedDate}
            onSelectBooking={setSelectedBooking}
          />
        )}
        {view === 'week' && (
          <WeekView
            facilities={visibleFacilities}
            bookings={bookings}
            teams={teams}
            selectedDate={selectedDate}
            onSelectBooking={setSelectedBooking}
            onDateChange={setSelectedDate}
            admin={admin}
            onCreateBooking={(defaults) => { setFormDefaults(defaults); setEditBooking(null); setShowForm(true); }}
          />
        )}
        {view === 'day' && (
          <DayView
            facilities={visibleFacilities}
            bookings={bookings}
            teams={teams}
            selectedDate={selectedDate}
            onSelectBooking={setSelectedBooking}
            onDateChange={setSelectedDate}
          />
        )}
        {view === 'list' && admin && (
          <BookingList
            bookings={bookings}
            facilities={facilities}
            teams={teams}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
          />
        )}
        {view === 'teams' && admin && (
          <TeamManager
            teams={teams}
            onSave={handleSaveTeams}
          />
        )}
      </main>

      {selectedBooking && !showForm && (
        <BookingDetail
          booking={selectedBooking}
          facilities={facilities}
          onClose={() => setSelectedBooking(null)}
          admin={admin}
          onEdit={(b) => { setSelectedBooking(null); handleEditBooking(b); }}
          onDelete={(id) => { setSelectedBooking(null); handleDeleteBooking(id); }}
        />
      )}

      {showLogin && (
        <AdminLogin
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

      {showForm && admin && (
        <BookingForm
          facilities={facilities}
          bookings={bookings}
          teams={teams}
          editBooking={editBooking}
          onSave={handleSaveBooking}
          defaults={formDefaults}
          onClose={() => { setShowForm(false); setEditBooking(null); setFormDefaults(null); }}
        />
      )}
    </div>
  );
}
