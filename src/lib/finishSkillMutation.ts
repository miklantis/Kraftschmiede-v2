// Schreibt eine beendete Skill-Einheit normalisiert in den Verlauf und schreibt
// den Skill-Fortschritt fort. Wie die Kraft-Mutation (finishMutation) als
// Mutation mit registriertem Default, damit ein ohne Netz pausierter
// Speichervorgang den App-Neustart uebersteht und automatisch nachgeschickt
// wird (resumePausedMutations in main.tsx).

import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  SessionInsert,
  SessionExerciseInsert,
  SetInsert,
} from "@/schemas";

export const FINISH_SKILL_MUTATION_KEY = ["finishSkill"] as const;

/** Fortschritts-Update der skill_progress-Zeile (id schon bekannt). Null, wenn
 *  keine Zeile existiert (sollte bei aktivem Skill nicht vorkommen). */
export interface SkillProgressWrite {
  id: string;
  currentPhase: number;
  consecutiveCount: number;
  mastered: boolean;
}

export interface FinishSkillPayload {
  sessionRow: SessionInsert & { id: string };
  exerciseRows: Array<SessionExerciseInsert & { id: string }>;
  setRows: Array<SetInsert & { id: string }>;
  progressWrite: SkillProgressWrite | null;
}

async function writeFinishSkill(payload: FinishSkillPayload): Promise<void> {
  const { sessionRow, exerciseRows, setRows, progressWrite } = payload;

  const s = await supabase.from("sessions").insert(sessionRow);
  if (s.error) throw new Error(s.error.message);

  if (exerciseRows.length) {
    const e = await supabase.from("session_exercises").insert(exerciseRows);
    if (e.error) throw new Error(e.error.message);
  }
  if (setRows.length) {
    const r = await supabase.from("sets").insert(setRows);
    if (r.error) throw new Error(r.error.message);
  }

  if (progressWrite) {
    const u = await supabase
      .from("skill_progress")
      .update({
        current_phase: progressWrite.currentPhase,
        counter: progressWrite.consecutiveCount,
        mastered: progressWrite.mastered,
      })
      .eq("id", progressWrite.id);
    if (u.error) throw new Error(u.error.message);
  }
}

/** Default-mutationFn + Auffrischung registrieren. Greift auch fuer nach einem
 *  Neustart fortgesetzte (pausierte) Mutationen. */
export function registerFinishSkillMutation(qc: QueryClient): void {
  qc.setMutationDefaults(FINISH_SKILL_MUTATION_KEY, {
    mutationFn: (vars: unknown) => writeFinishSkill(vars as FinishSkillPayload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sessions"] });
      void qc.invalidateQueries({ queryKey: ["sessions-detailed"] });
      void qc.invalidateQueries({ queryKey: ["skillProgress"] });
      void qc.invalidateQueries({ queryKey: ["trainingOverview"] });
    },
  });
}
