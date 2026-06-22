// Einmaliger Import der kompletten V1-Datenbasis (ein verschachtelter JSON-Blob,
// camelCase) in die normalisierten V2-Tabellen (snake_case, mit Beziehungen).
//
// Zwei Schritte:
//  - analysiereV1(text): parst den Blob und zaehlt, was gefunden wurde (Vorschau,
//    schreibt nichts).
//  - importiereV1(userId, blob): schluesselt jede alte Text-ID auf eine neue UUID um
//    und schreibt die Zeilen in Fremdschluessel-sicherer Reihenfolge.
//
// Alle id-Werte werden client-seitig vergeben (crypto.randomUUID), damit Beziehungen
// ohne Rueckfrage an die DB aufgeloest werden koennen. Die Skill-Definitionen kommen
// aus dem Definitionen-Seed (Schritt 2); der importierte Skill-Fortschritt wird ueber
// den Skill-Schluessel an die bereits vorhandenen Skills gehaengt.

import { supabase } from "@/lib/supabase";
import type {
  SettingsInsert,
  InventoryBarInsert,
  InventoryPlateInsert,
  InventoryKettlebellInsert,
  InventoryEquipmentInsert,
  ExerciseInsert,
  ExerciseMuscleInsert,
  TemplateInsert,
  TemplateExerciseInsert,
  JourneyInsert,
  PhaseInsert,
  SessionInsert,
  SessionExerciseInsert,
  SetInsert,
  SkillProgressInsert,
  BodyLogInsert,
  CompositionInsert,
} from "@/schemas";
import type {
  BodySnapshot,
  GeneralWarmup,
  Suggestion,
  SkillLog,
  RecoveryWindows,
  Timers,
} from "@/schemas/shared";

// ---- defensive Lese-Helfer (Blob kann unvollstaendig oder fremd sein) -------

type Dict = Record<string, unknown>;

function obj(v: unknown): Dict {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Dict)
    : {};
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}
function strOr(v: unknown, d: string): string {
  return typeof v === "string" ? v : d;
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function int(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : Math.round(n);
}
function intOr(v: unknown, d: number): number {
  const n = int(v);
  return n === null ? d : n;
}
function bool(v: unknown): boolean {
  return v === true;
}
function pick<T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : fallback;
}
function pickOrNull<T extends string>(
  v: unknown,
  allowed: readonly T[],
): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : null;
}
// Erstes vorhandenes Feld aus mehreren moeglichen Schreibweisen.
function field(d: Dict, ...keys: string[]): unknown {
  for (const k of keys) {
    if (k in d && d[k] !== undefined) return d[k];
  }
  return undefined;
}

const uid = (): string => crypto.randomUUID();

// ---- erlaubte Werte (CHECK-Listen der DB) -----------------------------------

const EX_CATEGORY = ["barbell", "core", "bodyweight"] as const;
const EX_PROFILE = ["strength", "core", "bodyweight"] as const;
const EX_KIND = ["main", "accessory", "core", "bodyweight"] as const;
const EX_EQUIP = ["barbell", "plate", "bar", "band", "bodyweight"] as const;
const METRIC = ["reps", "duration"] as const;
const SESSION_METRIC = ["reps", "duration", "weight_reps"] as const;
const MUSCLE_KAT = ["primaer", "sekundaer", "stabilisierend"] as const;
const ROLE = ["primary", "secondary", "core"] as const;
const FOCUS = [
  "reentry",
  "hypertrophy",
  "strength",
  "power",
  "endurance",
  "test",
  "maintenance",
] as const;
const SESSION_TYPE = ["strength", "yoga", "skill"] as const;
const SESSION_STATUS = ["live", "done"] as const;
const SKILL_RESULT = ["completed", "missed", "skipped"] as const;
const RM_FORMULA = ["brzycki", "epley", "wathan", "mean"] as const;
const UNIT = ["kg", "lb"] as const;

const DEFAULT_TIMERS: Timers = {
  setRestSec: 120,
  exerciseRestSec: 180,
  autoStart: true,
  sound: true,
  vibrate: true,
};

// ---- Vorschau ---------------------------------------------------------------

export interface ImportVorschau {
  blob: Dict;
  zeilen: Array<{ label: string; anzahl: number }>;
}

// Zaehlt pro Themenblock, wie viele Zeilen der Blob ergeben wird (ohne zu schreiben).
export function analysiereV1(text: string): ImportVorschau {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Die Datei ist kein gueltiges JSON: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  const db = obj(parsed);
  if (Object.keys(db).length === 0) {
    throw new Error("Die Datei enthaelt keine erkennbaren Daten.");
  }

  const inv = obj(db.inventory);
  const exercises = arr(db.exercises);
  const muskelZahl = exercises.reduce(
    (sum: number, e) => sum + Object.keys(obj(obj(e).muscles)).length,
    0,
  );
  const templates = arr(db.templates);
  const tplItemZahl = templates.reduce(
    (sum: number, t) => sum + arr(obj(t).items).length,
    0,
  );
  const journeys = arr(db.journeys);
  const phasenZahl = journeys.reduce(
    (sum: number, j) => sum + arr(obj(j).phases).length,
    0,
  );
  const sessions = arr(db.sessions);
  let einheitUebungen = 0;
  let saetze = 0;
  for (const s of sessions) {
    const so = obj(s);
    const skillWork = obj(field(so, "skillWork"));
    const entries = arr(so.entries);
    const skEx = arr(skillWork.exercises);
    einheitUebungen += entries.length + skEx.length;
    for (const en of entries) {
      const eo = obj(en);
      saetze += arr(eo.sets).length + arr(eo.warmupSets).length;
    }
    for (const we of skEx) saetze += arr(obj(we).sets).length;
  }

  const zeilen: Array<{ label: string; anzahl: number }> = [
    { label: "Einstellungen", anzahl: db.settings !== undefined ? 1 : 0 },
    { label: "Stangen", anzahl: arr(inv.bars).length },
    { label: "Scheiben", anzahl: arr(inv.plates).length },
    { label: "Kettlebells", anzahl: arr(inv.kettlebells).length },
    { label: "Equipment", anzahl: arr(inv.equipment).length },
    { label: "Übungen", anzahl: exercises.length },
    { label: "Muskel-Zuordnungen", anzahl: muskelZahl },
    { label: "Workout-Vorlagen", anzahl: templates.length },
    { label: "Vorlagen-Übungen", anzahl: tplItemZahl },
    { label: "Journeys", anzahl: journeys.length },
    { label: "Journey-Phasen", anzahl: phasenZahl },
    { label: "Einheiten", anzahl: sessions.length },
    { label: "Einheit-Übungen", anzahl: einheitUebungen },
    { label: "Sätze", anzahl: saetze },
    { label: "Skill-Fortschritt", anzahl: arr(db.skillProgress).length },
    { label: "Body-Log", anzahl: arr(db.bodyLog).length },
    { label: "Messungen", anzahl: arr(db.composition).length },
  ];

  return { blob: db, zeilen };
}

// ---- Import -----------------------------------------------------------------

export interface ImportErgebnis {
  eingefuegt: Array<{ label: string; anzahl: number }>;
  uebersprungen: string[];
}

type WithId<T> = T & { id: string };

async function einfuegen<T extends object>(
  table: string,
  rows: T[],
): Promise<void> {
  if (rows.length === 0) return;
  const CHUNK = 400;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const teil = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(table).insert(teil);
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
  }
}

// Prueft, ob schon importiert wurde (Definitionen-Seed legt keine Uebungen an).
export async function bereitsImportiert(): Promise<boolean> {
  const [ex, ses] = await Promise.all([
    supabase.from("exercises").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
  ]);
  if (ex.error) throw new Error(`Pruefung fehlgeschlagen: ${ex.error.message}`);
  if (ses.error)
    throw new Error(`Pruefung fehlgeschlagen: ${ses.error.message}`);
  return (ex.count ?? 0) > 0 || (ses.count ?? 0) > 0;
}

export async function importiereV1(
  userId: string,
  blob: Dict,
): Promise<ImportErgebnis> {
  const eingefuegt: Array<{ label: string; anzahl: number }> = [];
  const uebersprungen: string[] = [];
  const zaehl = (label: string, n: number): void => {
    eingefuegt.push({ label, anzahl: n });
  };

  // Skill-Definitionen (Seed) -> key/id, um Skill-Fortschritt zu verknuepfen.
  const { data: skillRows, error: skillErr } = await supabase
    .from("skills")
    .select("id, key")
    .returns<Array<{ id: string; key: string | null }>>();
  if (skillErr) throw new Error(`Skills lesen fehlgeschlagen: ${skillErr.message}`);
  const skillIdByKey = new Map<string, string>();
  for (const r of skillRows ?? []) {
    if (r.key !== null) skillIdByKey.set(r.key, r.id);
  }

  // 1) Einstellungen ---------------------------------------------------------
  if (blob.settings !== undefined) {
    const s = obj(blob.settings);
    const rwRaw = obj(field(s, "recoveryWindows", "recovery_windows"));
    const recovery: RecoveryWindows = { default: intOr(rwRaw.default, 48) };
    for (const [k, v] of Object.entries(rwRaw)) {
      const n = int(v);
      if (k !== "default" && n !== null) recovery[k] = n;
    }
    const timersRaw = obj(s.timers);
    const timers: Timers = {
      setRestSec: intOr(timersRaw.setRestSec, DEFAULT_TIMERS.setRestSec),
      exerciseRestSec: intOr(
        timersRaw.exerciseRestSec,
        DEFAULT_TIMERS.exerciseRestSec,
      ),
      autoStart: timersRaw.autoStart === undefined ? true : bool(timersRaw.autoStart),
      sound: timersRaw.sound === undefined ? true : bool(timersRaw.sound),
      vibrate: timersRaw.vibrate === undefined ? true : bool(timersRaw.vibrate),
    };
    const settingsRow: SettingsInsert = {
      user_id: userId,
      rm_formula: pick(field(s, "rmFormula", "rm_formula"), RM_FORMULA, "mean"),
      weekly_frequency_target: intOr(
        field(s, "weeklyFrequencyTarget", "weekly_frequency_target"),
        3,
      ),
      weight_step: num(field(s, "step", "weight_step")) ?? 2.5,
      unit: pick(s.unit, UNIT, "kg"),
      recovery_windows: recovery,
      timers,
    };
    await einfuegen("settings", [settingsRow]);
    zaehl("Einstellungen", 1);
  }

  // 2) Inventar --------------------------------------------------------------
  const inv = obj(blob.inventory);
  const barIdByV1 = new Map<string, string>();

  const barRows: Array<WithId<InventoryBarInsert>> = arr(inv.bars).map(
    (b, i) => {
      const bo = obj(b);
      const id = uid();
      const v1id = str(bo.id);
      if (v1id !== null) barIdByV1.set(v1id, id);
      return {
        id,
        user_id: userId,
        key: v1id,
        name: strOr(bo.name, "Stange"),
        weight: num(bo.weight) ?? 20,
        is_default: bool(field(bo, "default", "is_default")),
        position: i,
      };
    },
  );
  await einfuegen("inventory_bars", barRows);
  zaehl("Stangen", barRows.length);

  const plateRows: Array<WithId<InventoryPlateInsert>> = arr(inv.plates)
    .map((p) => num(p))
    .filter((w): w is number => w !== null)
    .map((weight, i) => ({ id: uid(), user_id: userId, weight, position: i }));
  await einfuegen("inventory_plates", plateRows);
  zaehl("Scheiben", plateRows.length);

  const kbRows: Array<WithId<InventoryKettlebellInsert>> = arr(inv.kettlebells)
    .map((p) => num(p))
    .filter((w): w is number => w !== null)
    .map((weight, i) => ({ id: uid(), user_id: userId, weight, position: i }));
  await einfuegen("inventory_kettlebells", kbRows);
  zaehl("Kettlebells", kbRows.length);

  const equipRows: Array<WithId<InventoryEquipmentInsert>> = arr(inv.equipment)
    .map((e, i): WithId<InventoryEquipmentInsert> | null => {
      const eo = obj(e);
      const key = str(eo.id);
      if (key === null) return null;
      return {
        id: uid(),
        user_id: userId,
        key,
        label: strOr(eo.label, key),
        active: eo.active === undefined ? true : bool(eo.active),
        position: i,
      };
    })
    .filter((r): r is WithId<InventoryEquipmentInsert> => r !== null);
  await einfuegen("inventory_equipment", equipRows);
  zaehl("Equipment", equipRows.length);

  // 3) Uebungen (+ feine Muskel-Map) ----------------------------------------
  const exIdByV1 = new Map<string, string>();
  const exRows: Array<WithId<ExerciseInsert>> = [];
  const muscleRows: Array<WithId<ExerciseMuscleInsert>> = [];
  arr(blob.exercises).forEach((e, i) => {
    const eo = obj(e);
    const id = uid();
    const v1id = str(eo.id);
    if (v1id !== null) exIdByV1.set(v1id, id);
    const range = arr(field(eo, "repRange", "rep_range"));
    const barId = str(field(eo, "barId", "bar_id"));
    exRows.push({
      id,
      user_id: userId,
      key: v1id,
      name: strOr(eo.name, "Übung"),
      category: pick(eo.category, EX_CATEGORY, "barbell"),
      profile: pick(eo.profile, EX_PROFILE, "strength"),
      kind: pick(eo.kind, EX_KIND, "main"),
      equipment: pick(eo.equipment, EX_EQUIP, "barbell"),
      bar_id: barId !== null ? (barIdByV1.get(barId) ?? null) : null,
      description: strOr(eo.description, ""),
      metric: pickOrNull(eo.metric, METRIC),
      muscle_groups: arr(field(eo, "muscleGroups", "muscle_groups"))
        .map((m) => str(m))
        .filter((m): m is string => m !== null),
      rep_range_min: int(range[0]),
      rep_range_max: int(range[1]),
      target_score: num(field(eo, "targetScore", "target_score")) ?? 3,
      work_weight: num(field(eo, "workWeight", "work_weight")) ?? 0,
      recovery_hours: intOr(field(eo, "recoveryHours", "recovery_hours"), 48),
      rm: num(eo.rm),
      rm_as_of: str(field(eo, "rmAsOf", "rm_as_of")),
      rm_stale: bool(field(eo, "rmStale", "rm_stale")),
      active: eo.active === undefined ? true : eo.active !== false,
      position: i,
    });
    const muscles = obj(eo.muscles);
    for (const [region, kat] of Object.entries(muscles)) {
      const kategorie = pickOrNull(kat, MUSCLE_KAT);
      if (kategorie === null) continue;
      muscleRows.push({
        id: uid(),
        user_id: userId,
        exercise_id: id,
        region_id: region,
        kategorie,
      });
    }
  });
  await einfuegen("exercises", exRows);
  zaehl("Übungen", exRows.length);
  await einfuegen("exercise_muscles", muscleRows);
  zaehl("Muskel-Zuordnungen", muscleRows.length);

  // 4) Workout-Vorlagen ------------------------------------------------------
  const tplRows: Array<WithId<TemplateInsert>> = [];
  const tplExRows: Array<WithId<TemplateExerciseInsert>> = [];
  arr(blob.templates).forEach((t, i) => {
    const to = obj(t);
    const id = uid();
    tplRows.push({
      id,
      user_id: userId,
      key: str(to.id),
      name: strOr(to.name, "Vorlage"),
      image: str(to.image),
      position: i,
    });
    arr(to.items).forEach((it, j) => {
      const io = obj(it);
      const exV1 = str(field(io, "exerciseId", "exercise_id"));
      const exId = exV1 !== null ? exIdByV1.get(exV1) : undefined;
      if (exId === undefined) return; // Uebung unbekannt -> Eintrag ueberspringen
      tplExRows.push({
        id: uid(),
        user_id: userId,
        template_id: id,
        exercise_id: exId,
        role: pick(io.role, ROLE, "primary"),
        position: j,
      });
    });
  });
  await einfuegen("templates", tplRows);
  zaehl("Workout-Vorlagen", tplRows.length);
  await einfuegen("template_exercises", tplExRows);
  zaehl("Vorlagen-Übungen", tplExRows.length);

  // 5) Journeys (+ Phasen) ---------------------------------------------------
  const journeyIdByV1 = new Map<string, string>();
  const phaseIdByV1 = new Map<string, string>();
  const jRows: Array<WithId<JourneyInsert>> = [];
  const phaseRows: Array<WithId<PhaseInsert>> = [];
  let aktiveGesetzt = false;
  arr(blob.journeys).forEach((j) => {
    const jo = obj(j);
    const id = uid();
    const v1id = str(jo.id);
    if (v1id !== null) journeyIdByV1.set(v1id, id);
    // Invariante: hoechstens eine aktive Journey. Die erste aktive bleibt aktiv.
    const willAktiv = bool(jo.active) && !aktiveGesetzt;
    if (willAktiv) aktiveGesetzt = true;
    const tplKey = str(field(jo, "templateId", "template_id"));
    jRows.push({
      id,
      user_id: userId,
      name: strOr(jo.name, "Journey"),
      active: willAktiv,
      status: willAktiv ? "active" : "archived",
      source_template_id: null, // FK auf journey_templates; ohne sichere id-Map null
      start_date: str(field(jo, "startDate", "start_date")),
    });
    void tplKey;
    arr(jo.phases).forEach((p, k) => {
      const po = obj(p);
      const pid = uid();
      const pv1 = str(po.id);
      // Phasen-IDs sind nur je Journey eindeutig -> mit Journey-ID qualifizieren.
      if (pv1 !== null && v1id !== null) {
        phaseIdByV1.set(`${v1id}:${pv1}`, pid);
      }
      const rt = arr(field(po, "repTarget", "rep_target"));
      phaseRows.push({
        id: pid,
        user_id: userId,
        journey_id: id,
        name: strOr(po.name, "Phase"),
        focus: pick(po.focus, FOCUS, "maintenance"),
        weeks: intOr(po.weeks, 1),
        sets_start: intOr(field(po, "setsStart", "sets_start"), 1),
        sets_end: intOr(field(po, "setsEnd", "sets_end"), 1),
        deload_week: int(field(po, "deloadWeek", "deload_week")),
        rep_target_min: int(rt[0]),
        rep_target_max: int(rt[1]),
        position: k,
      });
    });
  });
  await einfuegen("journeys", jRows);
  zaehl("Journeys", jRows.length);
  await einfuegen("phases", phaseRows);
  zaehl("Journey-Phasen", phaseRows.length);

  // 6) Einheiten (+ Uebungen + Saetze) ---------------------------------------
  const sessRows: Array<WithId<SessionInsert>> = [];
  const sessExRows: Array<WithId<SessionExerciseInsert>> = [];
  const setRows: Array<WithId<SetInsert>> = [];

  arr(blob.sessions).forEach((s) => {
    const so = obj(s);
    const sid = uid();
    const skillWork = obj(field(so, "skillWork"));
    const hatSkillWork = Object.keys(skillWork).length > 0;
    const v1journey = str(field(so, "journeyId", "journey_id"));
    const v1phase = str(field(so, "phaseId", "phase_id"));
    const v1tpl = str(field(so, "templateId", "template_id"));
    const v1skill = str(field(so, "skillId", "skill_id")) ?? str(skillWork.skillId);
    const startedMs = num(field(so, "startedAt", "started_at"));

    const journeyId = v1journey !== null ? (journeyIdByV1.get(v1journey) ?? null) : null;
    const phaseId =
      v1phase !== null && v1journey !== null
        ? (phaseIdByV1.get(`${v1journey}:${v1phase}`) ?? null)
        : null;

    sessRows.push({
      id: sid,
      user_id: userId,
      date: strOr(so.date, "1970-01-01"),
      type: pick(so.type, SESSION_TYPE, hatSkillWork ? "skill" : "strength"),
      status: pick(so.status, SESSION_STATUS, "done"),
      journey_id: journeyId,
      phase_id: phaseId,
      template_id: v1tpl !== null ? (tplIdMap(tplRows, v1tpl) ?? null) : null,
      skill_id: v1skill !== null ? (skillIdByKey.get(v1skill) ?? null) : null,
      week: int(so.week),
      duration_sec: int(field(so, "durationSec", "duration_sec")),
      minutes: int(so.minutes),
      notes: strOr(so.notes, ""),
      started_at:
        startedMs !== null ? new Date(startedMs).toISOString() : null,
      body: obj(so.body) as BodySnapshot,
      general_warmup: obj(field(so, "generalWarmup", "general_warmup")) as GeneralWarmup,
      skill_phase: int(field(skillWork, "phase")) ?? int(field(so, "skillPhase", "skill_phase")),
      skill_result:
        pickOrNull(skillWork.result, SKILL_RESULT) ??
        pickOrNull(field(so, "skillResult", "skill_result"), SKILL_RESULT),
    });

    if (hatSkillWork) {
      // Skill-Einheit: Uebungen ohne Katalogbezug, Saetze mit value/met.
      arr(skillWork.exercises).forEach((we, i) => {
        const wo = obj(we);
        const seId = uid();
        const metric = pickOrNull(wo.metric, METRIC);
        sessExRows.push({
          id: seId,
          user_id: userId,
          session_id: sid,
          exercise_id: null,
          name: str(wo.name),
          bar_id: null,
          metric: metric,
          tested_1rm: null,
          suggestion: {} as Suggestion,
          position: i,
        });
        arr(wo.sets).forEach((st, j) => {
          const sto = obj(st);
          const value = num(sto.value);
          setRows.push({
            id: uid(),
            user_id: userId,
            session_exercise_id: seId,
            kind: "work",
            position: j,
            reps: metric === "duration" ? null : int(sto.value),
            weight: null,
            duration_sec: metric === "duration" ? int(value) : null,
            score: null,
            failed: false,
            done: bool(sto.done),
            target_reps: null,
            target_weight: null,
            target_score: null,
            adjusted: false,
            adjust_note: "",
            met: sto.met === undefined ? null : bool(sto.met),
          });
        });
      });
    } else {
      // Kraft-/Yoga-Einheit: entries -> session_exercises, warmup + work -> sets.
      arr(so.entries).forEach((en, i) => {
        const eo = obj(en);
        const seId = uid();
        const exV1 = str(field(eo, "exerciseId", "exercise_id"));
        const barV1 = str(field(eo, "barId", "bar_id"));
        sessExRows.push({
          id: seId,
          user_id: userId,
          session_id: sid,
          exercise_id: exV1 !== null ? (exIdByV1.get(exV1) ?? null) : null,
          name: str(eo.name),
          bar_id: barV1 !== null ? (barIdByV1.get(barV1) ?? null) : null,
          metric: pickOrNull(eo.metric, SESSION_METRIC),
          tested_1rm: num(field(eo, "tested1RM", "tested_1rm")),
          suggestion: obj(eo.suggestion) as Suggestion,
          position: i,
        });
        let pos = 0;
        arr(eo.warmupSets).forEach((st) => {
          const sto = obj(st);
          setRows.push({
            id: uid(),
            user_id: userId,
            session_exercise_id: seId,
            kind: "warmup",
            position: pos++,
            reps: int(sto.reps),
            weight: num(sto.weight),
            duration_sec: int(field(sto, "durationSec", "duration")),
            score: null,
            failed: false,
            done: bool(sto.done),
            target_reps: null,
            target_weight: null,
            target_score: null,
            adjusted: false,
            adjust_note: "",
            met: null,
          });
        });
        arr(eo.sets).forEach((st) => {
          const sto = obj(st);
          setRows.push({
            id: uid(),
            user_id: userId,
            session_exercise_id: seId,
            kind: "work",
            position: pos++,
            reps: int(sto.reps),
            weight: num(sto.weight),
            duration_sec: int(field(sto, "durationSec", "duration")),
            score: num(sto.score),
            failed: bool(sto.failed),
            done: bool(sto.done),
            target_reps: int(field(sto, "targetReps", "target_reps")),
            target_weight: num(field(sto, "targetWeight", "target_weight")),
            target_score: num(field(sto, "targetScore", "target_score")),
            adjusted: bool(sto.adjusted),
            adjust_note: strOr(field(sto, "adjustNote", "adjust_note"), ""),
            met: sto.met === undefined ? null : bool(sto.met),
          });
        });
      });
    }
  });
  await einfuegen("sessions", sessRows);
  zaehl("Einheiten", sessRows.length);
  await einfuegen("session_exercises", sessExRows);
  zaehl("Einheit-Übungen", sessExRows.length);
  await einfuegen("sets", setRows);
  zaehl("Sätze", setRows.length);

  // 7) Skill-Fortschritt -----------------------------------------------------
  const spRows: Array<WithId<SkillProgressInsert>> = [];
  arr(blob.skillProgress).forEach((p) => {
    const po = obj(p);
    const key = str(field(po, "skillId", "skill_id"));
    if (key === null) return;
    const skillId = skillIdByKey.get(key);
    if (skillId === undefined) {
      uebersprungen.push(`Skill-Fortschritt "${key}" (kein passender Skill)`);
      return;
    }
    spRows.push({
      id: uid(),
      user_id: userId,
      skill_id: skillId,
      active: bool(po.active),
      current_phase: intOr(field(po, "currentPhase", "current_phase"), 0),
      counter: intOr(field(po, "consecutiveCount", "counter"), 0),
      mastered: bool(po.mastered),
      log: arr(po.log) as SkillLog,
    });
  });
  await einfuegen("skill_progress", spRows);
  zaehl("Skill-Fortschritt", spRows.length);

  // 8) Body-Log --------------------------------------------------------------
  const blRows: Array<WithId<BodyLogInsert>> = arr(blob.bodyLog)
    .map((b): WithId<BodyLogInsert> | null => {
      const bo = obj(b);
      const date = str(bo.date);
      if (date === null) return null;
      const pain = obj(bo.pain);
      return {
        id: uid(),
        user_id: userId,
        date,
        legs: intOr(bo.legs, 0),
        upper_body: intOr(field(bo, "upper_body", "upperBody"), 0),
        overall: intOr(bo.overall, 0),
        readiness: intOr(bo.readiness, 3),
        pain_flag: bool(field(bo, "pain_flag", "painFlag")) || bool(pain.flag),
        pain_note: strOr(field(bo, "pain_note", "painNote"), strOr(pain.note, "")),
        notes: strOr(bo.notes, ""),
      };
    })
    .filter((r): r is WithId<BodyLogInsert> => r !== null);
  await einfuegen("body_log", blRows);
  zaehl("Body-Log", blRows.length);

  // 9) Composition (InBody/BIA) ----------------------------------------------
  const compRows: Array<WithId<CompositionInsert>> = arr(blob.composition)
    .map((c): WithId<CompositionInsert> | null => {
      const co = obj(c);
      const date = str(co.date);
      if (date === null) return null;
      return {
        id: uid(),
        user_id: userId,
        date,
        weight: num(co.weight),
        body_fat_kg: num(field(co, "bodyFatKg", "body_fat_kg")),
        body_fat_pct: num(field(co, "bodyFatPct", "body_fat_pct")),
        skeletal_muscle_kg: num(
          field(co, "skeletalMuscleKg", "skeletal_muscle_kg"),
        ),
        tbw_kg: num(field(co, "tbwKg", "tbw_kg")),
        phase_angle: num(field(co, "phaseAngle", "phase_angle")),
        visceral_fat: num(field(co, "visceralFat", "visceral_fat")),
      };
    })
    .filter((r): r is WithId<CompositionInsert> => r !== null);
  await einfuegen("composition", compRows);
  zaehl("Messungen", compRows.length);

  return { eingefuegt, uebersprungen };
}

// Findet die neue Template-UUID anhand des V1-Schluessels.
function tplIdMap(
  rows: Array<WithId<TemplateInsert>>,
  key: string,
): string | undefined {
  return rows.find((r) => r.key === key)?.id;
}
