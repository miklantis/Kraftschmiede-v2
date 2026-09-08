import { describe, expect, it } from "vitest";
import {
  buildPhaseViews,
  buildTemplatePhaseViews,
  totalWeeks,
  type JourneyPhaseInput,
  type PhasePlacementInfo,
} from "../journey";
import {
  buildRebuildRamp,
  buildStrengthWeekPlan,
  buildTestPhaseWeekPlan,
} from "@/engine";

function phase(over: Partial<JourneyPhaseInput> = {}): JourneyPhaseInput {
  return {
    name: "Hypertrophie",
    focus: "hypertrophy",
    weeks: 5,
    setsStart: 2,
    setsEnd: 6,
    deloadWeek: 4,
    repTargetMin: 8,
    repTargetMax: 12,
    loadPlan: null,
    weekPlan: null,
    ...over,
  };
}

const threePhases: JourneyPhaseInput[] = [
  phase({ name: "Wiedereinstieg", focus: "reentry", weeks: 2, setsStart: 2, setsEnd: 2, deloadWeek: null, repTargetMin: 5, repTargetMax: 8 }),
  phase({ name: "Hypertrophie", focus: "hypertrophy", weeks: 5 }),
  phase({ name: "Maximalkraft", focus: "strength", weeks: 4, setsStart: 3, setsEnd: 5, deloadWeek: null, repTargetMin: 4, repTargetMax: 6 }),
];

describe("buildPhaseViews", () => {
  it("markiert vergangene, aktuelle und kuenftige Phasen", () => {
    const placement: PhasePlacementInfo = {
      phaseIndex: 1,
      weekInPhase: 3,
      done: false,
    };
    const views = buildPhaseViews(threePhases, placement);
    expect(views.map((v) => v.state)).toEqual(["past", "current", "future"]);
    expect(views[0].mark).toBe("\u2713");
    expect(views[1].mark).toBe("");
    expect(views[1].isCurrent).toBe(true);
  });

  it("zeigt fuer die aktuelle Phase die Woche, sonst die Wochenzahl", () => {
    const views = buildPhaseViews(threePhases, {
      phaseIndex: 1,
      weekInPhase: 3,
      done: false,
    });
    expect(views[1].meta).toBe("Woche 3 / 5");
    expect(views[0].meta).toBe("2 Wochen");
    expect(views[2].meta).toBe("4 Wochen");
  });

  it("nutzt den Singular bei einer Woche", () => {
    const views = buildPhaseViews([phase({ weeks: 1 })], {
      phaseIndex: 1,
      weekInPhase: 1,
      done: false,
    });
    expect(views[0].meta).toBe("1 Woche");
  });

  it("bei done sind alle Phasen vergangen", () => {
    const views = buildPhaseViews(threePhases, {
      phaseIndex: 2,
      weekInPhase: 4,
      done: true,
    });
    expect(views.every((v) => v.state === "past")).toBe(true);
    expect(views.some((v) => v.isCurrent)).toBe(false);
  });

  it("zeigt die Eckwerte einer Coach-Phase als Wochenzeilen (Issue #427)", () => {
    const views = buildPhaseViews([phase()], {
      phaseIndex: 0,
      weekInPhase: 1,
      done: false,
    });
    // Satz-Rampe, Band und Ziel-Anstrengung stehen Woche fuer Woche in der
    // Tabelle; die Deload-Woche traegt ihren Vermerk neben der Wochenangabe
    // und rechts die gesenkte Satzzahl (Issue #429).
    expect(views[0].weekRows?.map((r) => r.targets)).toEqual([
      "2 \u00d7 8\u201312 \u00b7 RIR 2",
      "3 \u00d7 8\u201312 \u00b7 RIR 2",
      "4 \u00d7 8\u201312 \u00b7 RIR 2",
      "3 \u00d7 8\u201312 \u00b7 RIR 2",
      "6 \u00d7 8\u201312 \u00b7 RIR 2",
    ]);
    expect(views[0].weekRows?.[3].label).toBe("Woche 4 \u00b7 Deload");
    // Die Kachel darueber waere nur die Zusammenfassung derselben Zahlen.
    expect(views[0].detail).toEqual([]);
  });

  it("zeigt keine Satz-Rampe, wenn Start und Ende gleich sind, und keinen Deload", () => {
    const views = buildPhaseViews(
      [phase({ setsStart: 3, setsEnd: 3, deloadWeek: null, repTargetMin: null, repTargetMax: null })],
      { phaseIndex: 0, weekInPhase: 1, done: false },
    );
    // Ohne Vorgabeband bleibt es in den Zeilen bei der Satzzahl, und genau eine
    // Kachelzeile sagt, woher das Band stattdessen kommt.
    expect(views[0].weekRows?.map((r) => r.targets)).toEqual([
      "3 S\u00e4tze \u00b7 RIR 2",
      "3 S\u00e4tze \u00b7 RIR 2",
      "3 S\u00e4tze \u00b7 RIR 2",
      "3 S\u00e4tze \u00b7 RIR 2",
      "3 S\u00e4tze \u00b7 RIR 2",
    ]);
    // Ohne Deload traegt keine Woche einen Vermerk.
    expect(views[0].weekRows?.map((r) => r.label)).toEqual([
      "Woche 1",
      "Woche 2",
      "Woche 3",
      "Woche 4",
      "Woche 5",
    ]);
    expect(views[0].detail).toEqual([
      { k: "Wiederholungsband", v: "je \u00dcbung" },
    ]);
  });
});

describe("buildPhaseViews \u2013 Lastliste", () => {
  const rampe: JourneyPhaseInput[] = [
    phase({ name: "Tasten", weeks: 1, loadPlan: [{ week: 1, loadPct: 0.65 }] }),
    phase({ name: "Standort", weeks: 1, loadPlan: [{ week: 1, loadPct: 1 }] }),
  ];

  // Ein Block, der ueber drei Wochen von 65 auf 95 Prozent wandert - der Fall,
  // fuer den eine einzelne Zahl je Phase nicht mehr reicht.
  const block: JourneyPhaseInput[] = [
    phase({
      name: "Wiederaufbau",
      weeks: 3,
      loadPlan: [
        { week: 1, loadPct: 0.65 },
        { week: 2, loadPct: 0.8 },
        { week: 3, loadPct: 0.95 },
      ],
    }),
    phase({ name: "Test/Peak", weeks: 1, loadPlan: null }),
  ];

  it("nennt den Anteil jeder Phase in ihrer Wochentabelle statt als Zeile", () => {
    const views = buildPhaseViews(rampe, {
      phaseIndex: 0,
      weekInPhase: 1,
      done: false,
    });
    // Die Tabelle fuehrt den Anteil je Woche auf - eine Detailzeile daneben
    // waere dieselbe Zahl ein zweites Mal (Issue #362).
    expect(views[0].detail.map((d) => d.k)).not.toContain("Vorgegebene Last");
    expect(views[0].weekRows?.[0].targets).toBe("6 \u00d7 8\u201312 \u00b7 RIR 2 \u00b7 65 %");
    expect(views[1].weekRows?.[0].targets).toBe("6 \u00d7 8\u201312 \u00b7 RIR 2 \u00b7 100 %");
  });

  it("zeigt an der laufenden Phase den Anteil der laufenden Woche", () => {
    const views = buildPhaseViews(block, {
      phaseIndex: 0,
      weekInPhase: 2,
      done: false,
    });
    expect(views[0].weekRows?.[1].targets).toBe("4 \u00d7 8\u201312 \u00b7 RIR 2 \u00b7 80 %");
    expect(views[0].weekRows?.[1].state).toBe("current");
    expect(views[0].loadNote).toContain("80 %");
  });

  it("hakt an einer vergangenen Phase alle Wochen ab", () => {
    // Phase 2 laeuft: der Block liegt hinter uns, seine Wochen sind alle durch.
    const views = buildPhaseViews(block, {
      phaseIndex: 1,
      weekInPhase: 1,
      done: false,
    });
    const rows = views[0].weekRows!;
    expect(rows.map((r) => r.targets)).toEqual([
      "2 \u00d7 8\u201312 \u00b7 RIR 2 \u00b7 65 %",
      "4 \u00d7 8\u201312 \u00b7 RIR 2 \u00b7 80 %",
      "6 \u00d7 8\u201312 \u00b7 RIR 2 \u00b7 95 %",
    ]);
    expect(rows.every((r) => r.state === "past")).toBe(true);
    expect(rows.every((r) => r.mark === "✓")).toBe(true);
  });

  it("sagt an einer Phase ohne eigene Liste, dass es keine Vorgabe gibt", () => {
    const views = buildPhaseViews(block, {
      phaseIndex: 0,
      weekInPhase: 1,
      done: false,
    });
    // Die Tabelle der Phase traegt Saetze und Band; von der Kachel bleibt nur
    // der Vermerk, dass diese Phase keine Last vorgibt.
    expect(views[1].detail).toEqual([
      { k: "Vorgegebene Last", v: "keine" },
    ]);
    expect(views[1].loadNote).toBeNull();
  });

  it("erklaert die Vorgabe nur an der laufenden Phase", () => {
    const views = buildPhaseViews(rampe, {
      phaseIndex: 0,
      weekInPhase: 1,
      done: false,
    });
    expect(views[0].loadNote).toContain("65 %");
    expect(views[1].loadNote).toBeNull();
  });

  it("sagt in der letzten Phase, dass die Vorgabe endet", () => {
    const views = buildPhaseViews(rampe, {
      phaseIndex: 1,
      weekInPhase: 1,
      done: false,
    });
    expect(views[1].loadNote).toContain("endet");
  });

  it("laesst Journeys ohne Lastliste unveraendert", () => {
    const views = buildPhaseViews([phase()], {
      phaseIndex: 0,
      weekInPhase: 1,
      done: false,
    });
    // Ohne Lastvorgabe in der Journey traegt die Tabelle alles - die Kachel
    // entfaellt.
    expect(views[0].detail).toEqual([]);
    expect(views[0].weekRows).not.toBeNull();
    expect(views[0].loadNote).toBeNull();
  });
});

describe("buildPhaseViews – Wochenplan", () => {
  // Kraftphase ueber 4 Wochen (Leiter 5, 4, 3, 2) plus Kombiwoche - genau der
  // Aufbau, den der Kraftblock einer Journey hat.
  const kraft = phase({
    name: "Maximalkraft",
    focus: "strength",
    weeks: 4,
    setsStart: 4,
    setsEnd: 4,
    deloadWeek: null,
    repTargetMin: 4,
    repTargetMax: 6,
    weekPlan: buildStrengthWeekPlan(4),
  });
  const test = phase({
    name: "Übergang / Test",
    focus: "test",
    weeks: 2,
    setsStart: 3,
    setsEnd: 3,
    deloadWeek: null,
    weekPlan: buildTestPhaseWeekPlan(2),
  });
  const nurTest = phase({
    name: "Standort",
    focus: "test",
    weeks: 1,
    setsStart: 3,
    setsEnd: 3,
    deloadWeek: null,
    weekPlan: buildTestPhaseWeekPlan(1),
  });

  it("zeigt an der laufenden Phase die Wochentabelle", () => {
    const views = buildPhaseViews([kraft, test], {
      phaseIndex: 0,
      weekInPhase: 3,
      done: false,
    });
    const rows = views[0].weekRows!;
    expect(rows.map((r) => r.label)).toEqual([
      "Woche 1",
      "Woche 2",
      "Woche 3",
      "Woche 4",
    ]);
    expect(rows[2].targets).toBe("4 × 3 · RIR 1");
    expect(rows.map((r) => r.state)).toEqual([
      "past",
      "past",
      "current",
      "future",
    ]);
    expect(rows[0].mark).toBe("✓");
    expect(rows[2].mark).toBe("");
    // Kraftwochen laufen auf vollem Arbeitsgewicht - kein Vermerk neben der
    // Woche und kein Lastanteil in der Zeile (#431).
    expect(rows.map((r) => r.label)).toEqual([
      "Woche 1",
      "Woche 2",
      "Woche 3",
      "Woche 4",
    ]);
  });

  it("zeigt die Tabelle auch an einer Phase, die nicht laeuft", () => {
    const views = buildPhaseViews([kraft, test], {
      phaseIndex: 1,
      weekInPhase: 1,
      done: false,
    });
    // Die Kraftphase liegt hinter uns: alle Wochen abgehakt (Issue #366).
    const rows = views[0].weekRows!;
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.state === "past")).toBe(true);
    expect(rows.every((r) => r.mark === "✓")).toBe(true);
  });

  it("stellt die Wochen einer kuenftigen Phase blass", () => {
    const views = buildPhaseViews([kraft, test], {
      phaseIndex: 0,
      weekInPhase: 1,
      done: false,
    });
    const rows = views[1].weekRows!;
    expect(rows.every((r) => r.state === "future")).toBe(true);
    expect(rows.every((r) => r.mark === "")).toBe(true);
  });

  it("zeigt die laufende Testphase als Wochenplan wie jede andere Planphase", () => {
    const views = buildPhaseViews([kraft, test], {
      phaseIndex: 1,
      weekInPhase: 1,
      done: false,
    });
    const rows = views[1].weekRows!;
    // Entlastung und Test stehen als Vermerk neben der Woche, der Lastanteil
    // der Entlastung in der Zeile (#431).
    expect(rows.map((r) => r.label)).toEqual([
      "Woche 1 · Entlastung",
      "Woche 2 · Test",
    ]);
    expect(rows[0].targets).toBe("2 × 3–5 · RIR 3 · 60 %");
    // Die Testwoche plant nichts - dort steht der Test statt Zahlen.
    expect(rows[1].targets).toBe("1RM-Test");
    // Wie bei allen Planphasen traegt die Tabelle alles (#362).
    expect(views[1].detail).toEqual([]);
  });

  it("zeigt an der laufenden einwoechigen Testphase nur die Testwoche", () => {
    const views = buildPhaseViews([kraft, nurTest], {
      phaseIndex: 1,
      weekInPhase: 1,
      done: false,
    });
    const rows = views[1].weekRows!;
    expect(rows).toHaveLength(1);
    expect(rows[0].targets).toBe("1RM-Test");
  });

  it("zeigt auch eine nicht laufende Testphase als Wochen", () => {
    const views = buildPhaseViews([kraft, test, nurTest], {
      phaseIndex: 0,
      weekInPhase: 1,
      done: false,
    });
    // Statt einer Zusammenfassung stehen die Wochen selbst da (Issue #366).
    expect(views[1].weekRows?.map((r) => r.targets)).toEqual([
      "2 × 3–5 · RIR 3 · 60 %",
      "1RM-Test",
    ]);
    expect(views[1].detail).toEqual([]);
    // Eine einwoechige Testphase besteht nur aus der Testwoche.
    expect(views[2].weekRows?.map((r) => r.targets)).toEqual(["1RM-Test"]);
    expect(views[2].detail).toEqual([]);
  });

  it("laesst die Detailzeilen weg, wo die Wochentabelle sie schon traegt", () => {
    const views = buildPhaseViews([kraft, test], {
      phaseIndex: 0,
      weekInPhase: 1,
      done: false,
    });
    // Die laufende Kraftphase zeigt ihre Wochentabelle - die Eckwerte darueber
    // waeren nur deren Zusammenfassung (Issue #362).
    expect(views[0].weekRows).not.toBeNull();
    expect(views[0].detail).toEqual([]);
  });

  it("gibt auch Phasen ohne Wochenliste ihre Wochen (Issue #427)", () => {
    const views = buildPhaseViews(threePhases, {
      phaseIndex: 1,
      weekInPhase: 1,
      done: false,
    });
    // Coach-Phasen tragen keine Wochenliste - ihre Zeilen entstehen aus
    // Satz-Rampe und Band, statt dass die Phase ohne Tabelle dasteht.
    expect(views.every((v) => v.weekRows !== null)).toBe(true);
    expect(views[1].weekRows?.[0].targets).toBe("2 \u00d7 8\u201312 \u00b7 RIR 2");
    expect(views[1].detail).toEqual([]);
  });
});

// Zweiter Bauweg derselben Tabelle: Der Wiederaufbau gibt nur die Last vor -
// Saetze und Wiederholungen bleiben beim Coach - und traegt deshalb gar keine
// Wochenliste. Seine Laststufen stehen trotzdem als Wochentabelle da.
describe("buildPhaseViews – Wochentabelle aus der Lastliste", () => {
  const wiederaufbau = phase({
    name: "Wiederaufbau",
    focus: "rebuild",
    weeks: 3,
    setsStart: 2,
    setsEnd: 4,
    deloadWeek: null,
    repTargetMin: 6,
    repTargetMax: 10,
    loadPlan: buildRebuildRamp(3, 0.65, 0.95),
    weekPlan: null,
  });

  it("zeigt an der laufenden Phase je Woche ihren Lastanteil", () => {
    const views = buildPhaseViews([wiederaufbau], {
      phaseIndex: 0,
      weekInPhase: 2,
      done: false,
    });
    const rows = views[0].weekRows!;
    expect(rows.map((r) => r.label)).toEqual(["Woche 1", "Woche 2", "Woche 3"]);
    expect(rows.map((r) => r.targets)).toEqual([
      "2 \u00d7 6\u201310 \u00b7 RIR 2 \u00b7 65 %",
      "3 \u00d7 6\u201310 \u00b7 RIR 2 \u00b7 80 %",
      "4 \u00d7 6\u201310 \u00b7 RIR 2 \u00b7 95 %",
    ]);
    expect(rows.map((r) => r.state)).toEqual(["past", "current", "future"]);
    expect(rows[0].mark).toBe("✓");
    expect(rows[1].mark).toBe("");
  });

  it("gibt jeder Phasenwoche eine Zeile, auch wenn die Liste kuerzer ist", () => {
    const views = buildPhaseViews(
      [
        phase({
          ...wiederaufbau,
          weeks: 4,
          loadPlan: buildRebuildRamp(3, 0.65, 0.95),
        }),
      ],
      { phaseIndex: 0, weekInPhase: 1, done: false },
    );
    const rows = views[0].weekRows!;
    expect(rows).toHaveLength(4);
    // Hinter der Liste haelt die Vorgabe auf ihrem letzten Wert.
    expect(rows[3].targets).toBe("4 \u00d7 6\u201310 \u00b7 RIR 2 \u00b7 95 %");
  });

  it("zeigt die Tabelle in der Vorschau neutral, ohne laufende Woche", () => {
    const rows = buildTemplatePhaseViews([wiederaufbau])[0].weekRows!;
    expect(rows.map((r) => r.targets)).toEqual([
      "2 \u00d7 6\u201310 \u00b7 RIR 2 \u00b7 65 %",
      "3 \u00d7 6\u201310 \u00b7 RIR 2 \u00b7 80 %",
      "4 \u00d7 6\u201310 \u00b7 RIR 2 \u00b7 95 %",
    ]);
    expect(rows.every((r) => r.state === "preview")).toBe(true);
    expect(rows.every((r) => r.mark === "")).toBe(true);
  });

  it("laesst neben der Lasttabelle nur die Zeilen stehen, die sie nicht traegt", () => {
    const views = buildPhaseViews([wiederaufbau], {
      phaseIndex: 0,
      weekInPhase: 2,
      done: false,
    });
    // Die Tabelle traegt Saetze, Band und Last in einer Zeile - daneben bleibt
    // nichts mehr zu sagen (Issue #427).
    expect(views[0].detail).toEqual([]);
    expect(views[0].loadNote).toContain("80 %");
    // In der Vorschau gilt dasselbe.
    expect(buildTemplatePhaseViews([wiederaufbau])[0].detail).toEqual([]);
  });
});

describe("buildTemplatePhaseViews", () => {
  it("stellt alle Phasen neutral dar, ohne aktuelle oder vergangene", () => {
    const views = buildTemplatePhaseViews(threePhases);
    expect(views.map((v) => v.state)).toEqual([
      "preview",
      "preview",
      "preview",
    ]);
    expect(views.every((v) => !v.isCurrent)).toBe(true);
    expect(views.every((v) => v.mark === "")).toBe(true);
    expect(views.every((v) => v.loadNote === null)).toBe(true);
  });

  it("zeigt je Phase die Dauer als Meta-Zeile", () => {
    const views = buildTemplatePhaseViews([
      phase({ weeks: 1 }),
      phase({ weeks: 4 }),
    ]);
    expect(views[0].meta).toBe("1 Woche");
    expect(views[1].meta).toBe("4 Wochen");
  });

  it("liefert dieselben Detailzeilen wie die Journey-Ansicht", () => {
    const views = buildTemplatePhaseViews([phase()]);
    expect(views[0].detail).toEqual(
      buildPhaseViews([phase()], {
        phaseIndex: 0,
        weekInPhase: 1,
        done: false,
      })[0].detail,
    );
  });

  it("zeigt die Laststufen der Vorlage als Wochen", () => {
    const views = buildTemplatePhaseViews([
      phase({
        weeks: 3,
        loadPlan: [
          { week: 1, loadPct: 0.65 },
          { week: 2, loadPct: 0.8 },
          { week: 3, loadPct: 0.95 },
        ],
      }),
    ]);
    expect(views[0].weekRows?.map((r) => r.targets)).toEqual([
      "2 \u00d7 8\u201312 \u00b7 RIR 2 \u00b7 65 %",
      "4 \u00d7 8\u201312 \u00b7 RIR 2 \u00b7 80 %",
      "6 \u00d7 8\u201312 \u00b7 RIR 2 \u00b7 95 %",
    ]);
    expect(views[0].detail.map((d) => d.k)).not.toContain("Vorgegebene Last");
  });

  it("sagt an einer Phase ohne eigene Liste, dass es keine Vorgabe gibt", () => {
    const views = buildTemplatePhaseViews([
      phase({ loadPlan: [{ week: 1, loadPct: 0.65 }] }),
      phase({ loadPlan: null }),
    ]);
    expect(views[1].weekRows).not.toBeNull();
    expect(views[1].detail).toEqual([
      { k: "Vorgegebene Last", v: "keine" },
    ]);
  });
});

describe("totalWeeks", () => {
  it("summiert die Wochen aller Phasen", () => {
    expect(totalWeeks(threePhases)).toBe(11);
    expect(totalWeeks([])).toBe(0);
  });
});
