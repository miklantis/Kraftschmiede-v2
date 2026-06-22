import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserId } from "./useUserId";
import type { TemplateRow } from "@/schemas";

// Vorlage plus die geordnete Liste ihrer Uebungs-Ids (aus template_exercises).
export interface TemplateWithExercises extends TemplateRow {
  exerciseIds: string[];
}

interface TemplateExerciseLink {
  exercise_id: string;
  position: number;
}

// Workout-Vorlagen mit ihren Uebungen in Reihenfolge. Eine verschachtelte
// Abfrage holt template_exercises gleich mit; die Reihenfolge wird clientseitig
// nach position sortiert.
export function useTemplates() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["templates", userId],
    enabled: userId !== null,
    queryFn: async (): Promise<TemplateWithExercises[]> => {
      const { data, error } = await supabase
        .from("templates")
        .select("*, template_exercises(exercise_id, position)")
        .order("position", { ascending: true });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Array<
        TemplateRow & { template_exercises: TemplateExerciseLink[] }
      >;
      return rows.map((row) => {
        const { template_exercises, ...template } = row;
        const exerciseIds = (template_exercises ?? [])
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((te) => te.exercise_id);
        return { ...template, exerciseIds };
      });
    },
  });
}
