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
  Verbindung). Vollstaendiges DB-Schema in Supabase ausgefuehrt: 23 Tabellen mit RLS,
  Invariante aktiv. Masterplan Abschnitt 5 auf den umgesetzten Stand fortgeschrieben.
  Engine nach TypeScript portiert (reine Rechenlogik, modulare Bausteine unter
  src/engine/) mit 88 gruenen Vitest-Tests, Paritaet zu V1 belegt. Zod-Schemas der
  Entitaeten gebaut (alle 23 Tabellen 1:1 gespiegelt, je Lese- und Schreib-Form, plus
  jsonb-Wertobjekte) unter src/schemas/; Typen daraus abgeleitet. 13 Schema-Tests gruen.
  UI-Fundament steht: TanStack Router file-based (src/routes, generierter Routenbaum),
  Tailwind v4 (Vite-Plugin) und shadcn/ui mit neutraler Basis (noch nicht auf den Look
  getrimmt – das ist Phase 1). Startseite ist erste Route; Health-Check dorthin ueberfuehrt.
- **Als Naechstes:** Offline-Grundgeruest (persistenter Query-Cache + Mutations-Queue,
  Skelett) – schliesst Phase 0 ab. Danach Seed (Definitionen aus V1). Dann Phase 1
  (Design-System / globaler Look).
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
- [x] Schema/Tabellen/RLS umgesetzt (Skript in Supabase ausgefuehrt; 23 Tabellen mit RLS)
- [x] Invarianten als DB-Constraints (genau eine aktive Journey pro Nutzer, aktiv)
- [x] Vite + TypeScript (strict) aufgesetzt (minimales Skelett)
- [x] TanStack Router (file-based) eingerichtet (src/routes mit __root + index,
      generierter Routenbaum, Devtools nur im Dev)
- [x] Tailwind + shadcn/ui aufgesetzt (Tailwind v4 via Vite-Plugin; shadcn neutrale Basis,
      components.json, cn-Helfer, Button-Primitive, @-Pfadalias)
- [x] Supabase-Client + TanStack-Query-Setup (Verbindung steht, Health-Check sichtbar)
- [x] Engine nach TypeScript portiert (1RM, Plate-Loader, Aufwaerm-Generator,
      Doppelprogression, Phasenwechsel, Suitability, Volumen/Deload, Erholungs-Check,
      Skill-Advice) – modulare Bausteine unter src/engine/, Logik 1:1 aus V1
- [x] Engine-Unit-Tests laufen (Vitest), gruen – 88 Tests in 7 Dateien, Paritaet zu V1 belegt
- [x] Zod-Schemas fuer die Entitaeten (alle 23 Tabellen 1:1 gespiegelt: Row + Insert,
      jsonb-Wertobjekte; Typen abgeleitet; 13 Tests gruen)
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

- 2026-06-22 – UI-Fundament aufgesetzt: TanStack Router file-based (src/routes mit
  __root + index, automatisch generierter Routenbaum, Router-Devtools nur im Dev,
  basepath an Vite-base gekoppelt fuer Pages). Tailwind v4 ueber @tailwindcss/vite,
  shadcn/ui mit neutraler Standardbasis (components.json, cn-Helfer, Button-Primitive,
  @-Pfadalias) – der eigentliche Look folgt bewusst erst in Phase 1. Startseite ist erste
  Route; Health-Check aus App.tsx dorthin ueberfuehrt und auf Tailwind/Button umgestellt,
  App.tsx entfernt. Typecheck, Build und 101 Tests gruen.

- 2026-06-22 – Engine nach TypeScript portiert: reine Rechenlogik aus V1 als modulare
  Bausteine (1RM, Plate-Loader, Aufwaerm-Generator, Doppelprogression, Phasenwechsel,
  Suitability, Volumen/Deload, Erholungs-Check, Skills) unter src/engine/. 88 Vitest-Tests
  gruen; aus V1 portierte Tests belegen Paritaet. Typecheck und Build gruen.
- 2026-06-22 – Zod-Schemas der Entitaeten gebaut: alle 23 Tabellen 1:1 zur Datenbank
  gespiegelt (snake_case-Spaltennamen, Nullbarkeit, CHECK-Listen als Enums), je eine
  Lese-Form (Row) und eine Schreib-Form (Insert ohne id/created_at, Defaults optional).
  jsonb-Wertobjekte praezisiert (settings.timers/recovery_windows fest; body, general_warmup,
  suggestion, skill_progress.log vorlaeufig als lockere Objekte). Typen via z.infer
  abgeleitet. Abgelegt unter src/schemas/, gruppiert wie die DB-Abschnitte, mit Barrel.
  13 Schema-Tests gruen; Typecheck und Build gruen.
