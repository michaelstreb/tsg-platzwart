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
 * Hasht einen String mit SHA-256 und gibt den Hex-String zurück.
 */
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Prüft das Admin-Passwort gegen den gespeicherten Hash.
 * Wirft einen Fehler wenn das Passwort nicht stimmt.
 */
export async function verifyPassword(password) {
  if (!CONFIG.adminPasswordHash) {
    throw new Error('Kein Admin-Passwort konfiguriert.');
  }

  const hash = await sha256(password);
  if (hash !== CONFIG.adminPasswordHash.toLowerCase()) {
    throw new Error('Falsches Passwort.');
  }
}
