// Abschnitt – Uebungs-Meilensteine. Spiegelt exercise_milestones 1:1.

import { z } from "zod";
import { uuid, isoDate, isoTimestamp } from "./shared";

// Bezugswert eines Uebungs-Meilensteins (Migration 0057). "fix" ist das feste
// Ziel in kg wie bisher; die beiden anderen sind dynamisch und rechnen den
// Zielwert als Faktor mal Koerperwert. "ffm" ist die fettfreie Masse, also
// Gewicht minus Koerperfett – nicht die Skelettmuskelmasse.
export const meilensteinBasisEnum = z.enum(["fix", "koerpergewicht", "ffm"]);
export type MeilensteinBasis = z.infer<typeof meilensteinBasisEnum>;

// exercise_milestones – pro Uebung angelegte Meilensteine. Entweder ein festes
// Ziel-1RM in kg (basis "fix", target_rm gesetzt) oder ein Faktor auf einen
// Koerperwert (basis "koerpergewicht"/"ffm", faktor gesetzt); der CHECK dazu
// sitzt in der DB. achieved_at wird gesetzt, sobald das geschaetzte 1RM der
// Uebung (exercises.rm) das Ziel erreicht; null = noch offen. achieved_target
// haelt dabei den damals gueltigen Zielwert fest, damit ein erreichter
// dynamischer Meilenstein nicht spaeter mit dem Koerpergewicht weiterwandert.
export const exerciseMilestoneRow = z.object({
  id: uuid,
  user_id: uuid,
  exercise_id: uuid,
  name: z.string(),
  basis: meilensteinBasisEnum,
  target_rm: z.number().nullable(),
  faktor: z.number().nullable(),
  achieved_at: isoDate.nullable(),
  achieved_target: z.number().nullable(),
  created_at: isoTimestamp,
  position: z.number().int(),
});
export type ExerciseMilestoneRow = z.infer<typeof exerciseMilestoneRow>;

export const exerciseMilestoneInsert = exerciseMilestoneRow
  .omit({ id: true, created_at: true })
  .partial({
    position: true,
    achieved_at: true,
    achieved_target: true,
    target_rm: true,
    faktor: true,
  });
export type ExerciseMilestoneInsert = z.infer<typeof exerciseMilestoneInsert>;

// composition_milestones – pro Mess-Metrik angelegte Meilensteine (Name +
// Zielwert). Reine Richtwerte: kein Erreicht-Datum, keine Richtung. metric ist
// einer der fuenf Chart-Metrik-Schluessel (weight/fat/muscle/water/phase); der
// CHECK dazu sitzt in der DB (Migration 0012).
export const compositionMilestoneRow = z.object({
  id: uuid,
  user_id: uuid,
  metric: z.string(),
  name: z.string(),
  target: z.number(),
  created_at: isoTimestamp,
  position: z.number().int(),
});
export type CompositionMilestoneRow = z.infer<typeof compositionMilestoneRow>;

export const compositionMilestoneInsert = compositionMilestoneRow
  .omit({ id: true, created_at: true })
  .partial({ position: true });
export type CompositionMilestoneInsert = z.infer<typeof compositionMilestoneInsert>;
