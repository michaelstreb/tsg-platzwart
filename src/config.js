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

  // --- Nextcloud (Admin-Authentifizierung) ---
  // Nextcloud Base-URL, z.B. 'https://cloud.meinverein.de'
  nextcloudUrl: 'https://nx.fussball.tsg08-roth.de',
};
