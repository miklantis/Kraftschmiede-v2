import { describe, expect, it } from "vitest";
import { suggestWeight } from "../progression";
import type { EngineSet, SetEntry } from "../types";

const EX = { workWeight: 60, repRange: [8, 12] as [number, number], targetScore: 3 };
const entry = (sets: EngineSet[]): SetEntry => ({ sets });
const work = (o: Partial<EngineSet>): EngineSet => ({
  type: "work",
  weight: 60,
  reps: 8,
  done: true,
  targetReps: 8,
  targetWeight: 60,
  score: 3,
  ...o,
});

describe("suggestWeight – Doppelprogression", () => {
  it("keine Vordaten => Startgewicht halten", () => {
    const r = suggestWeight(EX, null);
    expect(r.decision).toBe("hold");
    expect(r.weight).toBe(60);
    expect(r.targetReps).toBe(12);
  });

  it("Repband oben erreicht => Gewicht +Schritt, Reps zuruecksetzen", () => {
    const r = suggestWeight(EX, entry([work({ reps: 12, score: 2 }), work({ reps: 12, score: 2 })]));
    expect(r.decision).toBe("increase");
    expect(r.weight).toBe(62.5);
    expect(r.targetReps).toBe(8);
  });

  it("leichter als Ziel, Repband nicht voll => Wiederholungen steigern", () => {
    const r = suggestWeight(EX, entry([work({ reps: 9, score: 2 }), work({ reps: 9, score: 2 })]));
    expect(r.decision).toBe("increase-reps");
    expect(r.weight).toBe(60);
    expect(r.targetReps).toBe(10);
  });

  it("im Ziel (Score am Ziel) => Gewicht halten", () => {
    const r = suggestWeight(EX, entry([work({ reps: 10, score: 3 })]));
    expect(r.decision).toBe("hold");
    expect(r.weight).toBe(60);
  });

  it("Versagen => Gewicht senken", () => {
    const r = suggestWeight(EX, entry([work({ reps: 5, failed: true, score: 5 })]));
    expect(r.decision).toBe("decrease");
    expect(r.weight).toBe(57.5);
  });

  it("Last reduziert => Gewicht senken", () => {
    const r = suggestWeight(EX, entry([work({ weight: 55, score: 3 })]));
    expect(r.decision).toBe("decrease");
    expect(r.weight).toBe(57.5);
  });

  it("hart, aber kein Versagen => Gewicht halten", () => {
    const r = suggestWeight(EX, entry([work({ reps: 8, score: 4 })]));
    expect(r.decision).toBe("hold");
    expect(r.weight).toBe(60);
  });

  it("Wiedereinstieg: leicht und sauber => vorsichtig erhoehen (abgerundet)", () => {
    const r = suggestWeight(EX, entry([work({ reps: 8, score: 3 })]), { reentry: true });
    expect(r.decision).toBe("increase");
    expect(r.weight).toBe(62.5);
    expect(r.targetReps).toBe(8);
  });

  it("Wiedereinstieg mit Schmerz-Flag => Gewicht halten", () => {
    const r = suggestWeight(EX, entry([work({ reps: 8, score: 3, painFlag: true })]), {
      reentry: true,
    });
    expect(r.decision).toBe("hold");
    expect(r.weight).toBe(60);
  });
});
