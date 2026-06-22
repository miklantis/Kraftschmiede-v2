import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { todayISO } from "@/lib/format";
import { useUserId } from "./useUserId";
import type { JourneyInsert, PhaseInsert } from "@/schemas";
import type { JourneyTemplateWithPhases } from "./useJourneyTemplates";

// Schreibaktionen der Journey-Seite. Anlegen kopiert die Vorlagenphasen in eine
// neue, aktive Journey und deaktiviert die bisherige (Invariante: genau eine
// aktive Journey – als Partial Unique Index in der DB). Umbenennen aendert nur
// den Namen. Beide laden danach die aktive Journey neu, damit Seite und
// Trainings-Uebersicht sofort stimmen.
export function useJourneyActions(): {
  createFromTemplate: (template: JourneyTemplateWithPhases) => Promise<void>;
  rename: (journeyId: string, name: string) => Promise<void>;
  isCreating: boolean;
  isRenaming: boolean;
  error: unknown;
} {
  const queryClient = useQueryClient();
  const userId = useUserId();

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ["activeJourney", userId] });
  };

  const create = useMutation({
    mutationFn: async (
      template: JourneyTemplateWithPhases,
    ): Promise<void> => {
      if (userId === null) throw new Error("Nicht angemeldet.");

      // Bisherige aktive Journey zuerst deaktivieren, damit der Unique-Index
      // beim Einfuegen der neuen aktiven Journey nicht verletzt wird.
      const { data: current, error: curErr } = await supabase
        .from("journeys")
        .select("id")
        .eq("active", true)
        .maybeSingle();
      if (curErr) throw new Error(curErr.message);
      if (current) {
        const { error: deErr } = await supabase
          .from("journeys")
          .update({ active: false })
          .eq("id", (current as { id: string }).id);
        if (deErr) throw new Error(deErr.message);
      }

      const insert: JourneyInsert = {
        user_id: userId,
        name: template.name,
        active: true,
        status: "active",
        source_template_id: template.id,
        start_date: todayISO(),
      };
      const { data: created, error: insErr } = await supabase
        .from("journeys")
        .insert(insert)
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);
      const journeyId = (created as { id: string }).id;

      const phaseRows: PhaseInsert[] = template.phases.map((p, i) => ({
        user_id: userId,
        journey_id: journeyId,
        name: p.name,
        focus: p.focus,
        weeks: p.weeks,
        sets_start: p.sets_start,
        sets_end: p.sets_end,
        deload_week: p.deload_week,
        rep_target_min: p.rep_target_min,
        rep_target_max: p.rep_target_max,
        position: i,
      }));
      const { error: phErr } = await supabase.from("phases").insert(phaseRows);
      if (phErr) throw new Error(phErr.message);
    },
    onSuccess: invalidate,
  });

  const renameM = useMutation({
    mutationFn: async (vars: {
      journeyId: string;
      name: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from("journeys")
        .update({ name: vars.name })
        .eq("id", vars.journeyId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return {
    createFromTemplate: (t) => create.mutateAsync(t),
    rename: (journeyId, name) => renameM.mutateAsync({ journeyId, name }),
    isCreating: create.isPending,
    isRenaming: renameM.isPending,
    error: create.error ?? renameM.error,
  };
}
