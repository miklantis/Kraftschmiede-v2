import { describe, expect, it } from "vitest";
import { gcd, plateGrid, round2 } from "../math";
import { nearestLoadable, plateBreakdown } from "../plates";

describe("math", () => {
  it("gcd auf zwei Nachkommastellen", () => {
    expect(gcd(2.5, 1.25)).toBe(1.25);
    expect(gcd(5, 2.5)).toBe(2.5);
    expect(gcd(10, 15)).toBe(5);
  });

  it("plateGrid = ggT der Scheiben, Fallback 1.25", () => {
    expect(plateGrid([1.25, 2.5, 5])).toBe(1.25);
    expect(plateGrid([2.5, 5, 10])).toBe(2.5);
    expect(plateGrid([])).toBe(1.25);
  });

  it("round2 rundet auf zwei Stellen", () => {
    expect(round2(67.499)).toBe(67.5);
    expect(round2(67.504)).toBe(67.5);
  });
});

describe("plates – Ladbarkeit", () => {
  const plates = [1.25, 2.5, 5, 10, 15, 20, 25];

  it("Ziel unter Stange => Stange", () => {
    expect(nearestLoadable(10, 20, plates)).toBe(20);
  });

  it("rundet auf naechsten ladbaren Schritt (2*ggT)", () => {
    // Schritt = 2 * 1.25 = 2.5
    expect(nearestLoadable(61, 20, plates)).toBe(60);
    expect(nearestLoadable(61.5, 20, plates)).toBe(62.5);
  });

  it("roundDown rundet konsequent ab (Wiedereinstieg)", () => {
    expect(nearestLoadable(64, 20, plates, true)).toBe(62.5);
  });

  it("plateBreakdown greedy, groesste Scheibe zuerst", () => {
    const b = plateBreakdown(100, 20, plates);
    expect(b.perSide).toBe(40);
    expect(b.remainder).toBe(0);
    expect(b.plates).toEqual([
      { plate: 25, count: 1 },
      { plate: 15, count: 1 },
    ]);
  });

  it("plateBreakdown meldet Rest bei nicht exakt ladbarem Gewicht", () => {
    const b = plateBreakdown(61, 20, plates);
    expect(b.remainder).toBeGreaterThan(0);
  });
});
