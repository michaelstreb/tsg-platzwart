export const CONFIG = {
  // Storage-Modus: 'local' | 'github'
  storage: 'github',

  // --- GitHub (Datenspeicherung) ---
  // Repository im Format 'owner/repo'
  githubRepo: 'michaelstreb/tsg-platzwart',
  // Pfad zur bookings.json im Repo
  githubPath: 'public/bookings.json',
  // Branch
  githubBranch: 'main',
  // Fine-grained PAT mit contents:write (wird beim Build eingesetzt)
  githubToken: import.meta.env.VITE_GITHUB_TOKEN || '',

  // --- Admin-Authentifizierung ---
  // SHA-256-Hash des Admin-Passworts (wird beim Build eingesetzt)
  adminPasswordHash: import.meta.env.VITE_ADMIN_PASSWORD_HASH || '',
};
