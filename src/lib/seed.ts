// Erstbefuellung der Definitionen (Journey-Vorlagen, Skills) in die Datenbank.
// Idempotent: laeuft nur, wenn noch keine Skills fuer den Nutzer existieren.
// Alles wird mit der user_id des angemeldeten Nutzers angelegt (RLS).

import { supabase } from "@/lib/supabase";
import { journeyTemplateSeeds, skillSeeds } from "@/seed/definitions";
import type {
  JourneyTemplateInsert,
  JourneyTemplatePhaseInsert,
  SkillInsert,
  SkillPhaseInsert,
  SkillPhaseExerciseInsert,
  SkillPhaseEquipmentInsert,
} from "@/schemas";

export interface SeedErgebnis {
  seeded: boolean;
}

export async function ensureDefinitionsSeeded(
  userId: string,
): Promise<SeedErgebnis> {
  // Sind schon Skills fuer diesen Nutzer vorhanden, gilt als bereits geseedet.
  const { count, error } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(`Pruefung des Datenstands fehlgeschlagen: ${error.message}`);
  }
  if ((count ?? 0) > 0) return { seeded: false };

  await seedJourneyTemplates(userId);
  await seedSkills(userId);
  return { seeded: true };
}

async function seedJourneyTemplates(userId: string): Promise<void> {
  const tplInserts: JourneyTemplateInsert[] = journeyTemplateSeeds.map(
    (t, i) => ({
      user_id: userId,
      key: t.key,
      name: t.name,
      tagline: t.tagline,
      for_whom: t.forWhom,
      summary: t.summary,
      position: i,
    }),
  );

  const { data: tpls, error } = await supabase
    .from("journey_templates")
    .insert(tplInserts)
    .select("id, key")
    .returns<Array<{ id: string; key: string | null }>>();
  if (error) {
    throw new Error(`Journey-Vorlagen anlegen fehlgeschlagen: ${error.message}`);
  }
  if (tpls === null) {
    throw new Error("Journey-Vorlagen: keine IDs zurueckgegeben.");
  }

  const idByKey = new Map<string, string>();
  for (const row of tpls) {
    if (row.key !== null) idByKey.set(row.key, row.id);
  }

  const phaseInserts: JourneyTemplatePhaseInsert[] = [];
  for (const t of journeyTemplateSeeds) {
    const tplId = idByKey.get(t.key);
    if (tplId === undefined) {
      throw new Error(`Journey-Vorlage ohne ID: ${t.key}`);
    }
    t.phases.forEach((p, i) => {
      phaseInserts.push({
        user_id: userId,
        journey_template_id: tplId,
        name: p.name,
        focus: p.focus,
        weeks: p.weeks,
        sets_start: p.setsStart,
        sets_end: p.setsEnd,
        deload_week: p.deloadWeek,
        rep_target_min: p.repTargetMin,
        rep_target_max: p.repTargetMax,
        position: i,
      });
    });
  }

  const { error: phaseError } = await supabase
    .from("journey_template_phases")
    .insert(phaseInserts);
  if (phaseError) {
    throw new Error(`Vorlagen-Phasen anlegen fehlgeschlagen: ${phaseError.message}`);
  }
}

async function seedSkills(userId: string): Promise<void> {
  const skillInserts: SkillInsert[] = skillSeeds.map((s, i) => ({
    user_id: userId,
    key: s.key,
    name: s.name,
    category: s.category,
    image: s.image,
    position: i,
  }));

  const { data: skills, error } = await supabase
    .from("skills")
    .insert(skillInserts)
    .select("id, key")
    .returns<Array<{ id: string; key: string | null }>>();
  if (error) {
    throw new Error(`Skills anlegen fehlgeschlagen: ${error.message}`);
  }
  if (skills === null) {
    throw new Error("Skills: keine IDs zurueckgegeben.");
  }

  const skillIdByKey = new Map<string, string>();
  for (const row of skills) {
    if (row.key !== null) skillIdByKey.set(row.key, row.id);
  }

  // Alle Phasen in einem Rutsch (Position je Skill als Reihenfolge).
  const phaseInserts: SkillPhaseInsert[] = [];
  for (const s of skillSeeds) {
    const skillId = skillIdByKey.get(s.key);
    if (skillId === undefined) throw new Error(`Skill ohne ID: ${s.key}`);
    s.phases.forEach((p, i) => {
      phaseInserts.push({
        user_id: userId,
        skill_id: skillId,
        label: p.label,
        description: p.description,
        consecutive_sessions: p.consecutiveSessions,
        position: i,
      });
    });
  }

  const { data: phases, error: phaseError } = await supabase
    .from("skill_phases")
    .insert(phaseInserts)
    .select("id, skill_id, position")
    .returns<Array<{ id: string; skill_id: string; position: number }>>();
  if (phaseError) {
    throw new Error(`Skill-Phasen anlegen fehlgeschlagen: ${phaseError.message}`);
  }
  if (phases === null) {
    throw new Error("Skill-Phasen: keine IDs zurueckgegeben.");
  }

  const phaseIdBy = new Map<string, string>();
  for (const row of phases) {
    phaseIdBy.set(`${row.skill_id}:${String(row.position)}`, row.id);
  }

  const exInserts: SkillPhaseExerciseInsert[] = [];
  const eqInserts: SkillPhaseEquipmentInsert[] = [];
  for (const s of skillSeeds) {
    const skillId = skillIdByKey.get(s.key);
    if (skillId === undefined) continue;
    s.phases.forEach((p, pi) => {
      const phaseId = phaseIdBy.get(`${skillId}:${String(pi)}`);
      if (phaseId === undefined) {
        throw new Error(`Skill-Phase ohne ID: ${s.key}/${String(pi)}`);
      }
      p.exercises.forEach((e, ei) => {
        exInserts.push({
          user_id: userId,
          skill_phase_id: phaseId,
          name: e.name,
          metric: e.metric,
          sets: e.sets,
          target: e.target,
          tempo: e.tempo,
          exercise_id: null,
          position: ei,
        });
      });
      for (const key of p.equipment) {
        eqInserts.push({
          user_id: userId,
          skill_phase_id: phaseId,
          equipment_key: key,
        });
      }
    });
  }

  if (exInserts.length > 0) {
    const { error: exError } = await supabase
      .from("skill_phase_exercises")
      .insert(exInserts);
    if (exError) {
      throw new Error(`Skill-Uebungen anlegen fehlgeschlagen: ${exError.message}`);
    }
  }
  if (eqInserts.length > 0) {
    const { error: eqError } = await supabase
      .from("skill_phase_equipment")
      .insert(eqInserts);
    if (eqError) {
      throw new Error(`Skill-Equipment anlegen fehlgeschlagen: ${eqError.message}`);
    }
  }
}
