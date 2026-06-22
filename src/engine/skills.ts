// Skills als reine Funktionen, ohne DB-Kenntnis. Bewerten einzelne Saetze, das
// Ergebnis einer ganzen Skill-Session und beraten zu Phase, Equipment, Aufstieg.

import type {
  SkillDef,
  SkillMetric,
  SkillPhase,
  SkillPhaseExercise,
  SkillProgress,
  SkillSessionResult,
  SkillSet,
  SkillWorkExercise,
} from "./types";

// Erfuellt EIN Satz sein Ziel? Kapselt das Urteil je Metrik (erweiterbare Naht).
export function skillSetMet(
  metric: SkillMetric | undefined,
  target: number | undefined,
  set: SkillSet | null | undefined,
): boolean {
  if (!set || !set.done) return false;
  switch (metric) {
    case "reps":
    case "duration":
      return Number(set.value) >= Number(target);
    default:
      return false; // unbekannte Metrik: defensiv nicht erfuellt
  }
}

// Wie ist die Skill-Session ausgegangen? Bewertet ALLE Uebungen der Phase.
//   "skipped"   : kein Satz in keiner Uebung done
//   "completed" : alle geplanten Saetze ALLER Uebungen done und im Ziel
//   "missed"    : versucht (>=1 Satz done), aber nicht alles erfuellt
export function skillSessionResult(
  phaseExercises: SkillPhaseExercise[],
  workExercises: SkillWorkExercise[],
): SkillSessionResult {
  const phases = phaseExercises || [];
  const work = workExercises || [];
  let anyDone = false;
  let allComplete = true;
  for (let i = 0; i < phases.length; i++) {
    const pe: SkillPhaseExercise = phases[i] || {};
    const we: SkillWorkExercise = work[i] || {};
    const sets = we.sets || [];
    const planned = pe.sets || 0;
    const done = sets.filter((s) => s && s.done);
    if (done.length) anyDone = true;
    const met = done.filter((s) => skillSetMet(pe.metric, pe.target, s)).length;
    if (!(done.length === planned && met === planned)) allComplete = false;
  }
  if (!anyDone) return "skipped";
  return allComplete ? "completed" : "missed";
}

export interface SkillAdvice {
  phase: SkillPhase | null;
  phaseIndex: number;
  exercises: SkillPhaseExercise[];
  equipmentMissing: boolean;
  missingEquipment: string[];
  readyToAdvance: boolean;
  mastered: boolean;
}

// Beratung fuer einen Skill (rein, ohne DB). Auch fuer das Auswahl-Tor.
// ownedEquipmentIds: IDs der aktiven Geraete. missingEquipment liefert IDs.
export function skillAdvice(
  skillDef: SkillDef | null | undefined,
  progress: SkillProgress | null | undefined,
  ownedEquipmentIds?: string[],
): SkillAdvice {
  const phases = (skillDef && skillDef.phases) || [];
  const prog = progress || {};
  const owned = ownedEquipmentIds || [];
  const idx = Math.max(0, Math.min(prog.currentPhase || 0, phases.length - 1));
  const phase = phases[idx] || null;
  const req = (phase && phase.equipment) || [];
  const missing = req.filter((id) => owned.indexOf(id) < 0);
  const consec = prog.consecutiveCount || 0;
  const need = (phase && phase.consecutiveSessions) || 0;
  const mastered = !!prog.mastered;
  return {
    phase,
    phaseIndex: idx,
    exercises: (phase && phase.exercises) || [],
    equipmentMissing: missing.length > 0,
    missingEquipment: missing,
    readyToAdvance: !mastered && need > 0 && consec + 1 >= need,
    mastered,
  };
}
