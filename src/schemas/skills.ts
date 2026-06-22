// Abschnitt 5 – Skills (Definitionen als Seed in der DB; Fortschritt separat in
// skill_progress). Spiegelt skills, skill_phases, skill_phase_exercises,
// skill_phase_equipment.

import { z } from "zod";
import { metricEnum, uuid } from "./shared";

// skills – Skill-Definition (Kopf).
export const skillRow = z.object({
  id: uuid,
  user_id: uuid,
  key: z.string().nullable(),
  name: z.string(),
  category: z.string().nullable(),
  image: z.string().nullable(),
  position: z.number().int(),
});
export type SkillRow = z.infer<typeof skillRow>;

export const skillInsert = skillRow
  .omit({ id: true })
  .partial({ key: true, category: true, image: true, position: true });
export type SkillInsert = z.infer<typeof skillInsert>;

// skill_phases – Stufe eines Skills. consecutive_sessions = Anzahl
// aufeinanderfolgender Erfolge fuer den Aufstieg (Reset bei Fehlversuch).
export const skillPhaseRow = z.object({
  id: uuid,
  user_id: uuid,
  skill_id: uuid,
  label: z.string(),
  description: z.string(),
  consecutive_sessions: z.number().int(),
  position: z.number().int(),
});
export type SkillPhaseRow = z.infer<typeof skillPhaseRow>;

export const skillPhaseInsert = skillPhaseRow
  .omit({ id: true })
  .partial({ description: true, consecutive_sessions: true, position: true });
export type SkillPhaseInsert = z.infer<typeof skillPhaseInsert>;

// skill_phase_exercises – Uebung einer Skill-Phase. exercise_id verknuepft
// optional mit dem Uebungskatalog (fuer den Verlauf).
export const skillPhaseExerciseRow = z.object({
  id: uuid,
  user_id: uuid,
  skill_phase_id: uuid,
  name: z.string(),
  metric: metricEnum,
  sets: z.number().int(),
  target: z.number().int(),
  tempo: z.string().nullable(),
  exercise_id: uuid.nullable(),
  position: z.number().int(),
});
export type SkillPhaseExerciseRow = z.infer<typeof skillPhaseExerciseRow>;

export const skillPhaseExerciseInsert = skillPhaseExerciseRow
  .omit({ id: true })
  .partial({
    metric: true,
    sets: true,
    tempo: true,
    exercise_id: true,
    position: true,
  });
export type SkillPhaseExerciseInsert = z.infer<typeof skillPhaseExerciseInsert>;

// skill_phase_equipment – Equipment-Voraussetzung einer Skill-Phase
// (verweist per key auf inventory_equipment).
export const skillPhaseEquipmentRow = z.object({
  id: uuid,
  user_id: uuid,
  skill_phase_id: uuid,
  equipment_key: z.string(),
});
export type SkillPhaseEquipmentRow = z.infer<typeof skillPhaseEquipmentRow>;

export const skillPhaseEquipmentInsert = skillPhaseEquipmentRow.omit({
  id: true,
});
export type SkillPhaseEquipmentInsert = z.infer<
  typeof skillPhaseEquipmentInsert
>;
