import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { RmFormula } from "@/engine/types";
import {
  buildEditPayload,
  type EditDraftExercise,
  type EditPayload,
} from "@/lib/editSession";
import { EDIT_MUTATION_KEY } from "@/lib/editMutation";
import { useUserId } from "./useUserId";
import { useSettings } from "./useSettings";
import { useExercises } from "./useExercises";
import { useSessionsDetailed } from "./useSessionsDetailed";

const RM_FORMULAS: RmFormula[] = ["brzycki", "epley", "wathan", "mean"];
function asRmFormula(v: string | null | undefined): RmFormula {
  return RM_FORMULAS.includes(v as RmFormula) ? (v as RmFormula) : "mean";
}

/** Eingabe fuer das Speichern einer Bearbeitung – der Entwurf aus dem Panel. */
export interface EditSaveInput {
  sessionId: string;
  /** Datum der bearbeiteten Einheit (ISO) – fuer die „nur juengste“-Regel. */
  date: string;
  durationSec: number | null;
  exercises: Array<
    Pick<EditDraftExercise, "sessionExerciseId" | "exerciseId"> & {
      sets: EditDraftExercise["sets"];
    }
  >;
}

export interface UseEditSession {
  /** Schreibt die Bearbeitung zurueck. Ohne Netz wird pausiert und nachgeholt. */
  save: (input: EditSaveInput) => void;
  isSaving: boolean;
}

export function useEditSession(): UseEditSession {
  const userId = useUserId();
  const settingsQ = useSettings();
  const exercisesQ = useExercises();
  const detailedQ = useSessionsDetailed();

  const mutation = useMutation<void, Error, EditPayload>({
    mutationKey: EDIT_MUTATION_KEY,
  });

  const save = useCallback(
    (input: EditSaveInput): void => {
      if (!userId) return;
      const rmFormula = asRmFormula(settingsQ.data?.rm_formula);

      // 1RM-Tracking je Uebung (alles ausser reinem Koerpergewicht) aus dem
      // Katalog.
      const byId = new Map((exercisesQ.data ?? []).map((e) => [e.id, e]));
      const tracksRm = (exerciseId: string): boolean => {
        const exo = byId.get(exerciseId);
        return exo ? exo.profile !== "bodyweight" : false;
      };

      // „Nur juengste“: gibt es eine ANDERE Kraft-Einheit mit spaeterem Datum,
      // die diese Uebung enthaelt? Wenn nein, ist die bearbeitete die juengste.
      const sessions = detailedQ.data ?? [];
      const isYoungest = (exerciseId: string): boolean => {
        return !sessions.some(
          (s) =>
            s.id !== input.sessionId &&
            s.type === "strength" &&
            s.date > input.date &&
            s.exercises.some((e) => e.exerciseId === exerciseId),
        );
      };

      const payload = buildEditPayload({
        sessionId: input.sessionId,
        durationSec: input.durationSec,
        userId,
        rmFormula,
        date: input.date,
        exercises: input.exercises.map((e) => ({
          sessionExerciseId: e.sessionExerciseId,
          exerciseId: e.exerciseId,
          sets: e.sets,
        })),
        isYoungest,
        tracksRm,
        newId: () => crypto.randomUUID(),
      });

      mutation.mutate(payload);
    },
    [userId, settingsQ.data, exercisesQ.data, detailedQ.data, mutation],
  );

  return { save, isSaving: mutation.isPending };
}
