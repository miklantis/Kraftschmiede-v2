import { describe, expect, it } from "vitest";
import {
  MUSCLES,
  MUSCLE_LOAD,
  kategorieToValue,
  regionsForGroup,
  regionsForSection,
  expand,
  muscleValuesFromRows,
} from "@/lib/muscles";

describe("Registry", () => {
  it("kennt genau die 14 SVG-Regionen", () => {
    expect(MUSCLES).toHaveLength(14);
    expect(MUSCLES.map((m) => m.id)).toContain("brust");
    expect(MUSCLES.map((m) => m.id)).toContain("quadrizeps");
  });
});

describe("kategorieToValue", () => {
  it("mappt die drei Kategorien auf die MUSCLE_LOAD-Werte", () => {
    expect(kategorieToValue("primaer")).toBe(MUSCLE_LOAD.primaer);
    expect(kategorieToValue("sekundaer")).toBe(MUSCLE_LOAD.sekundaer);
    expect(kategorieToValue("stabilisierend")).toBe(MUSCLE_LOAD.stabilisierend);
  });
});

describe("regionsForGroup / regionsForSection", () => {
  it("loest 'ruecken' auf die drei Ruecken-Regionen auf", () => {
    expect(regionsForGroup("ruecken").sort()).toEqual(
      ["latissimus", "ruecken_mitte", "trapez"].sort(),
    );
  });
  it("liefert fuer unbekannte Gruppe eine leere Liste", () => {
    expect(regionsForGroup("nichtda")).toEqual([]);
  });
  it("loest 'unterkoerper' ueber die Gruppen auf die Bein-/Gesaess-Regionen auf", () => {
    expect(regionsForSection("unterkoerper").sort()).toEqual(
      ["beinbeuger", "gesaess", "quadrizeps", "waden"].sort(),
    );
  });
});

describe("expand", () => {
  it("uebernimmt Region-Keys direkt", () => {
    expect(expand({ brust: 1 })).toEqual({ brust: 1 });
  });

  it("verteilt einen Gruppen-Wert auf alle Regionen der Gruppe", () => {
    const out = expand({ ruecken: 0.5 });
    expect(out).toEqual({ trapez: 0.5, ruecken_mitte: 0.5, latissimus: 0.5 });
  });

  it("verteilt einen Sektions-Wert ueber die Gruppen auf die Regionen", () => {
    const out = expand({ unterkoerper: 0.8 });
    expect(out).toEqual({
      gesaess: 0.8,
      beinbeuger: 0.8,
      waden: 0.8,
      quadrizeps: 0.8,
    });
  });

  it("laesst Region vor Gruppe vor Sektion gewinnen (Spezifitaet)", () => {
    // brust direkt = 1; brust via oberkoerper = 0.2 -> direkt gewinnt.
    // bizeps nur via oberkoerper -> 0.2.
    const out = expand({ oberkoerper: 0.2, brust: 1 });
    expect(out.brust).toBe(1);
    expect(out.bizeps).toBe(0.2);
  });

  it("fuehrt mehrere Treffer auf derselben Ebene ueber das Maximum zusammen", () => {
    // arme (Sektion) und arme (Gruppe gibt es nicht als Section-Doppel) –
    // hier zwei Gruppen, die dieselbe Region treffen: core deckt bauch ab,
    // oberkoerper deckt core mit ab -> beide auf Sektions-/Gruppenebene gemischt.
    const out = expand({ arme: 0.3 });
    expect(out.bizeps).toBe(0.3);
    expect(out.trizeps).toBe(0.3);
  });

  it("ignoriert unbekannte und nicht-numerische Keys", () => {
    const out = expand({ unbekannt: 1, brust: Number.NaN, trizeps: 0.4 });
    expect(out).toEqual({ trizeps: 0.4 });
  });
});

describe("muscleValuesFromRows", () => {
  it("baut aus DB-Zeilen die Region->Wert-Map ueber MUSCLE_LOAD", () => {
    const out = muscleValuesFromRows([
      { region_id: "brust", kategorie: "primaer" },
      { region_id: "trizeps", kategorie: "sekundaer" },
      { region_id: "schultern_vorne", kategorie: "sekundaer" },
    ]);
    expect(out).toEqual({
      brust: 1.0,
      trizeps: 0.55,
      schultern_vorne: 0.55,
    });
  });
});
