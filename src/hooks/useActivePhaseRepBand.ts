import { useActiveJourney } from "./useJourney";
import { useSessions } from "./useSessions";
import { useSettings } from "./useSettings";
import { journeyPlacement, phaseRepBand } from "@/engine";
import { todayISO } from "@/lib/format";

// Repband der aktuell laufenden Journey-Phase (Region/Wert wie im Coach). Dient
// dem "Uebung anpassen"-Popup, um das Repband zu sperren, wenn es aus der
// aktiven Phase kommt (V1-Verhalten). Liefert [min,max] oder null, wenn keine
// aktive Journey/Phase greift oder die Phase kein Band vorgibt (z. B. Erhaltung).
// Reine Komposition: aktive Journey + Einheiten + Frequenzziel -> Platzierung ->
// aktuelle Phase -> Band ueber die Engine. Die Profil-Einschraenkung (nur
// Kraftuebungen sind gesperrt) trifft der Aufrufer.
export function useActivePhaseRepBand(): [number, number] | null {
  const journeyQ = useActiveJourney();
  const sessionsQ = useSessions();
  const settingsQ = useSettings();

  const journey = journeyQ.data;
  const sessions = sessionsQ.data;
  if (!journey || !sessions) return null;

  const freqTarget = settingsQ.data?.weekly_frequency_target || 3;
  const placement = journeyPlacement(
    { id: journey.id, phases: journey.phases },
    sessions.map((s) => ({
      date: s.date,
      status: s.status,
      type: s.type,
      journeyId: s.journey_id,
    })),
    freqTarget,
    todayISO(),
  );

  const phase = journey.phases[placement.phaseIndex] ?? null;
  if (!phase) return null;
  return phaseRepBand(phase.rep_target_min, phase.rep_target_max, phase.focus);
}
