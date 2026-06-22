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
- **Erledigt:** Fundament steht (Vite + Pages-Deploy, Supabase-Projekt, Client/Query,
  Verbindung). Vollstaendiges DB-Schema gegen das echte V1-Modell abgeglichen, als
  `supabase/migrations/0001_initial_schema.sql` geschrieben und lokal gegen eine echte
  Postgres-Instanz validiert (23 Tabellen, RLS + 92 Policies, Invariante, 43 FKs, Check-
  und Cascade-Tests bestanden). Masterplan Abschnitt 5 entsprechend fortgeschrieben.
- **Als Naechstes / Aktion beim Nutzer:** Das Schema-Skript einmalig im Supabase-SQL-
  Editor ausfuehren (reinkopieren, „Run"). Ich fuehre durch die Klicks.
- **Danach:** restliches Stack-Setup (Router, Tailwind/shadcn, Zod-Schemas),
  Engine-Portierung samt Tests, Offline-Grundgeruest, dann der Seed (Definitionen aus
  V1 als DB-Daten).
- **Offene Grundsatzfragen:** Deploy/Test geklaert. In-App-Versionsanzeige (dreistellig,
  schlank) als spaeterer Komfort-Block vorgemerkt.

---

## Globaler Look zuerst

Vor den Feature-Bloecken steht die durchgaengige Gestaltung (Phase 1). Sie gilt fuer
alle Bloecke und wird einmal bewusst entschieden, bevor einzelne Seiten entstehen.

---

## Phase 0 – Schema und Fundament

- [x] Setup-Grundsatzentscheidungen bestaetigt (Stack, Offline-Zuschnitt, Deploy/Test-Weg)
- [x] Supabase-Projekt fuer V2 angelegt (eigene DB, getrennt von V1)
- [ ] Schema/Tabellen/RLS umgesetzt (Skript erstellt + lokal gegen Postgres validiert;
      Ausführung im Supabase-SQL-Editor steht beim Nutzer)
- [ ] Invarianten als DB-Constraints (im Skript enthalten + getestet: genau eine aktive
      Journey; wird mit der Ausführung wirksam)
- [x] Vite + TypeScript (strict) aufgesetzt (minimales Skelett)
- [ ] TanStack Router (file-based) eingerichtet
- [ ] Tailwind + shadcn/ui aufgesetzt
- [x] Supabase-Client + TanStack-Query-Setup (Verbindung steht, Health-Check sichtbar)
- [ ] Engine nach TypeScript portiert (1RM, Plate-Loader, Aufwaerm-Generator,
      Doppelprogression, Suitability, Volumen/Deload, Skill-Advice)
- [ ] Engine-Unit-Tests laufen (z. B. Vitest), gruen
- [ ] Zod-Schemas fuer die Entitaeten
- [ ] Offline-Grundgeruest gelegt (persistenter Query-Cache + Mutations-Queue, Skelett)
- [x] **Live-Test-Deploy eingerichtet** (Workflow gepusht; baut bei jedem Push auf main
      und veroeffentlicht auf Pages. Letzter Handgriff beim Nutzer: Pages-Quelle auf
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
