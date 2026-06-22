import { describe, expect, it } from "vitest";
import { skillAdvice, skillSessionResult, skillSetMet } from "../skills";
import type { SkillDef, SkillPhaseExercise, SkillWorkExercise } from "../types";

describe("skillSetMet", () => {
  it("reps erfuellt / am Ziel / unter Ziel", () => {
    expect(skillSetMet("reps", 5, { value: 6, done: true })).toBe(true);
    expect(skillSetMet("reps", 5, { value: 5, done: true })).toBe(true);
    expect(skillSetMet("reps", 5, { value: 4, done: true })).toBe(false);
  });
  it("nicht abgehakt => nicht erfuellt", () => {
    expect(skillSetMet("reps", 5, { value: 9, done: false })).toBe(false);
  });
  it("duration am Ziel / unter Ziel", () => {
    expect(skillSetMet("duration", 30, { value: 30, done: true })).toBe(true);
    expect(skillSetMet("duration", 30, { value: 20, done: true })).toBe(false);
  });
  it("unbekannte Metrik defensiv false", () => {
    expect(skillSetMet("distance", 4, { value: 99, done: true })).toBe(false);
  });
});

describe("skillSessionResult", () => {
  const P1: SkillPhaseExercise[] = [{ metric: "reps", target: 8, sets: 3 }];

  it("completed (alle 3 done & im Ziel)", () => {
    const w: SkillWorkExercise[] = [
      { sets: [{ value: 8, done: true }, { value: 9, done: true }, { value: 8, done: true }] },
    ];
    expect(skillSessionResult(P1, w)).toBe("completed");
  });
  it("missed (ein Satz unter Ziel)", () => {
    const w: SkillWorkExercise[] = [
      { sets: [{ value: 8, done: true }, { value: 5, done: true }, { value: 8, done: true }] },
    ];
    expect(skillSessionResult(P1, w)).toBe("missed");
  });
  it("missed (nur 2 von 3 Saetzen done)", () => {
    const w: SkillWorkExercise[] = [
      { sets: [{ value: 8, done: true }, { value: 8, done: true }] },
    ];
    expect(skillSessionResult(P1, w)).toBe("missed");
  });
  it("skipped (kein Satz done)", () => {
    const w: SkillWorkExercise[] = [
      {
        sets: [
          { value: null, done: false },
          { value: null, done: false },
          { value: null, done: false },
        ],
      },
    ];
    expect(skillSessionResult(P1, w)).toBe("skipped");
  });

  const Pmix: SkillPhaseExercise[] = [
    { metric: "duration", target: 30, sets: 3 },
    { metric: "reps", target: 5, sets: 3 },
  ];
  it("mixed completed (beide Uebungen voll im Ziel)", () => {
    const w: SkillWorkExercise[] = [
      { sets: [{ value: 30, done: true }, { value: 32, done: true }, { value: 31, done: true }] },
      { sets: [{ value: 5, done: true }, { value: 6, done: true }, { value: 5, done: true }] },
    ];
    expect(skillSessionResult(Pmix, w)).toBe("completed");
  });
  it("mixed missed (eine Uebung daneben)", () => {
    const w: SkillWorkExercise[] = [
      { sets: [{ value: 30, done: true }, { value: 30, done: true }, { value: 30, done: true }] },
      { sets: [{ value: 5, done: true }, { value: 3, done: true }, { value: 5, done: true }] },
    ];
    expect(skillSessionResult(Pmix, w)).toBe("missed");
  });
});

describe("skillAdvice", () => {
  const pull: SkillDef = {
    phases: [
      { index: 0, equipment: ["pullup-bar"], consecutiveSessions: 2, exercises: [{}] },
      { index: 1, equipment: ["pullup-bar", "band-light"], consecutiveSessions: 2, exercises: [{}] },
    ],
  };

  it("Phase 0 Equipment vorhanden", () => {
    const a = skillAdvice(pull, { currentPhase: 0, consecutiveCount: 0 }, ["pullup-bar"]);
    expect(a.equipmentMissing).toBe(false);
    expect(a.phaseIndex).toBe(0);
  });
  it("Phase 1 Band fehlt => Tor", () => {
    const a = skillAdvice(pull, { currentPhase: 1, consecutiveCount: 0 }, ["pullup-bar"]);
    expect(a.equipmentMissing).toBe(true);
    expect(a.missingEquipment.join(",")).toBe("band-light");
  });
  it("readyToAdvance (count+1>=need)", () => {
    expect(
      skillAdvice(pull, { currentPhase: 0, consecutiveCount: 1 }, ["pullup-bar"]).readyToAdvance,
    ).toBe(true);
  });
  it("noch nicht aufstiegsreif", () => {
    expect(
      skillAdvice(pull, { currentPhase: 0, consecutiveCount: 0 }, ["pullup-bar"]).readyToAdvance,
    ).toBe(false);
  });
  it("currentPhase ueber Ende => clamp; mastered durchgereicht & nicht aufstiegsreif", () => {
    const a = skillAdvice(pull, { currentPhase: 9, consecutiveCount: 0, mastered: true }, [
      "pullup-bar",
      "band-light",
    ]);
    expect(a.phaseIndex).toBe(1);
    expect(a.mastered).toBe(true);
    expect(a.readyToAdvance).toBe(false);
  });
});
