// 1RM-Schaetzung. Drei etablierte Formeln plus Mittelwert (Default).

import { round2 } from "./math";
import type { EngineSet, RmFormula } from "./types";

export function brzycki(w: number, r: number): number {
  return r >= 37 ? 0 : (w * 36) / (37 - r);
}

export function epley(w: number, r: number): number {
  return w * (1 + r / 30);
}

export function wathan(w: number, r: number): number {
  return (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r));
}

// Geschaetztes 1RM aus Gewicht und Wiederholungen. reps=1 ergibt das Gewicht selbst.
export function oneRM(w: number, r: number, formula?: RmFormula): number {
  if (!w || !r) return 0;
  if (r === 1) return w;
  switch (formula) {
    case "brzycki":
      return brzycki(w, r);
    case "epley":
      return epley(w, r);
    case "wathan":
      return wathan(w, r);
    default:
      return (brzycki(w, r) + epley(w, r) + wathan(w, r)) / 3; // Mittelwert
  }
}

export interface Best1RM {
  value: number | null;
  lowConfidence: boolean;
}

// Bestes 1RM aus sauberen Arbeitssaetzen (done, kein Aufwaermen, kein Versagen).
// lowConfidence, wenn der beste Satz aus hohen Wiederholungen (>10) stammt.
export function best1RMFromSets(sets: EngineSet[], formula?: RmFormula): Best1RM {
  let best = 0;
  let lowConf = false;
  (sets || []).forEach((s) => {
    if (s.type === "warmup" || !s.done || s.failed) return;
    const e = oneRM(s.weight, s.reps, formula);
    if (e > best) {
      best = e;
      lowConf = s.reps > 10;
    }
  });
  return { value: best ? round2(best) : null, lowConfidence: lowConf };
}
