import { describe, it, expect } from "vitest";
import { parseRestore } from "@/lib/restoreData";

function validExport(): Record<string, unknown> {
  return {
    app: "Kraftschmiede",
    schemaVersion: "v2",
    inventory: { bars: [{ id: "b1", name: "Standard" }], plates: [], kettlebells: [], equipment: [] },
    exercises: [{ id: "e1", name: "Back Squat" }],
    journeys: [{ id: "j1", name: "Rückkehr", active: true }],
    phases: [{ id: "p1", journey_id: "j1", name: "Hypertrophie" }],
    sessions: [
      {
        id: "s1",
        date: "2026-06-01",
        type: "strength",
        entries: [
          {
            id: "x1",
            session_id: "s1",
            exercise_id: "e1",
            sets: [
              { id: "st1", session_exercise_id: "x1", reps: 5, weight: 20, score: 3, rir: "2", rpe: "8", scoreLabel: "im Ziel" },
              { id: "st2", session_exercise_id: "x1", reps: 5, weight: 20, score: 4, rir: "1", rpe: "9", scoreLabel: "im Ziel (hart)" },
            ],
          },
        ],
      },
    ],
    settings: { user_id: "u1", unit: "kg" },
    _scoreScale: { note: "x", map: {} },
  };
}

describe("parseRestore", () => {
  it("akzeptiert einen gueltigen V2-Export und zaehlt die Vorschau", () => {
    const res = parseRestore(JSON.stringify(validExport()));
    expect(res.preview).toEqual({
      sessions: 1,
      sets: 2,
      journeys: 1,
      exercises: 1,
    });
  });

  it("entschachtelt Einheiten in flache Tabellen und verwirft abgeleitete Satz-Felder", () => {
    const res = parseRestore(JSON.stringify(validExport()));
    expect(res.tables.sessions).toHaveLength(1);
    // session-Zeile traegt keine entries mehr
    expect("entries" in res.tables.sessions[0]).toBe(false);
    expect(res.tables.session_exercises).toHaveLength(1);
    expect("sets" in res.tables.session_exercises[0]).toBe(false);
    expect(res.tables.sets).toHaveLength(2);
    const st = res.tables.sets[0];
    expect(st.rir).toBeUndefined();
    expect(st.rpe).toBeUndefined();
    expect(st.scoreLabel).toBeUndefined();
    // gepflegte Felder bleiben
    expect(st.reps).toBe(5);
    expect(st.score).toBe(3);
    // Inventar landet unter den DB-Tabellennamen
    expect(res.tables.inventory_bars).toHaveLength(1);
    expect(res.tables.settings).toEqual({ user_id: "u1", unit: "kg" });
  });

  it("lehnt ein V1-JSON ab (kein app/schemaVersion v2)", () => {
    const v1 = { schemaVersion: "0.14", sessions: [], migrations: {} };
    expect(() => parseRestore(JSON.stringify(v1))).toThrow(/V2-Export/);
  });

  it("lehnt ungueltiges JSON ab", () => {
    expect(() => parseRestore("{ kaputt")).toThrow(/Ungueltiges JSON/);
  });

  it("behandelt fehlende Tabellen als leer", () => {
    const minimal = { app: "Kraftschmiede", schemaVersion: "v2" };
    const res = parseRestore(JSON.stringify(minimal));
    expect(res.preview).toEqual({ sessions: 0, sets: 0, journeys: 0, exercises: 0 });
    expect(res.tables.settings).toBeNull();
  });
});
