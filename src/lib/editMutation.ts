// Schreibt eine bearbeitete Kraft-Einheit normalisiert zurueck und frischt die
// betroffenen Ansichten auf. Als Mutation mit registriertem Default – analog zu
// finishMutation.ts –, damit eine ohne Netz pausierte Korrektur den App-Neustart
// uebersteht und nach dem Wiederherstellen automatisch nachgeschickt wird
// (resumePausedMutations in main.tsx). Der Default wird beim Erzeugen des
// Query-Clients registriert, also bevor die Wiederherstellung laeuft.

import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EditPayload } from "./editSession";

export const EDIT_MUTATION_KEY = ["editSession"] as const;

async function writeEdit(payload: EditPayload): Promise<void> {
  const { sessionId, durationSec, minutes, notes, exercises, exercisePatches } =
    payload;

  // Einheit-Felder aktualisieren: Dauer (Kraft/Skill) bzw. Minuten + Notiz
  // (Yoga). Nur gesetzte Felder anfassen.
  const sessionPatch: Record<string, unknown> = {};
  if (durationSec != null) sessionPatch.duration_sec = durationSec;
  if (minutes !== undefined) sessionPatch.minutes = minutes;
  if (notes !== undefined) sessionPatch.notes = notes;
  if (Object.keys(sessionPatch).length > 0) {
    const s = await supabase
      .from("sessions")
      .update(sessionPatch)
      .eq("id", sessionId);
    if (s.error) throw new Error(s.error.message);
  }

  // Je Uebung: vorhandene ARBEITSSAETZE ersetzen (Aufwaermsaetze bleiben), dann
  // tested_1rm neu setzen. Wenige Uebungen je Einheit – einfache Schleife genuegt.
  for (const ex of exercises) {
    const d = await supabase
      .from("sets")
      .delete()
      .eq("session_exercise_id", ex.sessionExerciseId)
      .eq("kind", "work");
    if (d.error) throw new Error(d.error.message);

    if (ex.workSetRows.length) {
      const i = await supabase.from("sets").insert(ex.workSetRows);
      if (i.error) throw new Error(i.error.message);
    }

    const u = await supabase
      .from("session_exercises")
      .update({ tested_1rm: ex.tested1RM })
      .eq("id", ex.sessionExerciseId);
    if (u.error) throw new Error(u.error.message);
  }

  // Katalog fortschreiben (nur juengste Einheit – vom Hook entschieden).
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
 *  Neustart fortgesetzte (pausierte) Mutationen, da onSuccess hier haengt. */
export function registerEditMutation(qc: QueryClient): void {
  qc.setMutationDefaults(EDIT_MUTATION_KEY, {
    mutationFn: (vars: unknown) => writeEdit(vars as EditPayload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sessions"] });
      void qc.invalidateQueries({ queryKey: ["sessions-detailed"] });
      void qc.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}
