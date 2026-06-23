import { describe, it, expect } from "vitest";
import { restAdvice } from "@/engine/recovery";

describe("restAdvice", () => {
  it("ohne heutigen Eintrag: unknown", () => {
    const a = restAdvice(null);
    expect(a.level).toBe("unknown");
    expect(a.reasons.length).toBe(1);
  });

  it("alles ruhig: ok ohne Gruende", () => {
    const a = restAdvice({ legs: 0, upper_body: 1, overall: 0, readiness: 4 });
    expect(a.level).toBe("ok");
    expect(a.reasons).toEqual([]);
  });

  it("Schmerz blockt (rest)", () => {
    const a = restAdvice({ readiness: 5, pain_flag: true });
    expect(a.level).toBe("rest");
    expect(a.reasons).toContain("Schmerz gemeldet");
  });

  it("hoher Kater oder sehr niedrige Readiness -> rest", () => {
    expect(restAdvice({ overall: 3, readiness: 3 }).level).toBe("rest");
    expect(restAdvice({ legs: 3, readiness: 3 }).level).toBe("rest");
    expect(restAdvice({ upper_body: 3, readiness: 3 }).level).toBe("rest");
    expect(restAdvice({ readiness: 1 }).level).toBe("rest");
  });

  it("mittlere Werte -> caution", () => {
    expect(restAdvice({ readiness: 2 }).level).toBe("caution");
    expect(restAdvice({ overall: 2, readiness: 3 }).level).toBe("caution");
    // zwei Regionen >= 2 -> caution
    expect(
      restAdvice({ legs: 2, upper_body: 2, overall: 0, readiness: 3 }).level,
    ).toBe("caution");
  });

  it("rest schlaegt caution", () => {
    const a = restAdvice({ overall: 3, readiness: 2 });
    expect(a.level).toBe("rest");
  });
});
