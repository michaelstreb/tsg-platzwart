import { CONFIG } from '../config.js';

const AUTH_KEY = 'belegung_auth';

export function getCredentials() {
  const raw = sessionStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCredentials(creds) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(creds));
}

export function clearCredentials() {
  sessionStorage.removeItem(AUTH_KEY);
}

export function isAdmin() {
  return getCredentials() !== null;
}

/**
 * Prüft Nextcloud-Zugangsdaten über den OCS-API-Endpoint.
 * Wirft einen Fehler wenn die Anmeldung fehlschlägt.
 */
export async function verifyNextcloudLogin(username, password) {
  const url = `${CONFIG.nextcloudUrl}/ocs/v1.php/cloud/user?format=json`;
  const resp = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${username}:${password}`),
      'OCS-APIRequest': 'true',
    },
  });

  if (!resp.ok) {
    throw new Error('Anmeldung fehlgeschlagen.');
  }

  const data = await resp.json();
  if (data.ocs?.meta?.statuscode !== 100) {
    throw new Error('Anmeldung fehlgeschlagen.');
  }

  return data.ocs.data;
}
