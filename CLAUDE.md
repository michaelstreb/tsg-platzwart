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
- **Auth:** Admin-Login prüft Passwort client-seitig gegen SHA-256-Hash (aus `VITE_ADMIN_PASSWORD_HASH` env var, wird beim Build eingebettet)
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

- `src/config.js` — Zentrale Konfiguration (GitHub-Repo, Admin-Passwort-Hash)
- `src/api/webdav.js` — Lesen/Schreiben (trotz Name: GitHub API, nicht WebDAV)
- `src/api/auth.js` — Admin-Passwort-Verifizierung (SHA-256)
- `src/models/booking.js` — Konflikterkennung mit Quadranten-Normalisierung
- `src/models/teams.js` — Team-Datenmodell mit active-Flag und localStorage
- `src/components/BookingForm.jsx` — Komplexeste Komponente (Konflikte, Wochentage, Feldteile, Kabinen-Teams)
- `src/components/MapView.jsx` — Kartenansicht mit Auto-Update und "nächste Belegung"-Logik
- `src/components/TeamLegend.jsx` — Farblegende der aktiven Teams
- `public/facilities.json` — Anlagendefinitionen (wird vom Verein angepasst)
- `public/bookings.json` — Buchungsdaten (wird per GitHub API aktualisiert)

## Views

- **Dashboard** (`dashboard`) — Kombiniert Karte + Tagesagenda, ohne Filter/Slider (für öffentliche Displays)
- **Karte** (`map`) — SVG-Draufsicht mit Zeitschieber, Anlagen-/Team-Filter
- **Woche** (`week`) — Zeitraster mit farbigen Buchungsblöcken, Now-Line
- **Tag** (`day`) — Agenda-Layout mit Facility-Karten und Buchungsliste
- **Liste** (`list`) — Admin: Tabelle aller Buchungen
- **Teams** (`teams`) — Admin: Mannschaftsverwaltung

## Kabinen-Teams

Buchungen können Kabinen zuweisen (`cabins`-Array). Pro Kabine kann optional ein eigenes Team angegeben werden (`cabinTeams`-Objekt, z.B. `{ "kabine-1": "Gegner FC" }`). Fehlt der Eintrag, gilt das Hauptteam der Buchung.

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
