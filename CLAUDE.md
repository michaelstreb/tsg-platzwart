# CLAUDE.md

## Projekt

Platzwart — Webapp zur Platzbelegung für Fußballvereine.
Preact + Vite SPA, gehostet auf GitHub Pages, Daten in `public/bookings.json` (per GitHub Contents API geschrieben).

## Tech Stack

- **Frontend:** Preact 10.x + Vite 6.x (JSX, kein TypeScript)
- **Styling:** Plain CSS mit CSS-Variablen (kein Framework)
- **Daten:** JSON-Dateien, kein Backend/Datenbank
- **Recurrence:** RRule.js (iCal RFC 5545)
- **Build:** `npm run build` → `dist/`
- **Deploy:** GitHub Actions → GitHub Pages

## Architektur

- **Lesen:** App lädt `bookings.json` und `facilities.json` direkt per fetch (statisch von GitHub Pages)
- **Schreiben:** GitHub Contents API mit PAT (Token aus `VITE_GITHUB_TOKEN` env var, wird beim Build eingebettet)
- **Auth:** Admin-Login prüft Credentials gegen Nextcloud OCS API — nur zur Zugangs-Kontrolle, nicht für Datenzugriff
- **Teams:** In `localStorage` gespeichert (`belegung_teams`), nicht serverseitig

## Konventionen

- Deutsche UI-Texte und Variablennamen in Kommentaren
- Englische Variablen-/Funktionsnamen im Code
- Komponenten als benannte Exports (`export function ComponentName`)
- CSS-Klassen: BEM-artig mit Prefix pro Komponente (z.B. `tm-` für TeamManager, `bl-` für BookingList, `fpp-` für FieldPartPicker)
- Farben über CSS-Variablen: `--color-primary` (#268a43), `--color-accent` (#bc141c)
- Kein TypeScript, keine Tests, kein Linter konfiguriert
- Auto-Save bevorzugen (kein manueller Speichern-Button)

## Wichtige Dateien

- `src/config.js` — Zentrale Konfiguration (GitHub-Repo, Nextcloud-URL)
- `src/api/webdav.js` — Lesen/Schreiben (trotz Name: GitHub API, nicht WebDAV)
- `src/api/auth.js` — Nextcloud-Login-Verifizierung
- `src/models/booking.js` — Konflikterkennung mit Quadranten-Normalisierung
- `src/models/teams.js` — Team-Datenmodell mit active-Flag und localStorage
- `src/components/BookingForm.jsx` — Komplexeste Komponente (Konflikte, Wochentage, Feldteile)
- `public/facilities.json` — Anlagendefinitionen (wird vom Verein angepasst)
- `public/bookings.json` — Buchungsdaten (wird per GitHub API aktualisiert)

## Feldteilung

Plätze werden **quer** geteilt (nicht längs):
- `totalParts=1`: Ganzes Feld
- `totalParts=2`: Hälften (oben/unten)
- `totalParts=4`: Quadranten (2x2)

Konflikterkennung normalisiert alle Teilungen auf Quadranten:
- Hälfte 1 (oben) = Quadrant 1 + 2
- Hälfte 2 (unten) = Quadrant 3 + 4

## Build & Test

```bash
npm run dev       # Entwicklungsserver
npm run build     # Produktions-Build (prüft auf Fehler)
npm run preview   # Build lokal testen
```

Kein Test-Framework vorhanden — Build-Erfolg ist der Hauptindikator.
