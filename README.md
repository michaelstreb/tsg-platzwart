# Platzwart

Mobilfreundliche Webanwendung zur Platzbelegung für Fußballvereine. Trainer sehen die aktuelle Platzbelegung auf dem Smartphone, Admins können Buchungen verwalten.

## Features

- **Dashboard** — Kombinierte Karte + Tagesagenda für öffentliche Displays (Tablet an der Wand, Vereinswebsite)
- **Kartenansicht** — SVG-Draufsicht der Sportanlage mit Echtzeit-Belegung, Zeitschieber und "nächste Belegung"-Anzeige für freie Plätze
- **Wochenansicht** — Zeitraster mit farbigen Buchungsblöcken, Titel, Feldteile, Wiederholungs-Indikator und Now-Line (Desktop-optimiert)
- **Tagesansicht** — Agenda-Layout mit Facility-Karten, aktive Buchungen hervorgehoben, Swipe-Navigation (Mobile-optimiert)
- **Team-Farblegende** — Automatische Anzeige der aktiven Teams mit Farbpunkten
- **Anlagentyp-Labels** — Rasen/Kunstrasen/Halle in Filtern und Tagesansicht
- **Wiederkehrende Termine** — Serienbuchungen nach iCal-Standard (z.B. "jeden Di + Do")
- **Feldteilung** — Plätze in Hälften (quer) oder Quadranten (2x2) aufteilen
- **Konflikterkennung** — Automatische Warnung bei Überlappungen (berücksichtigt Wochentage, Zeiträume und Feldteile)
- **Mannschaftsverwaltung** — Teams mit Farben, aktivierbar/deaktivierbar
- **Kabinenverwaltung** — Kabinen mit optionaler Team-Zuordnung pro Kabine (z.B. Gegner)
- **Auto-Refresh** — Automatische Aktualisierung alle 5 Minuten + bei Tab-Wechsel
- **Druckansicht** — CSS für Aushang am Schwarzen Brett
- **PWA** — Auf dem Homescreen installierbar

## Architektur

```
Benutzer (anonym)          Admins (Nextcloud-Login)
       |                          |
  GitHub Pages              Nextcloud OCS API
  (Hosting + Lesen)         (Authentifizierung)
       |                          |
       +---------- App -----------+
                    |
            GitHub Contents API
            (Daten schreiben)
                    |
            public/bookings.json
            (im Git-Repo)
```

| Schicht          | Technologie      | Zweck                                      |
|------------------|------------------|---------------------------------------------|
| Frontend         | Preact + Vite    | ~102 kB JS Bundle, schnell, komponentenbasiert |
| Hosting          | GitHub Pages     | Kostenlos, HTTPS, CI/CD via GitHub Actions   |
| Datenspeicherung | GitHub Repo      | bookings.json wird per API committet         |
| Authentifizierung| Nextcloud        | Admin-Login gegen bestehende Nextcloud-User  |
| Serientermine    | RRule.js         | iCal-Standard (RFC 5545)                    |

## Deployment-Anleitung (Schritt für Schritt)

### Voraussetzungen

- GitHub-Account
- Node.js >= 18 und npm
- Nextcloud-Instanz (für Admin-Authentifizierung)
- Git installiert

### 1. Repository forken oder klonen

```bash
git clone https://github.com/DEIN-USER/platzwart.git
cd platzwart
npm install
```

### 2. Anlagen anpassen

Bearbeite `public/facilities.json` mit den Plätzen, Hallen und Kabinen deines Vereins (siehe [Anlagen konfigurieren](#anlagen-konfigurieren) weiter unten).

### 3. Nextcloud-URL eintragen

In `src/config.js` die Nextcloud-URL deines Vereins eintragen:

```js
export const CONFIG = {
  storage: 'github',
  githubRepo: 'DEIN-USER/platzwart',  // Schritt 5
  githubPath: 'public/bookings.json',
  githubBranch: 'main',
  githubToken: import.meta.env.VITE_GITHUB_TOKEN || '',
  nextcloudUrl: 'https://cloud.meinverein.de',  // <-- HIER
};
```

### 4. GitHub Personal Access Token erstellen

Der Token ermöglicht der App, Buchungen als Commits ins Repo zu schreiben.

1. Gehe zu **GitHub → Settings → Developer Settings → Fine-grained personal access tokens**
2. Klicke **Generate new token**
3. Name: z.B. `Platzwart`
4. Expiration: nach Bedarf (z.B. 1 Jahr)
5. **Repository access**: Only select repositories → dein Platzwart-Repo
6. **Permissions → Repository permissions → Contents**: Read and write
7. Alle anderen Permissions auf "No access" lassen
8. **Generate token** → Token kopieren (beginnt mit `github_pat_...`)

### 5. GitHub Repository einrichten

1. Repo auf GitHub erstellen (oder Fork verwenden)
2. In `src/config.js` den `githubRepo`-Wert anpassen (z.B. `'meinverein/platzwart'`)
3. Pushe den Code:

```bash
git remote add origin https://github.com/DEIN-USER/platzwart.git
git push -u origin main
```

### 6. GitHub Secret anlegen

Das Token darf nicht im Quellcode stehen — es wird als Secret in der CI/CD-Pipeline hinterlegt.

1. Gehe zu **Repo → Settings → Secrets and variables → Actions**
2. Klicke **New repository secret**
3. Name: `VITE_GITHUB_TOKEN`
4. Value: den Token aus Schritt 4 einfügen
5. **Add secret**

### 7. GitHub Pages aktivieren

1. Gehe zu **Repo → Settings → Pages**
2. Source: **GitHub Actions**
3. Der nächste Push auf `main` löst automatisch den Build + Deploy aus

### 8. Testen

1. Nach dem Deploy die GitHub Pages URL öffnen (z.B. `https://dein-user.github.io/platzwart/`)
2. Der Platzwart sollte anonym sichtbar sein
3. Klicke auf **Admin** → Nextcloud-Zugangsdaten eingeben
4. Erstelle eine Testbuchung und lade die Seite neu — die Buchung sollte erhalten bleiben

### 9. Lokale Entwicklung

Für lokale Entwicklung mit GitHub-Speicherung eine `.env`-Datei anlegen:

```bash
cp .env.example .env
# Token eintragen:
# VITE_GITHUB_TOKEN=github_pat_...
```

Dann:

```bash
npm run dev       # Entwicklungsserver auf http://localhost:5173
npm run build     # Produktions-Build
npm run preview   # Build lokal testen
```

## Anlagen konfigurieren

Die Anlagen werden in `public/facilities.json` definiert. Nach Änderungen committen und pushen — GitHub Actions baut automatisch neu.

### Felder

| Feld        | Beschreibung                                                           |
|-------------|------------------------------------------------------------------------|
| `id`        | Eindeutige ID (z.B. `grossfeld-1`)                                    |
| `name`      | Anzeigename                                                            |
| `type`      | `grass` / `allweather` / `hall` / `cabin`                              |
| `maxParts`  | Maximale Teilung: `1` = nicht teilbar, `2` = Hälften, `4` = Quadranten |
| `color`     | Hex-Farbe für Kartenansicht                                            |
| `mapCoords` | Position auf der Karte: `{ x, y, width, height }` (SVG-Einheiten 0–100) |

### Feldteilung

Plätze mit `maxParts > 1` können beim Buchen geteilt werden:

- **Ganz** — ganzer Platz
- **Hälften** — quer geteilt (oben/unten), für 2 Mannschaften
- **Quadranten** — 2x2 Aufteilung, für bis zu 4 Gruppen

Die Konflikterkennung funktioniert auch über verschiedene Teilungen hinweg: eine Buchung auf "Hälfte oben" blockiert die Quadranten oben-links und oben-rechts.

### Beispiel: Neuen Platz hinzufügen

```json
{
  "id": "kunstrasen-1",
  "name": "Kunstrasenplatz",
  "type": "allweather",
  "maxParts": 2,
  "color": "#00BCD4",
  "mapCoords": { "x": 10, "y": 85, "width": 30, "height": 12 }
}
```

### Satellitenbild hinterlegen

Für die Kartenansicht kann ein Luftbild der Sportanlage hinterlegt werden:

1. Bild als `public/satellite.jpg` speichern
2. Die `mapCoords` der Anlagen auf das Bild abstimmen
3. Das SVG-Koordinatensystem basiert auf dem Seitenverhältnis des Bildes

## Mannschaften

Teams werden im Browser (localStorage) verwaltet und können im Admin-Bereich unter "Teams" bearbeitet werden:

- Name und Farbe pro Team
- Teams können **aktiviert/deaktiviert** werden — deaktivierte Teams erscheinen nicht in der Buchungsauswahl, bestehende Buchungen bleiben aber sichtbar
- Die Teamfarben werden in allen Ansichten konsistent verwendet

## Datenmodell

### Buchung (`bookings.json`)

| Feld          | Typ              | Beschreibung                                      |
|---------------|------------------|---------------------------------------------------|
| `id`          | `string`         | Eindeutige ID                                     |
| `facilityId`  | `string`         | Referenz auf Anlage                               |
| `parts`       | `number[]`       | Belegte Teile, z.B. `[1]` bei Hälfte oben        |
| `totalParts`  | `number`         | Aktuelle Teilung: `1` = Ganz, `2` = Hälften, `4` = Quadranten |
| `team`        | `string`         | Teamname                                          |
| `title`       | `string`         | Anzeigetitel                                      |
| `startTime`   | `string`         | Beginn `HH:MM`                                   |
| `endTime`     | `string`         | Ende `HH:MM`                                     |
| `rrule`       | `string`         | iCal-Wiederholungsregel, z.B. `FREQ=WEEKLY;BYDAY=TU,TH` |
| `rruleStart`  | `string`         | Startdatum `YYYY-MM-DD`                           |
| `rruleEnd`    | `string`         | Enddatum `YYYY-MM-DD` (leer = unbegrenzt)        |
| `exceptions`  | `string[]`       | Ausfalldaten `YYYY-MM-DD`                         |
| `cabins`      | `string[]`       | Zugeordnete Kabinen-IDs                           |
| `cabinTeams`  | `object`         | Team pro Kabine, z.B. `{ "kabine-1": "Gegner FC" }` (optional) |
| `notes`       | `string`         | Freitext-Notiz                                    |
| `createdBy`   | `string`         | Benutzername                                      |
| `createdAt`   | `string`         | ISO-Zeitstempel                                   |

### Konflikterkennung

Konflikte werden im Buchungsformular live geprüft und berücksichtigen:

- **Anlage** — nur gleiche Anlage
- **Zeitüberlappung** — Start-/Endzeit
- **Wochentage** — Di-Buchung kollidiert nicht mit Mo-Buchung
- **Zeiträume** — Buchung Jan–März kollidiert nicht mit Apr–Juni
- **Feldteile** — Hälfte oben kollidiert nicht mit Hälfte unten; Hälfte oben kollidiert aber mit Quadrant oben-links

Konflikte sind Warnungen — Buchungen können nach Bestätigung trotzdem gespeichert werden.

## Rollen

| Rolle    | Zugang                                | Rechte                           |
|----------|---------------------------------------|----------------------------------|
| Trainer  | App-URL öffnen, kein Login nötig      | Platzwart ansehen            |
| Admin    | Button "Admin" → Nextcloud-Credentials| Buchungen erstellen/bearbeiten/löschen, Teams verwalten |

## Projektstruktur

```
src/
├── main.jsx                     Einstiegspunkt
├── app.jsx                      Haupt-App mit State-Management + Auto-Refresh
├── config.js                    GitHub + Nextcloud Konfiguration
├── api/
│   ├── auth.js                  Login gegen Nextcloud OCS API
│   └── webdav.js                Lesen/Schreiben via GitHub Contents API
├── models/
│   ├── booking.js               Konflikterkennung, Zeithelfer
│   ├── teams.js                 Team-Datenmodell (localStorage)
│   ├── facility.js              Anlagendefinitionen
│   └── recurrence.js            RRule-Expansion für Serientermine
├── components/
│   ├── AdminLogin.jsx           Login-Dialog (Nextcloud)
│   ├── BookingBlock.jsx         Farbiger Buchungsblock (Titel, Feldteile, Kabinen, Repeat)
│   ├── BookingDetail.jsx        Detail-Drawer
│   ├── BookingForm.jsx          Buchungsformular (Konflikte, Feldteile, Kabinen-Teams)
│   ├── BookingList.jsx          Admin-Buchungsliste
│   ├── DayView.jsx              Tagesansicht (Agenda-Layout mit Facility-Karten)
│   ├── FacilityFilter.jsx       Anlagen-Filter mit Typ-Labels
│   ├── FieldPartPicker.jsx      Feldteil-Wähler (Ganz/Hälften/Quadranten)
│   ├── Header.jsx               Navigation + Datumswahl + Dashboard-Tab
│   ├── MapOverlay.jsx           SVG-Overlays (aktuelle + nächste Belegung)
│   ├── MapView.jsx              Kartenansicht (Auto-Update, nächste Belegung)
│   ├── TeamLegend.jsx           Team-Farblegende
│   ├── TeamManager.jsx          Mannschaftsverwaltung
│   ├── TimeSlider.jsx           Zeitschieber
│   └── WeekView.jsx             Wochenansicht (Now-Line, Titel, Feldteile)
├── styles/
│   ├── main.css                 Basis, Header, CSS-Variablen
│   ├── grid.css                 Wochen-/Tagesraster
│   ├── booking.css              Buchungsblöcke, Karte
│   ├── admin.css                Formulare, TeamManager
│   └── print.css                Druckoptimierung
public/
├── bookings.json                Buchungsdaten (wird per GitHub API aktualisiert)
├── facilities.json              Anlagendefinitionen
├── manifest.json                PWA-Manifest
├── satellite.jpg                Luftbild (optional)
└── logo.png                     Vereinslogo
```

## Browser-Unterstützung

- Safari (iOS) — primäres Zielgerät der Trainer
- Chrome (Android)
- Chrome, Firefox, Safari (Desktop)

## Fehlersuche

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Buchungen verschwinden nach Reload | `storage` steht auf `local` | In `config.js` auf `github` setzen und Token konfigurieren |
| "Speichern fehlgeschlagen" | GitHub-Token fehlt oder abgelaufen | Neuen Token erstellen, Secret aktualisieren, neu deployen |
| Admin-Login schlägt fehl | Nextcloud-URL falsch oder nicht erreichbar | URL in `config.js` prüfen, CORS-Header auf Nextcloud prüfen |
| Farben stimmen nicht | Alte Team-Daten im Browser-Cache | In DevTools: `localStorage.removeItem('belegung_teams')` |
| Build schlägt fehl auf GitHub | Secret nicht gesetzt | Repo Settings → Secrets → `VITE_GITHUB_TOKEN` prüfen |

## Lizenz

MIT
