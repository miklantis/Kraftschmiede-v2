import { describe, it, expect } from "vitest";
import { buildEditPayload, type EditContext } from "../editSession";

// Deterministische IDs fuer stabile Vergleiche.
function idGen() {
  let n = 0;
  return () => "id" + ++n;
}

function ctx(over: Partial<EditContext> = {}): EditContext {
  return {
    sessionId: "sess1",
    durationSec: 2700,
    userId: "u1",
    rmFormula: "mean",
    date: "2026-06-20",
    exercises: [
      {
        sessionExerciseId: "se1",
        exerciseId: "ex1",
        sets: [
          { reps: 5, weight: 100, score: 3, targetReps: 5, targetWeight: 100, adjusted: false, adjustNote: "" },
          { reps: 5, weight: 100, score: 3, targetReps: 5, targetWeight: 100, adjusted: false, adjustNote: "" },
        ],
      },
    ],
    isYoungest: () => true,
    tracksRm: () => true,
    newId: idGen(),
    ...over,
  };
}

describe("buildEditPayload", () => {
  it("schreibt die Arbeitssaetze als neue work-Saetze mit Positionen", () => {
    const p = buildEditPayload(ctx());
    expect(p.exercises).toHaveLength(1);
    const rows = p.exercises[0].workSetRows;
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.kind === "work" && r.done === true)).toBe(true);
    expect(rows.map((r) => r.position)).toEqual([0, 1]);
    expect(rows[0].reps).toBe(5);
    expect(rows[0].weight).toBe(100);
  });

  it("reicht die Dauer durch", () => {
    expect(buildEditPayload(ctx({ durationSec: 1800 })).durationSec).toBe(1800);
    expect(buildEditPayload(ctx({ durationSec: null })).durationSec).toBeNull();
  });

  it("berechnet ein 1RM und schreibt es bei juengster Einheit in den Katalog", () => {
    const p = buildEditPayload(ctx());
    expect(p.exercises[0].tested1RM).not.toBeNull();
    expect(p.exercisePatches).toHaveLength(1);
    const patch = p.exercisePatches[0];
    expect(patch.id).toBe("ex1");
    expect(patch.work_weight).toBe(100);
    expect(patch.rm).not.toBeNull();
    expect(patch.rm_as_of).toBe("2026-06-20");
  });

  it("schreibt den Katalog NICHT fort, wenn es eine juengere Einheit gibt", () => {
    const p = buildEditPayload(ctx({ isYoungest: () => false }));
    // Verlaufseintrag wird trotzdem korrigiert (tested_1rm gesetzt) ...
    expect(p.exercises[0].tested1RM).not.toBeNull();
    // ... aber kein Coach-Patch.
    expect(p.exercisePatches).toHaveLength(0);
  });

  it("setzt rm nicht bei Uebungen ohne 1RM-Tracking (Koerpergewicht)", () => {
    const p = buildEditPayload(ctx({ tracksRm: () => false }));
    expect(p.exercisePatches).toHaveLength(1);
    expect(p.exercisePatches[0].work_weight).toBe(100);
    expect(p.exercisePatches[0].rm).toBeUndefined();
  });
});
