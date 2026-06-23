import { useState } from "react";
import { ChipSwitch } from "@/components/ui/chip-switch";
import { ExerciseChart } from "./ExerciseChart";
import {
  EX_METRIC_TITLE,
  type ExHistoryEntry,
  type ExMetric,
  type ExMetricOption,
} from "@/lib/exerciseHistory";

// Verlaufs-Chartkarte der Detailseite (V1 ub-cc): weisse Karte mit Titel
// (= Metrik-Bezeichnung), darunter der Metrik-Umschalter (entfaellt bei nur
// einer Metrik) und der Chart. Welche Metrik aktiv ist, haelt die Karte lokal;
// Standard kommt vom Aufrufer. Der "Anheften"-Knopf folgt mit Schritt 6.

export interface ExerciseChartCardProps {
  history: readonly ExHistoryEntry[];
  options: readonly ExMetricOption[];
  defaultMetric: ExMetric;
  unit: string;
}

export function ExerciseChartCard({
  history,
  options,
  defaultMetric,
  unit,
}: ExerciseChartCardProps): React.ReactElement {
  const [metric, setMetric] = useState<ExMetric>(defaultMetric);
  // Falls der Standard nicht in den Optionen liegt, auf die erste zurueckfallen.
  const active = options.some((o) => o.key === metric)
    ? metric
    : (options[0]?.key ?? defaultMetric);

  return (
    <div className="rounded-[18px] bg-card p-4 shadow-card min-[960px]:px-5 min-[960px]:py-[18px]">
      <div className="mb-1.5 flex items-center justify-between min-[960px]:mb-2">
        <span className="text-[14px] font-semibold">
          {EX_METRIC_TITLE[active]}
        </span>
      </div>
      {options.length > 1 && (
        <ChipSwitch
          options={options}
          value={active}
          onChange={setMetric}
          ariaLabel="Metrik"
          className="mb-2"
        />
      )}
      <ExerciseChart history={history} metric={active} unit={unit} />
    </div>
  );
}
