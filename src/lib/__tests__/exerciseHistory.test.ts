import { describe, expect, it } from "vitest";
import {
  buildExerciseHistory,
  exBestSet,
  exSixWeekPct,
  exMetricOptions,
  exDefaultMetric,
  exLineSeries,
  exVolumeSeries,
} from "@/lib/exerciseHistory";
import type { HistorySessionInput, HistoryExercise } from "@/lib/history";

function session(
  date: string,
  exercises: HistoryExercise[],
): HistorySessionInput {
  return {
    id: "s-" + date,
    date,
    type: "strength",
    templateId: null,
    skillId: null,
    durationSec: null,
    minutes: null,
    notes: "",
    exercises,
  };
}

function strengthEx(
  exerciseId: string | null,
  sets: Array<{
    kind: "warmup" | "work";
    weight?: number | null;
    reps?: number | null;
    score?: number | null;
    durationSec?: number | null;
    adjusted?: boolean;
  }>,
  tested1RM: number | null = null,
): HistoryExercise {
  return {
    exerciseId,
    name: null,
    metric: "reps",
    position: 0,
    tested1RM,
    sets: sets.map((s) => ({
      kind: s.kind,
      reps: s.reps ?? null,
      weight: s.weight ?? null,
      durationSec: s.durationSec ?? null,
      score: s.score ?? null,
      adjusted: s.adjusted ?? false,
    })),
  };
}

describe("buildExerciseHistory", () => {
  it("sammelt nur Arbeitssaetze der passenden Uebung und rechnet die Kennzahlen", () => {
    const sessions = [
      session("2026-01-01", [
        strengthEx(
          "squat",
          [
            { kind: "warmup", weight: 40, reps: 5 },
            { kind: "work", weight: 80, reps: 5, score: 3 },
            { kind: "work", weight: 80, reps: 4, score: 4 },
          ],
          95,
        ),
        strengthEx("bench", [{ kind: "work", weight: 60, reps: 5 }]),
      ]),
    ];
    const h = buildExerciseHistory("squat", sessions);
    expect(h).toHaveLength(1);
    expect(h[0].topW).toBe(80);
    expect(h[0].reps).toBe(9); // 5 + 4, Aufwaermsatz zaehlt nicht
    expect(h[0].vol).toBe(80 * 5 + 80 * 4);
    expect(h[0].score).toBeCloseTo(3.5);
    expect(h[0].est1RM).toBe(92.2); // aus 80x5 geschaetzt (Mittelwert-Formel)
    expect(h[0].sets).toHaveLength(2);
  });

  it("ignoriert Einheiten ohne Arbeitssatz und sortiert aelteste zuerst", () => {
    const sessions = [
      session("2026-02-01", [
        strengthEx("squat", [{ kind: "work", weight: 90, reps: 3 }]),
      ]),
      session("2026-01-01", [
        strengthEx("squat", [{ kind: "warmup", weight: 40, reps: 5 }]),
      ]),
      session("2026-01-15", [
        strengthEx("squat", [{ kind: "work", weight: 85, reps: 5 }]),
      ]),
    ];
    const h = buildExerciseHistory("squat", sessions);
    expect(h.map((e) => e.date)).toEqual(["2026-01-15", "2026-02-01"]);
  });

  it("uebernimmt keine Skill-Einheiten ohne Katalogbezug (exercise_id null)", () => {
    const sessions = [
      session("2026-01-01", [
        strengthEx(null, [{ kind: "work", reps: 8 }]),
      ]),
    ];
    expect(buildExerciseHistory("squat", sessions)).toHaveLength(0);
  });

  it("markiert eine Abweichung, wenn ein Arbeitssatz angepasst wurde", () => {
    const sessions = [
      session("2026-01-01", [
        strengthEx("squat", [
          { kind: "work", weight: 80, reps: 5, adjusted: true },
        ]),
      ]),
    ];
    expect(buildExerciseHistory("squat", sessions)[0].dev).toBe(true);
  });
});

describe("exBestSet", () => {
  it("waehlt das hoechste Gewicht, bei Gleichstand die meisten Wiederholungen", () => {
    const sessions = [
      session("2026-01-01", [
        strengthEx("squat", [
          { kind: "work", weight: 80, reps: 5 },
          { kind: "work", weight: 90, reps: 3 },
          { kind: "work", weight: 90, reps: 5 },
        ]),
      ]),
    ];
    const best = exBestSet(buildExerciseHistory("squat", sessions));
    expect(best).toEqual({ weight: 90, reps: 5 });
  });

  it("liefert null ohne gewichtete Saetze", () => {
    expect(exBestSet([])).toBeNull();
  });
});

describe("exSixWeekPct", () => {
  it("rechnet die 1RM-Veraenderung ueber ~6 Wochen", () => {
    const sessions = [
      session("2026-01-01", [
        strengthEx("squat", [{ kind: "work", weight: 80, reps: 5 }]),
      ]),
      session("2026-02-20", [
        strengthEx("squat", [{ kind: "work", weight: 90, reps: 5 }]),
      ]),
    ];
    // 80x5 ~ 92.2, 90x5 ~ 103.72 -> +12 %
    expect(exSixWeekPct(buildExerciseHistory("squat", sessions))).toBe("+12%");
  });

  it("liefert null bei zu wenig 1RM-Daten", () => {
    const sessions = [
      session("2026-01-01", [
        strengthEx("squat", [{ kind: "work", weight: 80, reps: 5 }]),
      ]),
    ];
    expect(exSixWeekPct(buildExerciseHistory("squat", sessions))).toBeNull();
  });
});

describe("exMetricOptions / exDefaultMetric", () => {
  it("Hauptuebung: vier Metriken, Standard 1RM", () => {
    expect(exMetricOptions("strength", null).map((o) => o.key)).toEqual([
      "rm",
      "weight",
      "reps",
      "volume",
    ]);
    expect(exDefaultMetric("strength", null)).toBe("rm");
  });

  it("Koerpergewicht mit Wdh: Wdh + Volumen, Standard Wdh", () => {
    expect(exMetricOptions("bodyweight", "reps").map((o) => o.key)).toEqual([
      "reps",
      "volume",
    ]);
    expect(exDefaultMetric("bodyweight", "reps")).toBe("reps");
  });

  it("Koerpergewicht mit Haltezeit: nur Haltezeit", () => {
    expect(exMetricOptions("bodyweight", "duration").map((o) => o.key)).toEqual([
      "duration",
    ]);
    expect(exDefaultMetric("bodyweight", "duration")).toBe("duration");
  });
});

describe("exLineSeries", () => {
  const sessions = [
    session("2026-01-01", [
      strengthEx("squat", [{ kind: "work", weight: 80, reps: 5, adjusted: true }]),
    ]),
    session("2026-01-08", [
      strengthEx("squat", [{ kind: "work", weight: 90, reps: 3 }]),
    ]),
  ];
  const h = buildExerciseHistory("squat", sessions);

  it("rm: nur Einheiten mit 1RM, Abweichungs-Flag uebernommen", () => {
    const s = exLineSeries(h, "rm");
    expect(s).toHaveLength(2);
    expect(s[0].flag).toBe(true);
    expect(s[1].flag).toBe(false);
    expect(s[0].y).toBeGreaterThan(0);
  });

  it("weight: Top-Gewicht je Einheit", () => {
    expect(exLineSeries(h, "weight").map((p) => p.y)).toEqual([80, 90]);
  });

  it("reps: Summe der Arbeitssatz-Wdh", () => {
    expect(exLineSeries(h, "reps").map((p) => p.y)).toEqual([5, 3]);
  });
});

describe("exVolumeSeries", () => {
  it("summiert das Volumen je ISO-Woche, chronologisch", () => {
    const sessions = [
      session("2026-01-05", [
        strengthEx("squat", [{ kind: "work", weight: 100, reps: 5 }]),
      ]),
      session("2026-01-06", [
        strengthEx("squat", [{ kind: "work", weight: 100, reps: 3 }]),
      ]),
      session("2026-01-12", [
        strengthEx("squat", [{ kind: "work", weight: 100, reps: 4 }]),
      ]),
    ];
    const v = exVolumeSeries(buildExerciseHistory("squat", sessions));
    expect(v).toHaveLength(2);
    expect(v[0].value).toBe(800); // 500 + 300 (gleiche Woche)
    expect(v[1].value).toBe(400);
    expect(v[0].label.startsWith("W")).toBe(true);
  });
});
