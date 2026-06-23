import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUserId } from "./useUserId";
import {
  buildExport,
  serializeExport,
  exportFilename,
  type RawExportData,
  type RawSession,
  type RawSessionExercise,
  type RawSet,
  type Row,
} from "@/lib/exportData";
import { downloadTextFile, copyText } from "@/lib/download";

// Holt den kompletten Bestand des Nutzers (RLS schraenkt automatisch auf die
// eigene user_id ein) und baut daraus das lesbare Export-JSON. DOM-Seiten
// (Datei/Zwischenablage) liegen im download-Baustein, der Aufbau im reinen
// exportData-Modul. Der Hook orchestriert nur.

async function selectAll(table: string): Promise<Row[]> {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as Row[];
}

async function fetchAll(): Promise<RawExportData> {
  const [
    bars,
    plates,
    kettlebells,
    equipment,
    exercises,
    exerciseMuscles,
    templates,
    templateExercises,
    journeyTemplates,
    journeyTemplatePhases,
    skills,
    skillPhases,
    skillPhaseExercises,
    skillPhaseEquipment,
    journeys,
    phases,
    sessions,
    sessionExercises,
    sets,
    skillProgress,
    bodyLog,
    composition,
    settingsRows,
  ] = await Promise.all([
    selectAll("inventory_bars"),
    selectAll("inventory_plates"),
    selectAll("inventory_kettlebells"),
    selectAll("inventory_equipment"),
    selectAll("exercises"),
    selectAll("exercise_muscles"),
    selectAll("templates"),
    selectAll("template_exercises"),
    selectAll("journey_templates"),
    selectAll("journey_template_phases"),
    selectAll("skills"),
    selectAll("skill_phases"),
    selectAll("skill_phase_exercises"),
    selectAll("skill_phase_equipment"),
    selectAll("journeys"),
    selectAll("phases"),
    selectAll("sessions"),
    selectAll("session_exercises"),
    selectAll("sets"),
    selectAll("skill_progress"),
    selectAll("body_log"),
    selectAll("composition"),
    selectAll("settings"),
  ]);

  return {
    bars,
    plates,
    kettlebells,
    equipment,
    exercises,
    exerciseMuscles,
    templates,
    templateExercises,
    journeyTemplates,
    journeyTemplatePhases,
    skills,
    skillPhases,
    skillPhaseExercises,
    skillPhaseEquipment,
    journeys,
    phases,
    sessions: sessions as RawSession[],
    sessionExercises: sessionExercises as RawSessionExercise[],
    sets: sets as RawSet[],
    skillProgress,
    bodyLog,
    composition,
    settings: settingsRows[0] ?? null,
  };
}

async function buildText(): Promise<string> {
  const raw = await fetchAll();
  return serializeExport(buildExport(raw));
}

type Status = "idle" | "file" | "clipboard" | "error";

export function useExport(): {
  exportToFile: () => Promise<void>;
  exportToClipboard: () => Promise<void>;
  status: Status;
  isPending: boolean;
  error: string | null;
} {
  const userId = useUserId();
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportToFile(): Promise<void> {
    if (userId === null) {
      setError("Nicht angemeldet.");
      setStatus("error");
      return;
    }
    setIsPending(true);
    setError(null);
    try {
      const text = await buildText();
      downloadTextFile(exportFilename(), text);
      setStatus("file");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    } finally {
      setIsPending(false);
    }
  }

  async function exportToClipboard(): Promise<void> {
    if (userId === null) {
      setError("Nicht angemeldet.");
      setStatus("error");
      return;
    }
    setIsPending(true);
    setError(null);
    try {
      const text = await buildText();
      const ok = await copyText(text);
      if (!ok) throw new Error("Zwischenablage nicht verfuegbar.");
      setStatus("clipboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    } finally {
      setIsPending(false);
    }
  }

  return { exportToFile, exportToClipboard, status, isPending, error };
}
