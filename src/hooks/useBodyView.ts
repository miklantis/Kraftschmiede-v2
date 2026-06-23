import { useMemo } from "react";
import { restAdvice, type RestAdvice } from "@/engine";
import {
  soreRegionValues,
  soreInfoLine,
  bodyLogChips,
} from "@/lib/body";
import { todayISO, longDateShort } from "@/lib/format";
import { useBodyLog } from "./useBodyLog";
import type { BodyLogRow } from "@/schemas";

export interface BodyHistEntry {
  date: string;
  dateLabel: string;
  chips: string[];
  notes: string;
}

export interface BodyView {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  // Heutiger Eintrag (oder null) – Startwert fuer den Eingabe-Entwurf.
  today: BodyLogRow | null;
  hasToday: boolean;
  advice: RestAdvice;
  // Region->Wert-Map fuer die Kater-Figur (null, wenn nie erfasst).
  soreValues: Record<string, number> | null;
  soreInfo: string;
  history: BodyHistEntry[];
}

// Buendelt die Lese-Seite der Befinden-Haelfte. Die Komponente kennt weder
// Supabase noch die Engine. Der Eingabe-Entwurf (bodyDraft) lebt lokal in der
// Route; dieser Hook liefert nur die Anzeige-Daten und den heutigen Startwert.
export function useBodyView(): BodyView {
  const q = useBodyLog();
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const todayStr = todayISO();

  return useMemo(() => {
    // rows kommen bereits absteigend (neueste zuerst).
    const today = rows.find((r) => r.date === todayStr) ?? null;
    const latest = rows.length ? rows[0] : null;
    const advice = restAdvice(today);
    const soreValues = soreRegionValues(latest, todayStr);
    const soreInfo = soreInfoLine(latest, todayStr);
    const history: BodyHistEntry[] = rows.slice(0, 8).map((e) => ({
      date: e.date,
      dateLabel: longDateShort(e.date),
      chips: bodyLogChips(e),
      notes: e.notes,
    }));

    return {
      isLoading: q.isLoading,
      isError: q.isError,
      error: q.error,
      today,
      hasToday: today !== null,
      advice,
      soreValues,
      soreInfo,
      history,
    };
  }, [rows, todayStr, q.isLoading, q.isError, q.error]);
}
