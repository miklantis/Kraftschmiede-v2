import { describe, expect, it } from "vitest";
import {
  buildSuitabilityCtx,
  lastByExercise,
  rankWorkouts,
  recoveryGreen,
  weekCounts,
  type DoneSessionEntry,
} from "../coach";
import type { Exercise } from "@/engine/types";

const exMap: Record<string, Exercise> = {
  squat: { id: "squat", name: "Kniebeuge", kind: "main", muscleGroups: ["legs"], recoveryHours: 48 },
  bench: { id: "bench", name: "Bankdrücken", kind: "main", muscleGroups: ["chest"], recoveryHours: 48 },
};

describe("lastByExercise", () => {
  it("nimmt den spaetesten Einsatz je Uebung", () => {
    const done: DoneSessionEntry[] = [
      { date: "2026-01-01", exerciseIds: ["squat"] },
      { date: "2026-01-10", exerciseIds: ["squat", "bench"] },
    ];
    const map = lastByExercise(done);
    expect(map.squat).toBe(new Date("2026-01-10T12:00:00").getTime());
    expect(map.bench).toBe(new Date("2026-01-10T12:00:00").getTime());
  });
});

describe("weekCounts", () => {
  it("zaehlt nur Einheiten der laufenden Kalenderwoche", () => {
    const done: DoneSessionEntry[] = [
      { date: "2026-01-05", exerciseIds: ["squat"] }, // KW02
      { date: "2026-01-06", exerciseIds: ["squat"] }, // KW02
      { date: "2025-12-29", exerciseIds: ["squat"] }, // KW01
    ];
    expect(weekCounts(done, "2026-01-05")).toEqual({ squat: 2 });
  });
});

describe("recoveryGreen", () => {
  it("gruen bei niedrigem Kater und ausreichender Readiness", () => {
    expect(
      recoveryGreen({ legs: 1, upper_body: 0, overall: 1, readiness: 3 }),
    ).toBe(true);
  });

  it("nicht gruen bei Kater >= 2 oder niedriger Readiness", () => {
    expect(
      recoveryGreen({ legs: 2, upper_body: 0, overall: 0, readiness: 4 }),
    ).toBe(false);
    expect(
      recoveryGreen({ legs: 0, upper_body: 0, overall: 0, readiness: 2 }),
    ).toBe(false);
  });
});

describe("rankWorkouts", () => {
  it("sortiert nach Score absteigend, Ausschluss ans Ende", () => {
    const ctx = buildSuitabilityCtx({
      now: new Date("2026-01-20T12:00:00").getTime(),
      done: [{ date: "2026-01-19", exerciseIds: ["squat"] }], // Kniebeuge frisch
      today: "2026-01-20",
      body: { legs: 0, upper_body: 0, overall: 0, readiness: 3 },
      phase: { focus: "hypertrophy" },
      freqTarget: 3,
    });
    const templates = [
      { id: "w1", exerciseIds: ["squat"] }, // gerade erst trainiert -> unausgeruht
      { id: "w2", exerciseIds: ["bench"] }, // nie -> hoher Recency-Bonus
    ];
    const ranked = rankWorkouts(templates, ctx, exMap);
    expect(ranked[0].template.id).toBe("w2");
    expect(ranked[1].template.id).toBe("w1");
  });

  it("schliesst Workouts mit Kater=3 in betroffener Region aus", () => {
    const ctx = buildSuitabilityCtx({
      now: new Date("2026-01-20T12:00:00").getTime(),
      done: [],
      today: "2026-01-20",
      body: { legs: 3, upper_body: 0, overall: 0, readiness: 3 },
      phase: null,
      freqTarget: 3,
    });
    const ranked = rankWorkouts(
      [{ id: "legday", exerciseIds: ["squat"] }],
      ctx,
      exMap,
    );
    expect(ranked[0].excluded).toBe(true);
  });
});
