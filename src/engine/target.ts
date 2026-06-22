// Soll-Ist-Bewertung einzelner Saetze und ganzer Eintraege.

import type { EngineSet, SetEntry } from "./types";

// Hat ein Arbeitssatz sein Ziel erfuellt?
// Ziel = Zielwiederholungen erreicht UND Gewicht nicht reduziert UND nicht
// vorzeitig versagt. Aufwaermsaetze und Saetze ohne Ziel ergeben null.
export function metTarget(set: EngineSet): boolean | null {
  if (set.type === "warmup") return null;
  const tr = set.targetReps;
  const tw = set.targetWeight;
  if (tr == null || tw == null) return null;
  const reachedReps = set.reps >= tr;
  const notReduced = set.weight >= tw - 1e-9;
  const notFailedEarly = !(set.failed && set.reps < tr);
  return reachedReps && notReduced && notFailedEarly;
}

// Gab es in den Arbeitssaetzen eine Abweichung (Ziel verfehlt oder angepasst)?
export function hadDeviation(workSets: EngineSet[]): boolean {
  return (workSets || []).some((s) => {
    const mt = metTarget(s);
    return mt === false || s.adjusted === true;
  });
}

// Arbeitssaetze eines Eintrags (Aufwaermen herausgefiltert).
export function workSets(entry: SetEntry | null | undefined): EngineSet[] {
  if (!entry || !entry.sets) return [];
  return entry.sets.filter((s) => s.type !== "warmup");
}
