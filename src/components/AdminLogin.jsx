import { useState } from 'preact/hooks';
import { setCredentials, verifyPassword } from '../api/auth.js';

export function AdminLogin({ onLogin, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Bitte Passwort eingeben.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyPassword(password);
      setCredentials({ admin: true });
      onLogin();
    } catch {
      setError('Falsches Passwort.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="drawer-overlay" onClick={onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Admin-Anmeldung</h2>
          <button class="btn-icon drawer-close" onClick={onClose}>&times;</button>
        </div>
        <form class="modal-body" onSubmit={handleSubmit}>
          {error && <div class="form-error">{error}</div>}

          <label class="form-field">
            <span class="form-label">Passwort</span>
            <input
              type="password"
              value={password}
              onInput={(e) => setPassword(e.target.value)}
              autocomplete="current-password"
              class="form-input"
            />
          </label>

          <button type="submit" class="btn-primary" disabled={loading}>
            {loading ? 'Prüfe...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
