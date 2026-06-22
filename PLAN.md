# Kraftschmiede V2 – Plan & Fortschritt

Diese Datei ist die verbindliche Schritt-Liste fuer den Neubau von Kraftschmiede als
React/TypeScript-Web-App. Sie ist die Quelle der Wahrheit fuer den Projektstand.

**Zu Sitzungsbeginn immer zuerst diese Datei lesen**, den Abschnitt „Aktueller Stand"
pruefen und erst dann weiterarbeiten. Nach jedem umgesetzten Schritt die passenden
Kaestchen abhaken und „Aktueller Stand" aktualisieren – im selben Commit wie die
Aenderung oder als eigener kleiner Commit.

Konvention: `- [ ]` offen, `- [x]` erledigt. Modus pro Feature-Block: **erst Konzept
gemeinsam besprechen, dann bauen, dann auf der Live-Seite testen.**

Referenz-App (nur lesen, niemals aendern): https://github.com/miklantis/Kraftschmiede

---

## Aktueller Stand

- **Phase:** 0 (Schema und Fundament) – begonnen
- **Erledigt:** Minimales Vite-Skelett (React 19, TS strict). Typecheck und Build laufen
  lokal gruen.
- **Blockiert:** Der Deploy-Workflow ist vorbereitet, kann aber noch nicht gepusht werden
  – der Token darf keine Workflow-Dateien anlegen (fehlende Berechtigung „Workflows").
- **Als Naechstes / Aktion beim Nutzer:** Dem bestehenden Token die Berechtigung
  „Workflows: Read and write" geben (Token-Wert bleibt gleich). Danach pushe ich den
  Workflow; anschliessend Pages-Quelle einmalig auf „GitHub Actions" stellen. Test-URL
  dann: https://miklantis.github.io/Kraftschmiede-v2/
- **Danach im Projekt:** Supabase-Projekt fuer V2 anlegen (eigene DB), dann Schema/RLS,
  restliches Stack-Setup (Router, Tailwind/shadcn, Query, Zod) und Engine-Portierung.
- **Offene Grundsatzfragen:** Deploy/Test geklaert (GitHub Pages via Action).

---

## Globaler Look zuerst

Vor den Feature-Bloecken steht die durchgaengige Gestaltung (Phase 1). Sie gilt fuer
alle Bloecke und wird einmal bewusst entschieden, bevor einzelne Seiten entstehen.

---

## Phase 0 – Schema und Fundament

- [ ] Setup-Grundsatzentscheidungen bestaetigt (Stack, Offline-Zuschnitt, Deploy/Test-Weg)
- [ ] Supabase-Projekt fuer V2 angelegt (eigene DB, getrennt von V1)
- [ ] Schema/Tabellen/RLS umgesetzt (Definitionen + Nutzerzustand, siehe Masterplan 5)
- [ ] Invarianten als DB-Constraints (z. B. genau eine aktive Journey pro Nutzer)
- [x] Vite + TypeScript (strict) aufgesetzt (minimales Skelett)
- [ ] TanStack Router (file-based) eingerichtet
- [ ] Tailwind + shadcn/ui aufgesetzt
- [ ] Supabase-Client + TanStack-Query-Setup
- [ ] Engine nach TypeScript portiert (1RM, Plate-Loader, Aufwaerm-Generator,
      Doppelprogression, Suitability, Volumen/Deload, Skill-Advice)
- [ ] Engine-Unit-Tests laufen (z. B. Vitest), gruen
- [ ] Zod-Schemas fuer die Entitaeten
- [ ] Offline-Grundgeruest gelegt (persistenter Query-Cache + Mutations-Queue, Skelett)
- [ ] **Live-Test-Deploy eingerichtet** (Workflow vorbereitet; Push noch blockiert, weil
      dem Token die Berechtigung „Workflows" fehlt – danach Pages-Quelle auf
      „GitHub Actions" stellen)

## Phase 1 – Design-System (globaler Look)

- [ ] Konzept abgestimmt (Theme/Stimmung, Schriften, Farben, Spacing, Grundelemente)
- [ ] Klar-Tokens (`--accent #0c9d77` etc.) als Tailwind-Theme
- [ ] shadcn/ui auf das Aussehen getrimmt
- [ ] Sora / Spline Sans Mono eingebunden

## Phase 2 – Navigation / Shell

- [ ] Konzept abgestimmt (Seitenstruktur, Sidebar/Bottom-Nav, Verhalten Mobile/Desktop)
- [ ] Routing-Geruest steht
- [ ] Sidebar (Desktop) + Bottom-Nav (Mobile)

## Phase 3 – Training

- [ ] Konzept abgestimmt
- [ ] Workout-Karten
- [ ] Suitability/Erholungs-Check
- [ ] Coach-Anbindung
- [ ] Live getestet

## Phase 4 – Verlauf

- [ ] Konzept abgestimmt
- [ ] Kalender + Listenansicht
- [ ] Session-Zusammenfassung
- [ ] Erste Charts
- [ ] Live getestet

## Phase 5 – Journey

- [ ] Konzept abgestimmt
- [ ] Phasen + Wochen-Platzierung (automatisch)
- [ ] Periodisierungschart
- [ ] Live getestet

## Phase 6 – Skills

- [ ] Konzept abgestimmt
- [ ] Manager-Ansicht (aktivieren, Phase anpassen, Fortschritt)
- [ ] Equipment-Tor
- [ ] Konsekutiv-Logik (Zaehler-Reset bei Fehlschlag)
- [ ] Live getestet

## Phase 7 – Yoga

- [ ] Konzept abgestimmt
- [ ] Karte im Training-Tab + Eintrag-Popup
- [ ] Live getestet

## Phase 8 – Uebungen (inkl. Muscle-Map)

- [ ] Konzept abgestimmt
- [ ] Uebungsliste
- [ ] Detailseite
- [ ] Generische MuscleMap-Komponente (Doku: docs/Muskel-Map.md)
- [ ] Live getestet

## Phase 9 – Koerper

- [ ] Konzept abgestimmt
- [ ] Body-Log
- [ ] InBody-Composition
- [ ] Verlaufscharts
- [ ] Live getestet

## Phase 10 – Einstellungen

- [ ] Konzept abgestimmt
- [ ] Inventar (Stangen, Scheiben, Equipment)
- [ ] Plate-Loader / Ladbarkeitspruefung
- [ ] Settings (Frequenzziel, Gewichtsschritt, 1RM-Formel, Timer)
- [ ] Sync-/Konto-Panel
- [ ] Live getestet

## Phase 11 – Live-Session (Kraft + Skill)

- [ ] Konzept abgestimmt
- [ ] Gefuehrter Ablauf, Saetze abhaken
- [ ] Pausen-/Rest-Timer (Satz/Uebung getrennt, Auto-Start)
- [ ] Audio/Vibration
- [ ] Start-/Ende-Dialoge, Bottom-Sheet
- [ ] Volles Offline-Zusammenspiel (Aufzeichnen ohne Netz, spaeter Sync)
- [ ] Live getestet

## Phase 12 – Migration + Import/Export

- [ ] Konzept abgestimmt
- [ ] Definitionen aus V1-Code als DB-Seed
- [ ] Migrationsskript: V1-Blob -> normalisierte Zeilen, IDs umschluesseln
- [ ] JSON-Import/Export
- [ ] Abgleich alt/neu (Anzahl Sessions/Saetze/Journeys + Stichproben)

## Phase 13 – Politur

- [ ] PWA
- [ ] iOS-Safari-Fixes
- [ ] Bugfixing
- [ ] Paritaetsdurchlauf gegen V1

---

## Erledigt (Log)

Hier kommen abgeschlossene Bloecke mit Datum dazu, sobald sie fertig sind.

- (noch nichts)
