import { CONFIG } from '../config.js';

let githubSha = null;

// --- Local ---

async function fetchLocal(filename) {
  const resp = await fetch(`${import.meta.env.BASE_URL}${filename}`);
  if (!resp.ok) throw new Error(`Failed to load ${filename}`);
  return resp.json();
}

// --- GitHub ---

async function fetchGitHub() {
  const url = `https://api.github.com/repos/${CONFIG.githubRepo}/contents/${CONFIG.githubPath}?ref=${CONFIG.githubBranch}`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (CONFIG.githubToken) {
    headers['Authorization'] = `Bearer ${CONFIG.githubToken}`;
  }
  const resp = await fetch(url, { headers });
  if (!resp.ok) return null;
  const json = await resp.json();
  githubSha = json.sha;
  const content = decodeURIComponent(escape(atob(json.content)));
  return JSON.parse(content);
}

async function putGitHub(data) {
  if (!CONFIG.githubToken) throw new Error('GitHub-Token nicht konfiguriert.');

  // SHA holen falls noch nicht vorhanden
  if (!githubSha) {
    await fetchGitHub();
  }

  const url = `https://api.github.com/repos/${CONFIG.githubRepo}/contents/${CONFIG.githubPath}`;
  const body = {
    message: 'Platzwart: Buchung aktualisiert',
    content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
    branch: CONFIG.githubBranch,
  };

  if (githubSha) {
    body.sha = githubSha;
  }

  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CONFIG.githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 409 || resp.status === 422) {
    throw new Error('Konflikt: Die Daten wurden zwischenzeitlich geändert. Bitte neu laden.');
  }
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Speichern fehlgeschlagen: ${err.message || resp.status}`);
  }

  const result = await resp.json();
  githubSha = result.content.sha;
}

// --- Public API ---

export async function loadFacilities() {
  return fetchLocal('facilities.json');
}

export async function loadBookings() {
  if (CONFIG.storage === 'local') {
    try {
      const cached = localStorage.getItem('bookings_local');
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
  }
  if (CONFIG.storage === 'github') {
    const data = await fetchGitHub();
    if (data) return data;
  }
  return fetchLocal('bookings.json');
}

export async function saveBookings(data) {
  if (CONFIG.storage === 'local') {
    localStorage.setItem('bookings_local', JSON.stringify(data));
    return;
  }
  if (CONFIG.storage === 'github') {
    return putGitHub(data);
  }
}
