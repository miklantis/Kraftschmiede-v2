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

- **Phase:** Erstbefuellung (Seed + Migration zusammengefasst). Voraussetzung Login gebaut.
- **Erledigt:** Phase 0 abgeschlossen (Fundament, Schema/RLS, Engine, Zod-Schemas, UI-Fundament,
  Offline-Grundgeruest, Live-Deploy). Schlichter Login als Voraussetzung fuer alle
  Schreibzugriffe gebaut: E-Mail/Passwort ueber Supabase Auth (Anmelden, Konto anlegen,
  Abmelden), AuthProvider + useAuth-Hook, AuthGate vor dem Router, wiederverwendbares
  Input-Primitive. Startseite zeigt angemeldete E-Mail und Abmelden.
- **Entscheidung:** Auf Wunsch werden der reine Seed (Definitionen) und die Migration
  (persoenliche Daten) zu einer Erstbefuellung zusammengefasst. Definitionen (7 Journey-
  Vorlagen, 2 Skill-Progressionen) befuellen sich automatisch beim ersten Start nach Login;
  die kompletten V1-Daten kommen einmalig per Import-Knopf rein (dieser ist zugleich die
  spaetere Import/Export-Funktion). Aktive Journey wird die echte "Rueckkehr 2026".
- **Als Naechstes:** (1) Du legst auf der V2-Datenbank ein Konto an und meldest dich an
  (E-Mail-Bestaetigung im Supabase-Projekt unter Authentication kurz ausschalten).
  (2) Definitionen automatisch seeden + Datenstand-Anzeige (Zeilen je Tabelle) zum Pruefen.
  (3) Import-Knopf fuer die kompletten V1-Daten. Danach Phase 1 (globaler Look).
- **Bewusst noch nicht dabei:** vollstaendiges Konto-Panel (Phase 10), App-Huelle offline
  laden (PWA, Phase 13), sichtbare Offline-Anzeige (Phase 1/2).
- **Offene Grundsatzfragen:** Deploy/Test geklaert. In-App-Versionsanzeige (dreistellig,
  schlank) als spaeterer Komfort-Block vorgemerkt. Login ist eine Minimalversion; das
  vollstaendige Konto-/Sync-Panel bleibt Phase 10.

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
- [x] Offline-Grundgeruest gelegt (persistenter Query-Cache in IndexedDB + Fortsetzen
      pausierter Mutationen, Skelett; Cache-Buster + Max-Alter 7 Tage)
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

- 2026-06-22 – Schlichter Login gebaut (Voraussetzung fuer alle RLS-geschuetzten
  Schreibzugriffe): Auth-Schicht src/lib/auth.tsx (AuthProvider + useAuth) ueber Supabase
  Auth mit Sitzungsverfolgung (getSession + onAuthStateChange), Anmelden
  (signInWithPassword), Konto anlegen (signUp, erkennt ausstehende E-Mail-Bestaetigung)
  und Abmelden; bekannte Fehlertexte ins Deutsche uebersetzt. Login-Bildschirm
  src/components/LoginScreen.tsx (E-Mail/Passwort, Umschalten Anmelden/Registrieren,
  Fehler-/Hinweiszeile). AuthGate src/components/AuthGate.tsx sitzt in main.tsx vor dem
  RouterProvider und laesst die App erst nach Anmeldung durch. Wiederverwendbares
  Input-Primitive src/components/ui/input.tsx. Startseite zeigt angemeldete E-Mail und
  Abmelden-Knopf. Bewusst eine Minimalversion; das volle Konto-/Sync-Panel bleibt Phase 10.
  Typecheck, Build und 101 Tests gruen.

- 2026-06-22 – Offline-Grundgeruest gelegt (Phase 0 abgeschlossen): zentraler Query-Client
  unter src/lib/queryClient.ts (gcTime 7 Tage, staleTime 30 s, retry 1). Persistenter Cache
  in IndexedDB ueber src/lib/offline.ts (Async-Storage-Persister auf idb-keyval, Cache-Buster
  und Max-Alter 7 Tage). main.tsx auf PersistQueryClientProvider umgestellt; nach dem
  Wiederherstellen werden pausierte Mutationen fortgesetzt (resumePausedMutations). Damit
  ueberlebt der Lese-Cache einen App-Neustart, und ohne Netz angefallene Schreibvorgaenge
  werden bei Reconnect bzw. Neustart nachgeschickt – als Geruest; die echten Entitaets-Hooks
  folgen in den Feature-Phasen. Bewusst nicht dabei: App-Huelle offline laden (PWA, Phase 13)
  und sichtbare Offline-Anzeige (Phase 1/2). Neue Abhaengigkeiten:
  @tanstack/react-query-persist-client, @tanstack/query-async-storage-persister (beide 5.101.0),
  idb-keyval 6.2.5. Typecheck, Build und 101 Tests gruen.

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
