// Abschnitt 8 (Teil) – Skill-Fortschritt. Spiegelt skill_progress.

import { z } from "zod";
import { skillLogSchema, uuid } from "./shared";

// skill_progress – Fortschritt je Skill. counter = Konsekutiv-Zaehler
// (Reset bei Fehlversuch). log = kurze Versuchshistorie.
export const skillProgressRow = z.object({
  id: uuid,
  user_id: uuid,
  skill_id: uuid,
  active: z.boolean(),
  current_phase: z.number().int(),
  counter: z.number().int(),
  mastered: z.boolean(),
  log: skillLogSchema,
});
export type SkillProgressRow = z.infer<typeof skillProgressRow>;

export const skillProgressInsert = skillProgressRow
  .omit({ id: true })
  .partial({
    active: true,
    current_phase: true,
    counter: true,
    mastered: true,
    log: true,
  });
export type SkillProgressInsert = z.infer<typeof skillProgressInsert>;
