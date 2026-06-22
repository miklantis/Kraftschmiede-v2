# Kraftschmiede V2 – Masterplan (Rewrite mit relationaler Datenbank)

Status: Arbeitsdokument zur Diskussion. Block fuer Block verfeinerbar.

---

## 1. Ziel und Motivation

Kompletter Neubau der App als moderne Web-App – neues Repo, neue Supabase-Datenbank,
neuer Frontend-Stack. Funktional gleichwertig zur jetzigen Kraftschmiede, optisch
aehnlich (Theme/Farben pro Block neu entschieden).

Treiber (vom Nutzer benannt):
- Wiederverwendbare Komponenten statt page-to-page-Duplikation (Pop-ups, Tabellen).
- Bessere Wartbarkeit und Verstaendlichkeit.
- Naeher an aktuellen Web-App-Standards.
- Lernerfahrung: eine Web-App mit KI bauen.
- Kein Zeitdruck – die alte App laeuft produktiv weiter.

Das ist der ideale Modus: V2 entsteht als entspanntes Parallelprojekt ohne
Migrationsdruck. V1 bleibt bis zum bewussten Umschalten in Betrieb.

---

## 2. Die zentrale Aenderung gegenueber V1

**Das Blob-Modell wird aufgegeben.** Statt eines einzigen jsonb-Objekts pro Nutzer
kommt eine normalisierte Datenbank mit echten Tabellen und Beziehungen.

Konsequenzen:
- Dies ist **kein reines Frontend-Refactoring** mehr. Schema, RLS und eine einmalige
  Datenmigration kommen als eigene, gewichtige Bloecke dazu.
- TanStack Query wird jetzt passend: echte Queries/Mutations je Entitaet,
  granulares Caching und Invalidierung.
- Das last-write-wins-Problem des Blob-Sync entfaellt weitgehend – Aenderungen
  betreffen einzelne Zeilen, nicht den ganzen Zustand.
- Pragmatischer Mittelweg: Kern-Nutzerdaten (Sessions, Saetze, Journeys/Phasen)
  werden echte Relationen. Kleine, attributarme Wertobjekte (InBody-Composition,
  Timer-Einstellungen) duerfen als jsonb-Spalte in ihrer Tabelle bleiben – das ist
  sauber und kein verkapptes Blob-Modell.

---

## 3. Getroffene strategische Entscheidungen

### 3.1 Offline-Faehigkeit – ENTSCHIEDEN: Offline-first mit Sync

Im Gym soll ohne Netz trainiert und aufgezeichnet werden; spaeter synchronisiert die
App in die Datenbank. Das ist Offline-first mit Sync: lokale Persistenz (IndexedDB /
persistenter TanStack-Query-Cache) plus Mutations-Queue, die bei Verbindung hochlaedt.

Pragmatischer Zuschnitt: Die Live-Session muss voll offline laufen (dort wird
aufgezeichnet). Beim Rest der App reicht ein offline-Lesecache. Das ist der groesste
einzelne Aufwandstreiber des Projekts und der Grund, warum die Schaetzung am oberen
Rand der Spanne liegt.

### 3.2 Uebungen/Vorlagen – ENTSCHIEDEN: Stammdaten wie heute

Uebungen und Vorlagen bleiben im Code definiert (kein Nutzer-Editieren in der ersten Runde).
Folge fuers Schema: Stammdaten leben im Code, die Datenbank enthaelt ausschliesslich
Nutzerdaten (Sessions, Saetze, aktive Journey/Phasen, Skill-Fortschritt, Body-Log,
Inventar, Settings). Siehe Abschnitt 5.

### 3.3 Skill-Definitionen

In V1 sind die SKILLS-Definitionen Code, nur der Fortschritt liegt in Daten. Das ist
ein gutes Muster und sollte so bleiben: Definitionen im Code, `skill_progress` in der DB.

---

## 4. Tech-Stack

- Frontend: React 19
- Build: Vite
- Sprache: TypeScript (strict, kein `any`, Interfaces fuer alle Strukturen)
- Routing: TanStack Router (file-based, `src/routes`)
- Server-State: TanStack Query (v5+)
- Client-State: minimal halten; URL-State oder TanStack Store nur wo noetig
- Styling: Tailwind CSS
- UI-Komponenten: shadcn/ui (Primitives in `src/components/ui`)
- Icons: Lucide
- Validierung: Zod (Formulare, API-Antworten, Schemas)
- Datenbank: Supabase (Postgres), RLS pro Tabelle

---

## 5. Datenbank-Schema (Entwurf)

Nach Entscheidung 3.2 enthaelt die Datenbank **nur Nutzerdaten**. Stammdaten bleiben
im Code und werden nicht gespeichert:

- **Im Code (Stammdaten, keine Tabellen):** Uebungs-Definitionen inkl. Muskel-Beteiligung
  (region_id -> primaer/sekundaer/stabilisierend), Workout-Vorlagen, Skill-Definitionen,
  Journey-Vorlagen. Sessions/Saetze referenzieren Uebungen und Vorlagen ueber deren
  stabile Code-ID (String-Key), nicht ueber einen Fremdschluessel auf eine Tabelle.

Alle folgenden Tabellen mit `user_id` und RLS (jede Person sieht/aendert nur ihre Zeilen).
Konkrete Felder verfeinern wir beim Bau; dies ist die Struktur:

- **journeys** – id, user_id, name, active (bool), created_at
- **phases** – id, journey_id (FK), name, focus (reentry/hypertrophy/strength/test),
  weeks, sets_start, sets_end, deload_week (nullable), position
- **sessions** – id, user_id, date, type (strength/yoga/skill), journey_id (FK,
  nullable), template_key (Code-ID, nullable), skill_key (Code-ID, nullable),
  duration_min (fuer yoga)
- **sets** – id, session_id (FK), exercise_key (Code-ID), weight, reps, done, score,
  position
- **skill_progress** – id, user_id, skill_key (Code-ID), current_phase, counter
- **body_log** – id, user_id, date, weight, composition (jsonb fuer InBody-Messwerte)
- **inventory_bars** – id, user_id, name, weight
- **inventory_plates** – id, user_id, weight, count
- **inventory_equipment** – id, user_id, name, enabled (bool)
- **settings** – user_id (PK), weekly_frequency_target, weight_step, orm_formula,
  recovery-/timer-Einstellungen (Skalare als Spalten, kleine Bloecke ggf. jsonb)

Invarianten als DB-Constraints, wo moeglich (z. B. genau eine aktive Journey pro Nutzer
ueber Partial Unique Index auf `active = true`).

---

## 6. Architektur-Leitplanken

- **Engine bleibt rein.** `engine.js` wird nach TypeScript portiert (1RM, Plate-Loader,
  Aufwaerm-Generator, Doppelprogression, Suitability, Volumen/Deload, Skill-Advice) –
  mitsamt Unit-Tests. Da sie reine Funktionen ist (Daten rein, Ergebnis raus), bleibt
  sie vom Schemawechsel unberuehrt. Nur die datenbeschaffende Glue-/Coach-Schicht aendert
  sich.
- **Coach als eigenes, testbares Modul** (`coach.ts`): nimmt Zustand explizit herein,
  gibt Entscheidungen heraus – gleiche Form wie die Engine. Kein DOM-Bezug.
- **Datenzugriff gekapselt** in Query-/Mutation-Hooks je Entitaet (z. B.
  `useSessions`, `useExercises`). Komponenten kennen kein Supabase direkt.
- **Wiederverwendbare Primitives** in `src/components/ui` (Modal, DataTable, Sheet,
  MuscleMap, Chart). Genau das Ziel: einmal bauen, ueberall nutzen.
- **Zod-Schemas** als Quelle der Wahrheit fuer Datenformen; TypeScript-Typen daraus
  abgeleitet.
- **Domaenensprache deutsch** (Uebung, Journey, Session, Vorlage, Phase), Code-/
  Architekturbegriffe englisch.

---

## 7. Migration des Bestands (kritischer Einmal-Schritt)

Der jetzige jsonb-Blob muss verlustfrei in die neuen Tabellen ueberfuehrt werden.

- Einmaliges Skript: Blob auslesen, in normalisierte Zeilen zerlegen, in neue DB
  schreiben.
- Reihenfolge wegen Foreign Keys: erst inventory/exercises/templates, dann journeys/
  phases, dann sessions/sets, dann skill_progress/body_log/settings.
- Validierung: Anzahl Sessions, Saetze, Journeys vorher/nachher abgleichen; Stichproben
  visuell vergleichen.
- Sicher fahren: alte App und Daten bleiben unangetastet; Migration laeuft in die neue
  DB. Erst nach erfolgreichem Abgleich wird umgeschaltet.

---

## 8. Phasenplan

Schaetzung in aktiven Arbeitstagen (Tage mit Bauen und Testen). Kalenderzeit ist
laenger wegen Feedback-Schleifen.

### Phase 0 – Schema und Fundament
- Supabase-Projekt anlegen, Schema/Tabellen/RLS aus Abschnitt 5 umsetzen.
- Vite + TS + TanStack Router + Tailwind + shadcn aufsetzen, Supabase-Client,
  TanStack-Query-Setup.
- Engine nach TS portieren samt Tests. Zod-Schemas fuer die Entitaeten.
- Offline-Entscheidung (3.1) umsetzen bzw. Grundgeruest legen.
- Schaetzung: ~5–8 Tage. Wichtigster Block.

### Phase 1 – Design-System
- Klar-Tokens (`--accent #0c9d77` etc.) als Tailwind-Theme, shadcn auf das Aussehen
  trimmen, Sora / Spline Sans Mono einbinden. ~1–2 Tage.

### Phase 2 – Navigation / Shell
- Sidebar + Bottom-Nav, Routing-Geruest. ~1 Tag.

### Phase 3 – Training
- Workout-Karten, Suitability/Erholungs-Check, Coach-Anbindung. ~2–3 Tage.

### Phase 4 – Verlauf
- Kalender + Liste + Session-Zusammenfassung, erste Charts. ~1–2 Tage.

### Phase 5 – Journey
- Phasen, Wochen-Platzierung, Periodisierungschart. ~2 Tage.

### Phase 6 – Skills
- Manager, Phasen, Equipment-Tor, Konsekutiv-Logik. ~1–2 Tage.

### Phase 7 – Yoga
- Karte + Eintrag-Popup. ~0,5–1 Tag.

### Phase 8 – Uebungen (inkl. Muscle-Map)
- Liste, Detailseite, generische MuscleMap-Komponente. ~2–3 Tage.

### Phase 9 – Koerper
- Body-Log, InBody-Composition, Verlaufscharts. ~1–2 Tage.

### Phase 10 – Einstellungen
- Inventar, Plate-Loader, Settings, Sync-/Konto-Panel. ~1–2 Tage.

### Phase 11 – Live-Session (Kraft + Skill)
- Timer, Pausen-/Rest-Sheet, Audio/Vibration, Start-/Ende-Dialoge, Bottom-Sheet.
  Dickster Brocken, plus Zusammenspiel mit der Offline-Strategie. ~4–6 Tage.

### Phase 12 – Migration + Import/Export
- Migrationsskript (Abschnitt 7), JSON-Import/Export, Abgleich alt/neu. ~2–4 Tage.

### Phase 13 – Politur
- PWA, iOS-Fixes, Bugfixing, Paritaetsdurchlauf gegen V1. ~3–5 Tage.

---

## 9. Gesamtschaetzung

Summe der aktiven Tage: grob **30–50 Tage**. Ueber Kalenderzeit mit Testen und
Iteration realistisch **8–14 Wochen** bei regelmaessiger Arbeit.

Die Spanne haengt vor allem an zwei Bloecken: der Offline-Strategie (Phase 0/11) und
der Migration (Phase 12). Faellt die Offline-Entscheidung auf „online-first", liegst
du am unteren Rand; mit vollem Offline-Sync am oberen.

---

## 10. Risiken und bewusste Trade-offs

- **Paritaet kostet.** Eine reife App hat ueber Monate gewachsene Kanten (iOS-Fixes,
  Deload-Logik, Migrations-Selbstheilung, Score-Mapping). Die alle neu nachzubauen ist
  der Teil, der Schaetzungen sprengt.
- **Offline ist der Knackpunkt.** Der Wechsel vom lokalen Blob zur Server-DB kostet die
  triviale Offline-Faehigkeit. Bewusst entscheiden, nicht uebersehen.
- **Migration muss verlustfrei sein.** Kein produktives Umschalten ohne erfolgreichen
  Abgleich.
- **Gegenmittel Zeitdruck: keiner.** V1 laeuft weiter. Jede Phase ist ein eigener,
  abbrechbarer Schritt. Schon Phase 0 + ein kleiner Block zeigt, ob der Rhythmus passt.

---

## 11. Bewusst nicht Teil dieser Planung

- Kein Big-Bang-Umschalten – V2 entsteht parallel, V1 bleibt bis zur bewussten Abloesung.
- Keine neuen Features ueber V1 hinaus in der ersten Runde (Paritaet zuerst).
- Keine Aenderung an der laufenden V1-App.
