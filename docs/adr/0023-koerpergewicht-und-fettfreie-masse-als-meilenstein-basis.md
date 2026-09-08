# ADR-0023 – Dynamische Meilensteine rechnen gegen Körpergewicht und fettfreie Masse

**Status:** akzeptiert
**Datum:** 2026-09-08

## Kontext

Übungs-Meilensteine waren bis dahin feste Kilogramm. Das ist gut für runde Ziele
(„erste 100 kg Bankdrücken"), taugt aber nicht für die Meilensteine, an denen sich
Krafttraining tatsächlich orientiert: Die gängigen Kraftstandards (ExRx,
StrengthLevel, Rippetoe/NSCA) sind Vielfache des Körpergewichts – „einmal
Körpergewicht Kniebeuge" ist eine natürliche Grenze, kein fester Wert.

Ein Vielfaches braucht einen Bezugswert, und dafür gab es drei Kandidaten:

- **Gesamtkörpergewicht.** Der Bezug, auf den alle veröffentlichten Standards
  definiert sind. Verzerrt aber in der Diät: Wer abnimmt, erreicht ein Ziel, ohne
  stärker geworden zu sein, und im Aufbau läuft das Ziel davon.
- **Fettfreie Masse (Gewicht minus Körperfett).** Physikalisch ehrlicher, weil
  Fettgewebe keine Kraft erzeugt. Zwei 90-kg-Personen mit 10 % und 30 % Körperfett
  haben völlig unterschiedliche Voraussetzungen.
- **Skelettmuskelmasse (SMM).** Der Wert, den die BIA-Waage prominent ausgibt.

## Entscheidung

**Ein Meilenstein trägt seine Basis selbst** (`exercise_milestones.basis`,
Migration 0057): `fix`, `koerpergewicht` oder `ffm`. Die drei teilen sich denselben
Weg durch Anzeige, Fortschritt und Erreichen; unterschiedlich ist nur, woher der
Zielwert kommt.

**Standard beim Anlegen ist `koerpergewicht`.** Die Faktoren, die man aus der
Fitnesspraxis kennt (0,75 / 1,0 / 1,5), gelten dort ohne Umrechnung. Wer die
ehrlichere Basis will, wählt `ffm` – die Umrechnung ist einfach
(Faktor_FFM = Faktor_KG / (1 − Körperfettanteil)).

**SMM wird nicht als Basis angeboten.** Zwei Gründe: Die Skelettmuskelmasse ist nur
ein Teil der fettfreien Masse, und es gibt für sie keine veröffentlichten
Kraftstandards, an denen sich ein Faktor eichen ließe. Dazu ist sie in den Daten
lückenhaft (`skeletal_muscle_kg` in 7 von 10 Messungen gefüllt), während `weight`
und `body_fat_kg` vollständig sind. Eine Basis, die je nach Messung mal da ist und
mal nicht, taugt nicht als Bezugswert.

**Der Basiswert ist der Durchschnitt der letzten 30 Tage**, nicht die letzte
Messung. BIA-Waagen schwanken tagesabhängig (Wasser, Mahlzeit, Tageszeit) um ein
bis zwei Kilogramm. Mit dem Einzelwert würde ein Ziel bei jeder Messung springen,
ein Meilenstein könnte an einem Tag erreicht sein und am nächsten wieder offen.

**Ein erreichter Meilenstein rastet ein.** Beim Stempeln wandert der damals gültige
Zielwert in `achieved_target`. Ohne ihn würde ein erreichtes Ziel mit dem
Körpergewicht weiterwandern und den Erfolg rückwirkend verschieben.

**Ohne Messung im Fenster gibt es kein Ziel.** Der Meilenstein zeigt „wartet auf
Messung" und löst kein Erreichen aus. Ein geratener Basiswert wäre schlimmer als
keiner.

## Konsequenzen

- **Der Zielwert dynamischer Meilensteine wird nicht gespeichert.** Er entsteht bei
  jeder Anzeige neu in `meilensteinBasis.ts` aus Faktor und Basiswert. Damit gibt es
  keinen zweiten Stand, der veralten könnte – außer dem bewusst eingefrorenen
  `achieved_target`.
- **Der Zielwert wird auf halbe Kilogramm gerundet.** Sonst stünde in der Anzeige
  „89,7 kg" statt „90 kg", und das Ziel zitterte bei jeder Messung um Gramm-Beträge.
- **Wer keine Messungen pflegt, hat nur feste Meilensteine.** Das ist gewollt: Die
  dynamische Form ist eine Zugabe für den, der seine Körperdaten ohnehin führt.
- **Körper-Meilensteine (`composition_milestones`) bleiben statisch.** Ein
  Gewichtsziel relativ zum eigenen Gewicht ergibt keinen Sinn.
- **Eine weitere Basis ließe sich ergänzen**, ohne den Rest anzufassen: Basis ins
  Enum, Rechnung in `basisWerte`, Name in `BASIS_NAME`. Falls es für SMM je
  belastbare Standards gibt, ist der Weg offen.
