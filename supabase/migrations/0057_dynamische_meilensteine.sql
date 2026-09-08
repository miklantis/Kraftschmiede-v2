-- 0057 Dynamische Uebungs-Meilensteine
-- ----------------------------------------------------------------
-- Bisher trug ein Uebungs-Meilenstein genau ein festes Ziel-1RM in kg. Kuenftig
-- kann er stattdessen ein Vielfaches eines Koerperwerts sein ("1,0x
-- Koerpergewicht Back Squat"). Der Zielwert wird dann in der App aus den
-- Messungen der letzten 30 Tage gerechnet und wandert mit.
--
-- Drei Basen:
--   'fix'            – festes Ziel in kg, wie bisher (target_rm)
--   'koerpergewicht' – faktor x Koerpergewicht
--   'ffm'            – faktor x fettfreie Masse (Gewicht minus Koerperfett)
-- Bewusst kein SMM: die Skelettmuskelmasse ist nur ein Teil der fettfreien
-- Masse und in composition lueckenhaft, waehrend weight und body_fat_kg
-- vollstaendig sind.
--
-- achieved_target haelt den beim Erreichen gueltigen Zielwert fest. Ohne ihn
-- wuerde ein erreichter dynamischer Meilenstein spaeter mit dem Koerpergewicht
-- weiterwandern und den Erfolg rueckwirkend verschieben.
--
-- Bestandszeilen bleiben unveraendert 'fix' mit ihrem target_rm. Idempotent
-- (add column if not exists, constraint erst loeschen, dann setzen).
-- Erwartete Ausgabe im SQL-Editor: "No rows returned".

-- 1. Neue Spalten
alter table public.exercise_milestones
  add column if not exists basis text not null default 'fix';

alter table public.exercise_milestones
  add column if not exists faktor numeric;

alter table public.exercise_milestones
  add column if not exists achieved_target numeric;

-- 2. target_rm wird optional: dynamische Meilensteine speichern kein Ziel,
--    es wird aus Faktor und Basiswert gerechnet.
alter table public.exercise_milestones
  alter column target_rm drop not null;

-- 3. Erlaubte Basen
alter table public.exercise_milestones
  drop constraint if exists exercise_milestones_basis_check;

alter table public.exercise_milestones
  add constraint exercise_milestones_basis_check
  check (basis in ('fix', 'koerpergewicht', 'ffm'));

-- 4. Stimmige Kombination: fix traegt ein Ziel und keinen Faktor, dynamisch
--    traegt einen positiven Faktor und kein Ziel.
alter table public.exercise_milestones
  drop constraint if exists exercise_milestones_ziel_check;

alter table public.exercise_milestones
  add constraint exercise_milestones_ziel_check
  check (
    (basis = 'fix' and target_rm is not null and faktor is null)
    or (basis <> 'fix' and faktor is not null and faktor > 0 and target_rm is null)
  );
