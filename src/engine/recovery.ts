// Erholungs-Check vor einer Einheit. Der Koerperzustand schlaegt das Zeitfenster:
// hoher Kater (=3) oder niedrige Readiness blockt, auch wenn das Zeitfenster passt.

import type { BodyState } from "./types";

export interface RecoveryResult {
  ok: boolean;
  slotHoursOk: boolean;
  bodyOk: boolean;
  painWarn: boolean;
}

export function recoveryCheck(
  slotHoursOk: boolean,
  bodyState?: BodyState,
): RecoveryResult {
  const bs = bodyState ?? {};
  const pain = !!(bs.pain && Object.keys(bs.pain).some((k) => bs.pain![k]));
  const sore = Math.max(bs.legs || 0, bs.upper_body || 0, bs.overall || 0);
  const bodyOk = !(sore >= 3); // =3 blockt
  const ready = (bs.readiness || 3) >= 2;
  const ok = slotHoursOk && bodyOk && ready;
  return { ok, slotHoursOk, bodyOk, painWarn: pain };
}

// --- Rest-Empfehlung fuer die Koerper-Seite (1:1 aus V1 restAdvice) ----------
// Bewertet den HEUTIGEN Befinden-Eintrag und gibt eine Ampel mit Begruendungen.
// Ohne heutigen Eintrag: "unknown" (V1 wertet nur den heutigen Eintrag, nicht
// den letzten). Reine Funktion ohne DOM/DB-Bezug.

export type RestLevel = "ok" | "caution" | "rest" | "unknown";

export interface RestAdvice {
  level: RestLevel;
  reasons: string[];
}

// Schlankes Wertobjekt – genau die Felder, die die Empfehlung braucht.
export interface RestInput {
  legs?: number;
  upper_body?: number;
  overall?: number;
  readiness?: number;
  pain_flag?: boolean;
}

export function restAdvice(today: RestInput | null): RestAdvice {
  if (!today) {
    return { level: "unknown", reasons: ["Heute noch kein Körperzustand erfasst"] };
  }
  const legs = today.legs || 0;
  const upper = today.upper_body || 0;
  const overall = today.overall || 0;
  const rdy = today.readiness || 3;
  const pain = !!today.pain_flag;

  const reasons: string[] = [];
  if (pain) reasons.push("Schmerz gemeldet");
  if (overall >= 3) reasons.push("Gesamt-Muskelkater hoch");
  if (legs >= 3) reasons.push("Beine stark");
  if (upper >= 3) reasons.push("Oberkörper stark");
  if (rdy <= 1) reasons.push("Readiness sehr niedrig");
  if (reasons.length) return { level: "rest", reasons };

  const cautions: string[] = [];
  if (rdy === 2) cautions.push("Readiness niedrig");
  if (overall === 2) cautions.push("Gesamt-Muskelkater mittel");
  if ((legs >= 2 ? 1 : 0) + (upper >= 2 ? 1 : 0) >= 2)
    cautions.push("mehrere Regionen mittel");
  if (cautions.length) return { level: "caution", reasons: cautions };

  return { level: "ok", reasons: [] };
}
