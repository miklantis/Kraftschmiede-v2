# Kraftschmiede V2 – Plan & Fortschritt (Betrieb & Weiterentwicklung)

Diese Datei ist die verbindliche Schritt-Liste und die Quelle der Wahrheit fuer den
Projektstand.

**Zu Sitzungsbeginn immer zuerst diese Datei lesen**, den Abschnitt „Aktueller Stand"
pruefen und erst dann weiterarbeiten. Nach jedem umgesetzten Schritt die passenden
Kaestchen abhaken und „Aktueller Stand" fortschreiben – im selben Commit wie die Aenderung
oder als eigener kleiner Commit.

Konvention: `- [ ]` offen, `- [x]` erledigt. Modus pro Feature: **erst Konzept gemeinsam
besprechen, dann bauen, dann auf der Live-Seite testen.**

Inhaltliche Quellen:
- `docs/Masterplan-V2.md` – Gesamtkonzept (Schema, Architektur).
- `docs/Konzept-PWA-Offline.md` – Konzept fuer das naechste Vorhaben (Offline-Huelle +
  Update-Hinweis).
- `docs/archive/PLAN-Migration-V1-zu-V2.md` – kompletter Migrationsverlauf V1->V2 (Historie,
  abgeschlossen). Bei Bedarf zum Nachschlagen, sonst nicht mehr aktiv gepflegt.

Referenz-App (nur lesen, niemals aendern): https://github.com/miklantis/Kraftschmiede
V1 ist abgeloest und laeuft nicht mehr produktiv. Das Repo bleibt als read-only Referenz,
vor allem um bei Bedarf Engine-/Coach-Logik nachzuschlagen, falls in V2 im Betrieb etwas
nicht rund laeuft.

---

## Aktueller Stand

- **Migration V1->V2 abgeschlossen.** V2 ist funktional und optisch auf V1-Paritaet, laeuft
  auf der normalisierten Datenbank und ist installierbar (Manifest/Icons/Vollbild). V2 ist
  die aktive App. Verlauf siehe `docs/archive/PLAN-Migration-V1-zu-V2.md`.
- **Aktueller Fokus: PWA (Offline-Huelle + Update-Hinweis).** Konzept steht in
  `docs/Konzept-PWA-Offline.md`, Bau noch nicht begonnen.
- **Naechster Schritt:** vor Lieferung 1 die offenen Konzept-Entscheidungen mit Kadir
  klaeren (Optik/Platzierung des Hinweises, Changelog-Format und -Ort, Pruef-Intervall),
  dann PWA Lieferung 1 (Offline-Huelle).

---

## Offene Vorhaben

### PWA – Offline-Huelle & Update-Hinweis

Konzept: `docs/Konzept-PWA-Offline.md`. In kleinen, einzeln testbaren Schritten.

- [ ] Lieferung 1: Offline-Huelle (Service Worker, Precache der App-Shell, Supabase
  ausgenommen)
- [ ] Lieferung 2: Update-Erkennung + Hinweis („Neue Version" + „Aktualisieren")
- [ ] Lieferung 3: „Was ist neu" (Changelog-Datei + Anzeige im Hinweis)
- [ ] Lieferung 4: Feinschliff (Optik, „nicht waehrend einer Einheit", Notbremse)

### Pflege / Bugfixing

Laufend, ergibt sich im Betrieb. Kein geplanter Block; einzelne Punkte werden hier
gefuehrt, sobald sie auftauchen.

- (noch keine offenen Punkte)

---

## Erledigt (Log)

Hier kommen abgeschlossene Bloecke mit Datum dazu.

- 2026-06-24 - Neues Projekt „Betrieb & Weiterentwicklung" aufgesetzt. Migrationsverlauf
  nach `docs/archive/PLAN-Migration-V1-zu-V2.md` ausgelagert, schlanke neue PLAN.md
  gestartet. Migration V1->V2 gilt als abgeschlossen; aktueller Fokus ist die PWA.
