import { describe, it, expect } from "vitest";

import { analysiereV1 } from "@/lib/v1import";

// Repraesentativer Mini-Blob im V1-Format: Inventar, eine Uebung mit feiner
// Muskel-Map, eine Vorlage, eine Journey mit zwei Phasen, eine Kraft-Einheit
// (Aufwaerm- + Arbeitssaetze) und eine Skill-Einheit (skillWork), dazu
// Skill-Fortschritt, Body-Log und eine Messung.
const blob = {
  schemaVersion: "0.14",
  settings: { rmFormula: "mean", unit: "kg" },
  inventory: {
    bars: [{ id: "bar_std", name: "Standard", weight: 20, default: true }],
    plates: [2.5, 5, 10],
    kettlebells: [16, 24],
    equipment: [{ id: "pullup-bar", label: "Klimmzugstange", active: true }],
  },
  exercises: [
    {
      id: "back_squat",
      name: "Back Squat",
      muscles: { quadrizeps: "primaer", gesaess: "primaer" },
    },
  ],
  templates: [
    {
      id: "t_a",
      name: "A",
      items: [
        { exerciseId: "back_squat", role: "primary" },
        { exerciseId: "back_squat", role: "secondary" },
      ],
    },
  ],
  journeys: [
    {
      id: "j_1",
      name: "Rückkehr 2026",
      active: true,
      phases: [
        { id: "p0", name: "Wiedereinstieg", focus: "reentry", weeks: 2 },
        { id: "p1", name: "Hypertrophie", focus: "hypertrophy", weeks: 5 },
      ],
    },
  ],
  sessions: [
    {
      id: "s_1",
      date: "2026-06-01",
      journeyId: "j_1",
      phaseId: "p0",
      templateId: "t_a",
      status: "done",
      entries: [
        {
          exerciseId: "back_squat",
          warmupSets: [{ reps: 5, weight: 20, done: true }],
          sets: [
            { reps: 8, weight: 60, done: true },
            { reps: 8, weight: 60, done: true },
          ],
        },
      ],
    },
    {
      id: "sk_1",
      date: "2026-06-02",
      type: "skill",
      status: "done",
      skillWork: {
        skillId: "strict_pullup",
        phase: 0,
        result: "completed",
        exercises: [
          {
            name: "Dead Hang",
            metric: "duration",
            sets: [{ value: 30, done: true, met: true }],
          },
        ],
      },
    },
  ],
  skillProgress: [
    { skillId: "strict_pullup", active: true, currentPhase: 1, consecutiveCount: 1 },
  ],
  bodyLog: [{ date: "2026-06-01", legs: 1, overall: 0, readiness: 3 }],
  composition: [{ date: "2026-06-03", weight: 91.2, bodyFatPct: 20 }],
};

function zahl(text: string, label: string): number {
  const v = analysiereV1(text);
  const eintrag = v.zeilen.find((z) => z.label === label);
  return eintrag?.anzahl ?? -1;
}

describe("analysiereV1 – Vorschau-Zählung", () => {
  const text = JSON.stringify(blob);

  it("wirft bei ungültigem JSON", () => {
    expect(() => analysiereV1("{kein json")).toThrow();
  });

  it("wirft bei leerem Objekt", () => {
    expect(() => analysiereV1("{}")).toThrow();
  });

  it("zählt Inventar korrekt", () => {
    expect(zahl(text, "Stangen")).toBe(1);
    expect(zahl(text, "Scheiben")).toBe(3);
    expect(zahl(text, "Kettlebells")).toBe(2);
    expect(zahl(text, "Equipment")).toBe(1);
  });

  it("zählt Übungen und feine Muskel-Zuordnungen", () => {
    expect(zahl(text, "Übungen")).toBe(1);
    expect(zahl(text, "Muskel-Zuordnungen")).toBe(2);
  });

  it("zählt Vorlagen samt ihrer Übungen", () => {
    expect(zahl(text, "Workout-Vorlagen")).toBe(1);
    expect(zahl(text, "Vorlagen-Übungen")).toBe(2);
  });

  it("zählt Journeys und Phasen", () => {
    expect(zahl(text, "Journeys")).toBe(1);
    expect(zahl(text, "Journey-Phasen")).toBe(2);
  });

  it("zählt Einheiten über beide Typen (Kraft + Skill)", () => {
    expect(zahl(text, "Einheiten")).toBe(2);
    // 1 Kraft-Übung + 1 Skill-Übung
    expect(zahl(text, "Einheit-Übungen")).toBe(2);
    // Kraft: 1 Warmup + 2 Arbeitssätze; Skill: 1 Satz => 4
    expect(zahl(text, "Sätze")).toBe(4);
  });

  it("zählt Fortschritt, Body-Log und Messungen", () => {
    expect(zahl(text, "Skill-Fortschritt")).toBe(1);
    expect(zahl(text, "Body-Log")).toBe(1);
    expect(zahl(text, "Messungen")).toBe(1);
  });
});
