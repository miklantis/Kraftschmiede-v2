// Schreibt eine beendete Kraft-Einheit normalisiert in den Verlauf und frischt
// die betroffenen Ansichten auf. Als Mutation mit registriertem Default, damit
// ein ohne Netz pausierter Speichervorgang den App-Neustart uebersteht und nach
// dem Wiederherstellen automatisch nachgeschickt wird (resumePausedMutations in
// main.tsx). Der Default wird beim Erzeugen des Query-Clients registriert, also
// bevor die Wiederherstellung laeuft.

import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  SessionInsert,
  SessionExerciseInsert,
  SetInsert,
} from "@/schemas";

export const FINISH_MUTATION_KEY = ["finishSession"] as const;

/** Fertig berechnetes Schreib-Paket (alle IDs schon vergeben). Wird als
 *  Mutations-Variable uebergeben, damit die Mutation auch nach einem Neustart
 *  ohne den urspruenglichen React-Zustand allein laufen kann. */
export interface FinishPayload {
  sessionRow: SessionInsert & { id: string };
  exerciseRows: Array<SessionExerciseInsert & { id: string }>;
  setRows: Array<SetInsert & { id: string }>;
  exercisePatches: ExercisePatch[];
}

export interface ExercisePatch {
  id: string;
  work_weight: number;
  rm?: number;
  rm_as_of?: string;
  rm_stale?: boolean;
}

async function writeFinish(payload: FinishPayload): Promise<void> {
  const { sessionRow, exerciseRows, setRows, exercisePatches } = payload;

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

  // Katalog fortschreiben: naechstes Arbeitsgewicht (und 1RM, falls vom Hook
  // bestimmt). Wenige Uebungen je Einheit - einfache Schleife genuegt.
  for (const p of exercisePatches) {
    const patch: Record<string, unknown> = { work_weight: p.work_weight };
    if (p.rm != null) {
      patch.rm = p.rm;
      patch.rm_as_of = p.rm_as_of;
      patch.rm_stale = false;
    }
    const u = await supabase.from("exercises").update(patch).eq("id", p.id);
    if (u.error) throw new Error(u.error.message);
  }
}

/** Default-mutationFn + Auffrischung registrieren. Greift auch fuer nach einem
 *  Neustart fortgesetzte (pausierte) Mutationen, da die onSuccess hier haengt. */
export function registerFinishMutation(qc: QueryClient): void {
  qc.setMutationDefaults(FINISH_MUTATION_KEY, {
    mutationFn: (vars: unknown) => writeFinish(vars as FinishPayload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sessions"] });
      void qc.invalidateQueries({ queryKey: ["sessions-detailed"] });
      void qc.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}
