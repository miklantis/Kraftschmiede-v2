// Bearbeiten einer abgeschlossenen Kraft-Einheit: verdichtet den Bearbeiten-
// Entwurf (Dauer + korrigierte Arbeitssaetze je Uebung) zu den Schreib-Anweisungen
// fuer die normalisierte DB. Reine, von Supabase und DOM unabhaengige Logik –
// dieselbe Trennung wie liveFinish.ts beim Beenden, nur fuer die nachtraegliche
// Korrektur.
//
// Bewusst id-arm: je Uebung werden die ARBEITSSAETZE komplett neu geschrieben
// (alte work-Saetze loeschen, Entwurf neu anlegen). Aufwaermsaetze bleiben
// unberuehrt – sie werden hier nicht angefasst. So braucht der Aufrufer nur die
// session_exercise-ID, keine einzelnen Satz-IDs, und „geaendert/neu/entfernt“
// ergibt sich aus dem Nettostand des Entwurfs.
//
// Coach-Nachziehen folgt der „nur juengste“-Regel: nur wenn die bearbeitete
// Einheit die juengste mit dieser Uebung ist, wird der Katalog (Arbeitsgewicht,
// 1RM) fortgeschrieben; sonst bleibt die laufende Empfehlung stehen.

import { best1RMFromSets } from "@/engine/oneRM";
import { metTarget } from "@/engine/target";
import { skillSetMet } from "@/engine/skills";
import type { EngineSet, RmFormula } from "@/engine/types";
import type { SetInsert } from "@/schemas";
import type { ExercisePatch } from "./finishMutation";

/** Ein Arbeitssatz im Bearbeiten-Entwurf. target* tragen den geplanten Wert
 *  (bei neuen Saetzen = der Wert selbst), damit „Ziel erreicht“ stabil bleibt. */
export interface EditDraftSet {
  reps: number;
  weight: number;
  score: number;
  targetReps: number;
  targetWeight: number;
  adjusted: boolean;
  adjustNote: string;
}

/** Eine Uebung des Entwurfs samt ihrer korrigierten Arbeitssaetze. */
export interface EditDraftExercise {
  /** ID der Zeile in session_exercises (zum Neuschreiben der work-Saetze). */
  sessionExerciseId: string;
  /** Katalog-Bezug (fuer das Coach-Nachziehen); null bei katalogfreier Uebung. */
  exerciseId: string | null;
  sets: EditDraftSet[];
}

export interface EditContext {
  sessionId: string;
  /** Neue Dauer in Sekunden (Minuten * 60); null laesst sie unveraendert. */
  durationSec: number | null;
  userId: string;
  rmFormula: RmFormula;
  exercises: EditDraftExercise[];
  /** Ist die bearbeitete Einheit die juengste mit dieser Uebung? Steuert das
   *  Coach-Nachziehen (true = Katalog fortschreiben). */
  isYoungest: (exerciseId: string) => boolean;
  /** Trackt die Uebung ein 1RM (alles ausser reinem Koerpergewicht)? */
  tracksRm: (exerciseId: string) => boolean;
  /** Datum der Einheit (ISO) – fuer rm_as_of beim Fortschreiben. */
  date: string;
  /** ID-Erzeuger (Default crypto.randomUUID); injizierbar fuer Tests. */
  newId: () => string;
}

/** Schreib-Anweisung je Uebung: alte work-Saetze ersetzen, tested_1rm setzen. */
export interface EditExerciseWrite {
  sessionExerciseId: string;
  tested1RM: number | null;
  workSetRows: Array<SetInsert & { id: string }>;
}

/** Fertiges Schreib-Paket der Bearbeitung (alle IDs vergeben). */
export interface EditPayload {
  sessionId: string;
  durationSec: number | null;
  /** Yoga: Minuten der Einheit (sessions.minutes). undefined = nicht anfassen. */
  minutes?: number | null;
  /** Yoga: Notiz (sessions.notes). undefined = nicht anfassen. */
  notes?: string;
  exercises: EditExerciseWrite[];
  exercisePatches: ExercisePatch[];
}

function toEngineWork(s: EditDraftSet): EngineSet {
  return {
    type: "work",
    done: true,
    failed: false,
    weight: s.weight,
    reps: s.reps,
    targetReps: s.targetReps,
    targetWeight: s.targetWeight,
    adjusted: s.adjusted,
  };
}

export function buildEditPayload(ctx: EditContext): EditPayload {
  const { userId, rmFormula, date, newId } = ctx;

  const exercises: EditExerciseWrite[] = [];
  const exercisePatches: ExercisePatch[] = [];

  ctx.exercises.forEach((ex) => {
    const engine = ex.sets.map(toEngineWork);
    const est1RM = best1RMFromSets(engine, rmFormula).value;

    let pos = 0;
    const workSetRows: Array<SetInsert & { id: string }> = ex.sets.map((s) => ({
      id: newId(),
      user_id: userId,
      session_exercise_id: ex.sessionExerciseId,
      kind: "work",
      position: pos++,
      reps: s.reps,
      weight: s.weight,
      duration_sec: null,
      score: s.score,
      failed: false,
      done: true,
      target_reps: s.targetReps,
      target_weight: s.targetWeight,
      target_score: null,
      adjusted: s.adjusted,
      adjust_note: s.adjustNote,
      met: metTarget(toEngineWork(s)),
    }));

    exercises.push({
      sessionExerciseId: ex.sessionExerciseId,
      tested1RM: est1RM,
      workSetRows,
    });

    // Coach nur bei der juengsten Einheit dieser Uebung fortschreiben.
    if (ex.exerciseId && ex.sets.length > 0 && ctx.isYoungest(ex.exerciseId)) {
      const workWeight = Math.max(...ex.sets.map((s) => s.weight));
      const patch: ExercisePatch = { id: ex.exerciseId, work_weight: workWeight };
      if (est1RM != null && ctx.tracksRm(ex.exerciseId)) {
        patch.rm = est1RM;
        patch.rm_as_of = date;
        patch.rm_stale = false;
      }
      exercisePatches.push(patch);
    }
  });

  return {
    sessionId: ctx.sessionId,
    durationSec: ctx.durationSec,
    exercises,
    exercisePatches,
  };
}

// ---- Skill-Bearbeiten (Bauschritt 2b) --------------------------------------
// Skill-Einheiten werden ohne Coach/Katalog korrigiert: je Uebung die work-
// Saetze neu schreiben (Wert in reps bzw. duration_sec je Metrik), met gegen das
// Phasen-Ziel neu bestimmen. Der Phasen-Fortschritt (skill_progress) bleibt
// bewusst unberuehrt - eine Korrektur soll dich nicht in der Phase verschieben.

/** Eine Skill-Uebung im Bearbeiten-Entwurf: Ergebniswerte je Satz. */
export interface SkillEditDraftExercise {
  sessionExerciseId: string;
  metric: "reps" | "duration";
  /** Phasen-Ziel (fuer met und Anzeige). */
  target: number;
  /** Ergebniswert je Satz (Wdh bzw. Sekunden). */
  values: number[];
}

export interface SkillEditContext {
  sessionId: string;
  durationSec: number | null;
  userId: string;
  exercises: SkillEditDraftExercise[];
  newId: () => string;
}

export function buildSkillEditPayload(ctx: SkillEditContext): EditPayload {
  const { userId, newId } = ctx;

  const exercises: EditExerciseWrite[] = ctx.exercises.map((ex) => {
    let pos = 0;
    const workSetRows: Array<SetInsert & { id: string }> = ex.values.map((v) => ({
      id: newId(),
      user_id: userId,
      session_exercise_id: ex.sessionExerciseId,
      kind: "work",
      position: pos++,
      reps: ex.metric === "reps" ? v : null,
      weight: null,
      duration_sec: ex.metric === "duration" ? v : null,
      score: null,
      failed: false,
      done: true,
      target_reps: ex.metric === "reps" ? ex.target : null,
      target_weight: null,
      target_score: null,
      adjusted: false,
      adjust_note: "",
      met: skillSetMet(ex.metric, ex.target, { value: v, done: true }),
    }));
    return {
      sessionExerciseId: ex.sessionExerciseId,
      tested1RM: null, // Skill trackt kein 1RM
      workSetRows,
    };
  });

  return {
    sessionId: ctx.sessionId,
    durationSec: ctx.durationSec,
    exercises,
    exercisePatches: [], // kein Coach/Katalog bei Skill
  };
}

// ---- Yoga-Bearbeiten (Bauschritt 2c) ---------------------------------------
// Yoga hat keinen Satz-Block: nur die Minuten der Einheit (sessions.minutes) und
// eine Notiz (sessions.notes). Kein Coach/Katalog, keine Saetze.

export interface YogaEditContext {
  sessionId: string;
  minutes: number;
  notes: string;
}

export function buildYogaEditPayload(ctx: YogaEditContext): EditPayload {
  return {
    sessionId: ctx.sessionId,
    durationSec: null, // Yoga nutzt minutes, nicht duration_sec
    minutes: ctx.minutes,
    notes: ctx.notes,
    exercises: [],
    exercisePatches: [],
  };
}
