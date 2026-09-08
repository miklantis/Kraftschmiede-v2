import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INVALIDATE, invalidateGroup } from "@/lib/queryKeys";
import { supabaseExerciseStore } from "@/lib/exerciseStore";
import { writeMilestoneAction } from "@/lib/exerciseWrite";
import type { MilestoneAction, MeilensteinZiel } from "@/lib/exerciseWrite";
import { useUserId } from "./useUserId";
import { todayISO } from "@/lib/format";

// Schreibzugriffe auf die Meilensteine, gebuendelt in einem Hook (gemeinsamer
// Lade-/Fehlerzustand). Nach Erfolg werden alle Meilenstein-Listen neu geladen.
// Die Datenbank-Handgriffe liegen hinter der Naht ExerciseStore/exerciseWrite;
// hier steht nur noch Absicht und Auffrischung.
// markAchieved stempelt das heutige Datum, aber nur solange achieved_at leer ist
// (Guard im Store) – idempotent, ueberschreibt kein bestehendes Erreichen-Datum.
// Dabei wandert der gerade gueltige Zielwert mit in die Zeile, damit ein
// dynamischer Meilenstein nach dem Erreichen nicht weiterwandert.

export function useMilestoneActions(): {
  add: (exerciseId: string, name: string, ziel: MeilensteinZiel) => Promise<void>;
  update: (id: string, name: string, ziel: MeilensteinZiel) => Promise<void>;
  remove: (id: string) => Promise<void>;
  markAchieved: (id: string, ziel: number) => Promise<void>;
  isPending: boolean;
  error: unknown;
} {
  const queryClient = useQueryClient();
  const userId = useUserId();

  const mutation = useMutation({
    mutationFn: (action: MilestoneAction): Promise<void> =>
      writeMilestoneAction(supabaseExerciseStore, userId, action),
    onSuccess: () => {
      invalidateGroup(queryClient, INVALIDATE.milestones);
    },
  });

  return {
    add: (exerciseId, name, ziel) =>
      mutation.mutateAsync({ type: "add", exerciseId, name, ziel }),
    update: (id, name, ziel) =>
      mutation.mutateAsync({ type: "update", id, name, ziel }),
    remove: (id) => mutation.mutateAsync({ type: "delete", id }),
    markAchieved: (id, ziel) =>
      mutation.mutateAsync({ type: "markAchieved", id, date: todayISO(), ziel }),
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
