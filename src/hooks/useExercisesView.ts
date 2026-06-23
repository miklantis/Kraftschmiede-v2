import { useExercises } from "./useExercises";
import { useSettings } from "./useSettings";
import { groupExercises, type ExerciseGroup } from "@/lib/exercises";

export interface ExercisesView {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  groups: ExerciseGroup[];
}

// Die Uebungsliste als Ansichtsmodell: der Katalog (useExercises) gruppiert in
// die V1-Reihenfolge, mit den Zeilen-Metadaten (Sub = Muskelgruppen, Meta =
// 1RM/Arbeitsgewicht/Wdh) – Letztere brauchen die Gewichtseinheit aus den
// Einstellungen. Reine Aufbereitung liegt in lib/exercises.ts.
export function useExercisesView(): ExercisesView {
  const exercisesQ = useExercises();
  const settingsQ = useSettings();

  const isLoading = exercisesQ.isLoading || settingsQ.isLoading;
  const isError = exercisesQ.isError || settingsQ.isError;
  const error = exercisesQ.error ?? settingsQ.error;

  const unit = settingsQ.data?.unit ?? "kg";
  const groups = exercisesQ.data
    ? groupExercises(exercisesQ.data, unit)
    : [];

  return { isLoading, isError, error, groups };
}
