import { describe, expect, it } from "vitest";
import { hadDeviation, metTarget, workSets } from "../target";
import { generateWarmup } from "../warmup";
import { recoveryCheck } from "../recovery";
import type { EngineSet } from "../types";

describe("metTarget", () => {
  it("Aufwaermen ergibt null", () => {
    expect(metTarget({ type: "warmup", weight: 60, reps: 5 })).toBe(null);
  });

  it("ohne Ziel ergibt null", () => {
    expect(metTarget({ type: "work", weight: 60, reps: 5 })).toBe(null);
  });

  it("Ziel erreicht => true", () => {
    expect(
      metTarget({ type: "work", weight: 60, reps: 8, targetReps: 8, targetWeight: 60 }),
    ).toBe(true);
  });

  it("Gewicht reduziert => false", () => {
    expect(
      metTarget({ type: "work", weight: 55, reps: 8, targetReps: 8, targetWeight: 60 }),
    ).toBe(false);
  });

  it("vorzeitig versagt unter Zielreps => false", () => {
    expect(
      metTarget({
        type: "work",
        weight: 60,
        reps: 6,
        failed: true,
        targetReps: 8,
        targetWeight: 60,
      }),
    ).toBe(false);
  });
});

describe("workSets / hadDeviation", () => {
  const entry = {
    sets: [
      { type: "warmup", weight: 40, reps: 5 } as EngineSet,
      { type: "work", weight: 60, reps: 8, targetReps: 8, targetWeight: 60 } as EngineSet,
      { type: "work", weight: 60, reps: 6, targetReps: 8, targetWeight: 60 } as EngineSet,
    ],
  };

  it("workSets filtert Aufwaermen heraus", () => {
    expect(workSets(entry).length).toBe(2);
    expect(workSets(null).length).toBe(0);
  });

  it("hadDeviation erkennt verfehltes Ziel", () => {
    expect(hadDeviation(workSets(entry))).toBe(true);
  });

  it("hadDeviation false wenn alle im Ziel", () => {
    const ws: EngineSet[] = [
      { type: "work", weight: 60, reps: 8, targetReps: 8, targetWeight: 60 },
    ];
    expect(hadDeviation(ws)).toBe(false);
  });
});

describe("generateWarmup", () => {
  const plates = [1.25, 2.5, 5, 10, 15, 20, 25];

  it("kein Aufwaermen wenn Arbeit <= Stange", () => {
    expect(generateWarmup(20, 20, plates)).toEqual([]);
    expect(generateWarmup(15, 20, plates)).toEqual([]);
  });

  it("startet mit leerer Stange", () => {
    const w = generateWarmup(100, 20, plates);
    expect(w[0]).toMatchObject({ weight: 20, type: "warmup" });
    expect(w.length).toBeGreaterThan(1);
  });

  it("Saetze steigen monoton bis unter das Arbeitsgewicht", () => {
    const w = generateWarmup(100, 20, plates);
    for (let i = 1; i < w.length; i++) {
      expect(w[i]!.weight).toBeGreaterThan(w[i - 1]!.weight);
      expect(w[i]!.weight).toBeLessThan(100);
    }
  });

  it("Reps sinken mit steigender Last (Priming)", () => {
    const w = generateWarmup(120, 20, plates);
    const last = w[w.length - 1]!;
    expect(last.reps).toBeLessThanOrEqual(5);
  });

  it("Deadlift begrenzt das Aufwaermvolumen (max 3 Reps in Zwischenstufen)", () => {
    const w = generateWarmup(120, 20, plates, { isDeadlift: true });
    // Stange (Index 0) darf 5 sein, Zwischenstufen <= 3
    for (let i = 1; i < w.length; i++) {
      expect(w[i]!.reps).toBeLessThanOrEqual(3);
    }
  });
});

describe("recoveryCheck", () => {
  it("alles gruen => ok", () => {
    const r = recoveryCheck(true, { legs: 1, readiness: 4 });
    expect(r.ok).toBe(true);
  });

  it("Zeitfenster nicht erfuellt => nicht ok", () => {
    expect(recoveryCheck(false, { readiness: 5 }).ok).toBe(false);
  });

  it("Kater = 3 blockt trotz Zeitfenster", () => {
    const r = recoveryCheck(true, { legs: 3, readiness: 5 });
    expect(r.bodyOk).toBe(false);
    expect(r.ok).toBe(false);
  });

  it("niedrige Readiness blockt", () => {
    expect(recoveryCheck(true, { readiness: 1 }).ok).toBe(false);
  });

  it("Schmerz wird gewarnt, blockt aber nicht allein", () => {
    const r = recoveryCheck(true, { pain: { knee: true }, readiness: 4 });
    expect(r.painWarn).toBe(true);
    expect(r.ok).toBe(true);
  });
});
