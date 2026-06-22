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
