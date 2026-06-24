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
- `docs/Designsystem.md` – Ueberblick ueber die wiederverwendbaren UI-Bausteine und
  Design-Tokens. Bei neuen Primitives hier eine Zeile ergaenzen.
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
  `docs/Konzept-PWA-Offline.md`. Die Optik/Platzierung des Hinweises (Streifen oben auf der
  Trainingsseite, Popup auf dem `Overlay`-Primitive, scrollbare „Was ist neu"-Liste,
  „Aktualisieren" unten) und die Versionskennung (`1.0.20`-Schema plus Datum) sind geklaert
  und ins Konzept eingepflegt.
- **Lieferung 1 (Offline-Huelle) gebaut und gepusht.** `vite-plugin-pwa` (Workbox) erzeugt
  beim Build den Service Worker, der die App-Shell (HTML/JS/CSS, Icons, gebuendelte
  Schriften) vorcacht. `registerType: 'prompt'`, also kein stilles Auto-Update. Supabase ist
  bewusst nicht im Cache (keine runtimeCaching-Regel), die Datenlogik bleibt allein bei der
  TanStack-Schicht.
- **Lieferung 2 (Update-Erkennung + Hinweis) gebaut und gepusht.** Beim App-Start
  registriert die App den Service Worker und erkennt eine wartende neue Huelle. Dann
  erscheint oben auf der Trainingsseite (ueber Journey und Empfehlung) ein dezenter
  Hinweis-Streifen „Neue Version verfuegbar" mit Knopf „Aktualisieren"; der Knopf aktiviert
  die neue Huelle und laedt einmal neu. Geprueft wird nur beim Start, nicht periodisch
  (Entscheidung, Konzept Abschnitt 8). Kapselung: Registrierung + Wartesignal in
  `src/lib/pwaUpdate.ts`, Hook `useAppUpdate`, darstellender Streifen `UpdateBanner`.
- **Naechster Schritt:** PWA Lieferung 3 („Was ist neu"). Streifen wird antippbar und
  oeffnet ein Popup (auf dem `Overlay`-Primitive) mit der Aenderungsliste; der
  „Aktualisieren"-Knopf wandert dorthin. Vorab zu klaeren: Format und Ort der
  Changelog-Datei (Ausgangsvorschlag `public/changelog.json`), siehe Konzept Abschnitt 8.

---

## Offene Vorhaben

### PWA – Offline-Huelle & Update-Hinweis

Konzept: `docs/Konzept-PWA-Offline.md`. In kleinen, einzeln testbaren Schritten.

- [x] Lieferung 1: Offline-Huelle (Service Worker, Precache der App-Shell, Supabase
  ausgenommen)
- [x] Lieferung 2: Update-Erkennung + Hinweis („Neue Version" + „Aktualisieren")
- [ ] Lieferung 3: „Was ist neu" (Changelog-Datei + Anzeige im Hinweis)
- [ ] Lieferung 4: Feinschliff (Optik, „nicht waehrend einer Einheit", Notbremse)

### Pflege / Bugfixing

Laufend, ergibt sich im Betrieb. Kein geplanter Block; einzelne Punkte werden hier
gefuehrt, sobald sie auftauchen.

- (noch keine offenen Punkte)

---

## Erledigt (Log)

Hier kommen abgeschlossene Bloecke mit Datum dazu.

- 2026-06-24 - PWA Lieferung 2 (Update-Erkennung + Hinweis): Beim App-Start registriert die
  App den Service Worker (Umstellung von `injectRegister: 'auto'` auf manuelle
  Registrierung) und erkennt eine wartende neue Huelle. Neue Bausteine: `src/lib/pwaUpdate.ts`
  (Registrierung + „neue Version wartet"-Signal als kleiner externer Store, DOM-frei, keine
  periodische Pruefung), Hook `src/hooks/useAppUpdate.ts` (liefert das Signal per
  `useSyncExternalStore` an die UI), darstellender Streifen
  `src/components/training/UpdateBanner.tsx` (Klar-Look wie JourneyStrip, „Neue Version
  verfuegbar" + Knopf „Aktualisieren"). Eingesetzt oben auf der Trainingsseite
  (`src/routes/index.tsx`), ueber Journey und Empfehlung; rendert nichts, solange kein Update
  wartet. „Aktualisieren" aktiviert die neue Huelle und laedt einmal neu. Entscheidung
  Pruef-Intervall (nur beim Start) ins Konzept Abschnitt 8 als getroffen uebernommen. Das
  Popup mit „Was ist neu" folgt in Lieferung 3; der Knopf wandert dann ins Popup. Validiert:
  tsc ohne Fehler, Build durch (SW weiter erzeugt, registerSW.js nicht mehr injiziert), 297
  Tests gruen. Betroffen: `vite.config.ts`, `src/vite-env.d.ts`, `src/main.tsx`,
  `src/routes/index.tsx`, neue Dateien wie oben, `docs/Konzept-PWA-Offline.md`.

- 2026-06-24 - PWA Lieferung 1 (Offline-Huelle): `vite-plugin-pwa` (Workbox) eingezogen und
  in `vite.config.ts` eingehaengt. Der beim Build erzeugte Service Worker vorcacht die
  App-Shell (index.html, JS-/CSS-Buendel, Icons, gebuendelte Schriften; 41 Eintraege,
  ~1 MB). `registerType: 'prompt'` (kein stilles Auto-Update, Update-UI folgt in Lieferung
  2), `injectRegister: 'auto'` (Registrierung automatisch in index.html), `manifest: false`
  (bestehendes `site.webmanifest` unberuehrt), `navigateFallback` auf die index.html unter
  der base fuer Deep-Links offline (koexistiert mit dem `dist/404.html`-Fallback des
  Deploys). Bewusst KEINE runtimeCaching-Regel: Supabase bleibt network-only, die
  Datenlogik allein bei der TanStack-Schicht. Validiert: tsc ohne Fehler, Build durch (SW
  erzeugt), 297 Tests gruen. Betroffen: `vite.config.ts`, `package.json`,
  `package-lock.json`. Deploy-Workflow unveraendert.

- 2026-06-24 - PWA-Konzept-Entscheidungen geklaert und in `docs/Konzept-PWA-Offline.md`
  eingepflegt: Update-Hinweis als Streifen oben auf der Trainingsseite, der ein Popup auf dem
  bestehenden `Overlay`-Primitive oeffnet (Desktop zentriert, Mobile Bodenblatt) mit
  scrollbarer „Was ist neu"-Liste und „Aktualisieren"-Knopf unten; Schliessen ueber
  X/Wegtippen, kein „Spaeter"-Knopf. Versionskennung im Schema `1.0.20` plus Datum, Vergabe
  durch den Coach. Abschnitt 8 von „offen" auf „getroffen + Restoffenes" umgestellt. Reine
  Doku, kein Code geaendert.

- 2026-06-24 - Designsystem-Dokument angelegt (`docs/Designsystem.md`): menschenlesbarer
  Ueberblick ueber die 25 UI-Primitives (wofuer/wann nehmen), Design-Tokens (Farben,
  Radien, Schatten) und die Feature-Ordner. Verweis im README und in den Quellen oben
  ergaenzt. Reine Doku, kein Code geaendert. Pflegeregel: bei neuen Primitives eine Zeile.
- 2026-06-24 - Einstellungen, Daten-Bereich neu gegliedert: aus dem losen Block „Daten"
  zwei Karten im Klar-Look gemacht - „Daten · Sicherung" (Export + Wiederherstellen) und
  „Daten · Coaching". Funktion unveraendert.
- 2026-06-24 - Loginscreen an den „Klar"-Look angepasst: Marken-Lockup (BrandMark im
  gruenen Kaestchen plus versaler Schriftzug) ueber weisser Karte auf der Canvas.
  Registrieren-Pfad entfernt (App nutzt ein bestehendes Konto, kein „Konto anlegen").
- 2026-06-24 - Neues Projekt „Betrieb & Weiterentwicklung" aufgesetzt. Migrationsverlauf
  nach `docs/archive/PLAN-Migration-V1-zu-V2.md` ausgelagert, schlanke neue PLAN.md
  gestartet. Migration V1->V2 gilt als abgeschlossen; aktueller Fokus ist die PWA.
