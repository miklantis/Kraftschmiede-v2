// Coach – das deterministische "Gehirn" als eigenes, testbares Modul. Nimmt den
// Zustand explizit herein (Verlauf, Koerper, Phase, Inventar) und gibt
// Entscheidungen heraus. Keine DB- oder DOM-Kenntnis: es komponiert nur die reine
// Engine (suitability). Gleiche Bauform wie die Engine. 1:1 aus V1 (CoachCore +
// Glue), nur die Zustandsbeschaffung wandert in die Daten-Hooks.

import { suitability } from "@/engine";
import type { SuitabilityResult } from "@/engine";
import type { Exercise, SuitabilityCtx } from "@/engine/types";
import { isoWeekKey } from "@/engine/journey";

// Eine abgeschlossene Krafteinheit, reduziert auf das fuer das Ranking Noetige:
// Datum und die enthaltenen Uebungs-Ids.
export interface DoneSessionEntry {
  date: string; // "YYYY-MM-DD"
  exerciseIds: string[];
}

// Koerperzustand (zuletzt erfasst) fuer Kater und Erholung.
export interface BodyReadiness {
  legs: number;
  upper_body: number;
  overall: number;
  readiness: number;
}

// Vorlage in der vom Ranking erwarteten Form (Id + geordnete Uebungs-Ids).
export interface RankableTemplate {
  id: string;
  exerciseIds: string[];
}

export interface RankedWorkout<T extends RankableTemplate> {
  template: T;
  score: number;
  excluded: boolean;
  reasons: string[];
}

function dateMs(dateStr: string): number {
  return new Date(dateStr + "T12:00:00").getTime();
}

// Letzter Einsatz je Uebung als Zeitstempel (ms). Aelteste zuerst iterieren,
// damit der spaeteste Einsatz gewinnt.
export function lastByExercise(done: DoneSessionEntry[]): Record<string, number> {
  const map: Record<string, number> = {};
  const sorted = (done || []).slice().sort((a, b) => dateMs(a.date) - dateMs(b.date));
  sorted.forEach((s) => {
    s.exerciseIds.forEach((id) => {
      map[id] = dateMs(s.date);
    });
  });
  return map;
}

// Wie oft wurde jede Uebung in der Kalenderwoche von today trainiert?
export function weekCounts(
  done: DoneSessionEntry[],
  today: string,
): Record<string, number> {
  const wk = isoWeekKey(today);
  const map: Record<string, number> = {};
  (done || []).forEach((s) => {
    if (isoWeekKey(s.date) !== wk) return;
    s.exerciseIds.forEach((id) => {
      map[id] = (map[id] || 0) + 1;
    });
  });
  return map;
}

// Erholung "gruen": kein Kater >= 2 in einer Region und Readiness >= 3.
export function recoveryGreen(body: BodyReadiness): boolean {
  return (
    (body.legs || 0) < 2 &&
    (body.upper_body || 0) < 2 &&
    (body.overall || 0) < 2 &&
    (body.readiness || 3) >= 3
  );
}

export interface SuitabilityCtxInput {
  now: number;
  done: DoneSessionEntry[];
  today: string;
  body: BodyReadiness;
  phase: { focus?: string } | null;
  freqTarget: number;
}

// Baut den Eignungs-Kontext fuer die Engine aus dem hereingereichten Zustand.
export function buildSuitabilityCtx(input: SuitabilityCtxInput): SuitabilityCtx {
  return {
    now: input.now,
    lastByExercise: lastByExercise(input.done),
    soreness: {
      legs: input.body.legs,
      upper_body: input.body.upper_body,
      overall: input.body.overall,
    },
    weekCounts: weekCounts(input.done, input.today),
    phase: input.phase ?? undefined,
    freqTarget: input.freqTarget,
  };
}

// Workouts nach Eignung sortiert: ausgeschlossene ans Ende, sonst Score absteigend
// (1:1 wie V1 CoachCore.rankWorkouts).
export function rankWorkouts<T extends RankableTemplate>(
  templates: T[],
  ctx: SuitabilityCtx,
  exMap: Record<string, Exercise>,
): RankedWorkout<T>[] {
  return (templates || [])
    .map((t) => {
      const s: SuitabilityResult = suitability(
        { id: t.id, items: t.exerciseIds },
        ctx,
        { exMap },
      );
      return {
        template: t,
        score: s.score,
        excluded: s.excluded,
        reasons: s.reasons,
      };
    })
    .sort((a, b) => {
      if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
      return b.score - a.score;
    });
}
