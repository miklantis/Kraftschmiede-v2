// Aufwaerm-Generator. Adaptive Rampe: Stufenzahl folgt der Spanne Stange->Arbeit
// (Zielsprung ~18-22 %), Endstufe ~85 % mit Puffer (mind. ein Ladeschritt unter
// Arbeit), Reps sinken mit der Last (Priming, keine Vorermuedung).
// isLift1 => kleinerer Sprung/mehr Stufen; isDeadlift => weniger Volumen.

import { plateGrid, round2 } from "./math";
import { nearestLoadable } from "./plates";
import type { EngineSet } from "./types";

export interface WarmupOpts {
  isLift1?: boolean;
  isDeadlift?: boolean;
}

export function generateWarmup(
  workWeight: number,
  barWeight: number,
  plates: number[],
  opts?: WarmupOpts,
): EngineSet[] {
  const o = opts ?? {};
  const isLift1 = !!o.isLift1;
  const isDeadlift = !!o.isDeadlift;
  const sets: EngineSet[] = [];
  if (!(workWeight > barWeight)) return sets; // Arbeit <= Stange: kein Aufwaermen
  const step = 2 * plateGrid(plates); // kleinster Ladeschritt (beide Seiten)
  const steps = step > 0 ? Math.round((workWeight - barWeight) / step) : 0;

  // 1) leere Stange – Bewegungsvorbereitung, niedrige Reps
  sets.push({ reps: 5, weight: barWeight, type: "warmup", done: false });
  if (steps <= 1) return sets; // winziger Abstand: Stange genuegt

  // 2) Endstufe ~85 % des Arbeitsgewichts, mind. einen Ladeschritt darunter
  let top = nearestLoadable(workWeight * 0.85, barWeight, plates, false);
  const maxTop = round2(workWeight - step);
  if (top > maxTop) top = maxTop;
  if (top <= barWeight) return sets; // kein Platz fuer Zwischenstufen

  // 3) Stufenzahl aus der Spanne: Zielsprung ~18 % (LIFT1, gruendlicher) bzw. 22 %
  const perStep = (isLift1 ? 0.18 : 0.22) * workWeight;
  const nMid = Math.max(1, Math.min(4, Math.round((top - barWeight) / perStep)));

  // 4) gleichmaessig zwischen Stange und Endstufe verteilen, Reps nach relativer Last
  for (let i = 1; i <= nMid; i++) {
    const tgt = barWeight + (top - barWeight) * (i / nMid);
    const ld = nearestLoadable(tgt, barWeight, plates, false);
    if (ld <= barWeight || ld >= workWeight) continue;
    const last = sets[sets.length - 1];
    if (last && Math.abs(last.weight - ld) < 1e-9) continue; // Dubletten vermeiden
    const p = ld / workWeight;
    let reps = p < 0.6 ? 5 : p < 0.75 ? 3 : 2;
    if (isDeadlift && reps > 3) reps = 3; // Deadlift: weniger Aufwaermvolumen
    sets.push({ reps, weight: ld, type: "warmup", done: false });
  }
  return sets;
}
