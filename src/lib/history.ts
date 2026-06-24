// Reine Aufbereitung des Trainingsverlaufs (kein DB-/DOM-Bezug, testbar) – die
// Logik ist 1:1 aus V1 (history.js) uebernommen, nur auf das normalisierte
// Schema (sessions / session_exercises / sets) umgestellt.
//
// In V1 lag eine Einheit als verschachtelter Blob vor (entries[].sets[],
// skillWork.exercises[].sets[], yoga minutes/notes). Hier kommt sie als flache
// Zeilen-Struktur herein: jede Einheit traegt ihre Uebungen, jede Uebung ihre
// Saetze. Daraus entstehen vier Anzeige-Dinge je Einheit: die Typ-Klasse (fuer
// Farbpunkt/Tag), ein Titel, ein kurzes Kalender-Label und – aufgeklappt – die
// Dauer plus eine Zeile je Uebung.

import { fmtKg, longDateShort } from "./format";

// Eine Einheit, wie sie der Verlauf braucht (aus sessions + verschachtelten
// session_exercises + sets zusammengezogen).
export interface HistorySet {
  kind: "warmup" | "work";
  reps: number | null;
  weight: number | null;
  durationSec: number | null;
  adjusted: boolean;
  score?: number | null;
  done?: boolean;
  failed?: boolean;
  met?: boolean | null;
  // Geplante Zielwerte (fuer den Coach-Vorschlag der naechsten Einheit).
  targetReps?: number | null;
  targetWeight?: number | null;
}

export interface HistoryExercise {
  exerciseId: string | null;
  name: string | null;
  metric: "reps" | "duration" | null;
  position: number;
  sets: HistorySet[];
  tested1RM?: number | null;
}

export interface HistorySessionInput {
  id: string;
  date: string;
  type: "strength" | "yoga" | "skill";
  templateId: string | null;
  skillId: string | null;
  skillPhase: number | null;
  durationSec: number | null;
  minutes: number | null;
  notes: string;
  exercises: HistoryExercise[];
}

// Nachschlage-Tabellen fuer Anzeigenamen (Domaenensprache deutsch).
export interface HistoryLookups {
  exerciseName: (id: string) => string | undefined;
  templateName: (id: string) => string | undefined;
  skillName: (id: string) => string | undefined;
}

export type HistoryKind = "kraft" | "skill" | "yoga" | "dev";

export interface DetailRow {
  label: string;
  info: string;
}

// Anzeigefertige Einheit fuer die Liste.
export interface HistorySession {
  id: string;
  date: string; // ISO, fuer Sortierung/Kalender
  kind: HistoryKind;
  title: string;
  dateLabel: string; // "Mo., 22. Juni"
  durationLabel: string; // "45 min" oder ""
  detail: DetailRow[];
}

// Ein Punkt im Kalender (Typklasse + kurzes Label).
export interface CalEntry {
  kind: HistoryKind;
  label: string;
}

export interface HistoryModel {
  // Neueste zuerst (fuer die Liste).
  sessions: HistorySession[];
  // Datum -> Punkte (fuer den Kalender).
  byDate: Record<string, CalEntry[]>;
}

// --- Klassifikation -------------------------------------------------------

// In V1 markierte der Coach Abweichungen pro Eintrag (entry.hadDeviation). Im
// neuen Schema steckt das Signal am Satz (adjusted = vom Vorschlag abgewichen).
function hadDeviation(s: HistorySessionInput): boolean {
  return s.exercises.some((e) => e.sets.some((set) => set.adjusted));
}

export function kindOf(s: HistorySessionInput): HistoryKind {
  if (s.type === "yoga") return "yoga";
  if (s.type === "skill") return "skill";
  if (hadDeviation(s)) return "dev";
  return "kraft";
}

export function tagLabel(s: HistorySessionInput): string {
  if (s.type === "yoga") return "Yoga";
  if (s.type === "skill") return "Skill";
  if (hadDeviation(s)) return "Abweichung";
  return "Kraft";
}

// Kurzes Label fuer den Kalenderpunkt: Skill-/Workout-Name bzw. "Yoga".
export function calLabel(s: HistorySessionInput, lk: HistoryLookups): string {
  if (s.type === "yoga") return "Yoga";
  if (s.type === "skill")
    return (s.skillId && lk.skillName(s.skillId)) || "Skill";
  return (s.templateId && lk.templateName(s.templateId)) || "•";
}

export function sessionTitle(
  s: HistorySessionInput,
  lk: HistoryLookups,
): string {
  if (s.type === "yoga") return "Yoga / Mobility";
  if (s.type === "skill")
    return (s.skillId && lk.skillName(s.skillId)) || "Skill";
  const name = s.templateId && lk.templateName(s.templateId);
  return "Workout " + (name || "?");
}

// --- Detail-Aufbereitung --------------------------------------------------

function workSets(ex: HistoryExercise): HistorySet[] {
  return ex.sets.filter((set) => set.kind !== "warmup");
}

// Score-Anhang einer Satz-Angabe, z. B. " · S3" (nur wenn ein Score vorliegt;
// Skill-/Yoga-Saetze haben keinen, dort entfaellt er).
function scoreTag(s: HistorySet): string {
  return s.score != null ? " · S" + s.score : "";
}

// Kraft-Zeile: jeder Arbeitssatz einzeln als "<Wdh> × <kg> kg · S<score>",
// Saetze per Komma getrennt (Aufwaermsaetze ausgenommen). Ohne Gewicht
// (Eigengewichts-Uebung) nur "<Wdh> Wdh".
function strengthInfo(ex: HistoryExercise): string {
  const parts = workSets(ex)
    .filter((s) => s.reps != null || s.weight != null)
    .map((s) => {
      const reps = s.reps ?? 0;
      const w = s.weight ?? 0;
      const base = w > 0 ? reps + " × " + fmtKg(w) + " kg" : reps + " Wdh";
      return base + scoreTag(s);
    });
  return parts.length ? parts.join(", ") : "–";
}

// Skill-Zeile: jeder Arbeitssatz einzeln, je nach Metrik Haltezeit ("12 s")
// oder Wiederholungen ("8 Wdh"), Score angehaengt wenn vorhanden, Saetze per
// Komma getrennt.
function skillInfo(ex: HistoryExercise): string {
  const ws = workSets(ex);
  if (ex.metric === "duration") {
    const parts = ws
      .filter((s) => s.durationSec != null)
      .map((s) => s.durationSec + " s" + scoreTag(s));
    return parts.length ? parts.join(", ") : "–";
  }
  const parts = ws
    .filter((s) => s.reps != null)
    .map((s) => s.reps + " Wdh" + scoreTag(s));
  return parts.length ? parts.join(", ") : "–";
}

function durationLabel(s: HistorySessionInput): string {
  if (s.type === "yoga") return s.minutes ? s.minutes + " min" : "";
  return s.durationSec ? Math.round(s.durationSec / 60) + " min" : "";
}

function detailRows(s: HistorySessionInput, lk: HistoryLookups): DetailRow[] {
  if (s.type === "yoga") {
    return s.notes ? [{ label: "Notiz", info: s.notes }] : [];
  }
  const sorted = s.exercises.slice().sort((a, b) => a.position - b.position);
  if (s.type === "skill") {
    return sorted.map((ex) => ({
      label: ex.name || "Skill",
      info: skillInfo(ex),
    }));
  }
  return sorted.map((ex) => ({
    label:
      (ex.exerciseId && lk.exerciseName(ex.exerciseId)) ||
      ex.name ||
      ex.exerciseId ||
      "Übung",
    info: strengthInfo(ex),
  }));
}

// --- Modellaufbau ---------------------------------------------------------

export function buildHistorySession(
  s: HistorySessionInput,
  lk: HistoryLookups,
): HistorySession {
  return {
    id: s.id,
    date: s.date,
    kind: kindOf(s),
    title: sessionTitle(s, lk),
    dateLabel: longDateShort(s.date),
    durationLabel: durationLabel(s),
    detail: detailRows(s, lk),
  };
}

export function buildHistoryModel(
  sessions: HistorySessionInput[],
  lk: HistoryLookups,
): HistoryModel {
  // Aelteste zuerst hereingereicht; Liste zeigt neueste zuerst.
  const ordered = sessions
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const byDate: Record<string, CalEntry[]> = {};
  ordered.forEach((s) => {
    (byDate[s.date] = byDate[s.date] || []).push({
      kind: kindOf(s),
      label: calLabel(s, lk),
    });
  });

  const list = ordered.map((s) => buildHistorySession(s, lk)).reverse();

  return { sessions: list, byDate };
}
