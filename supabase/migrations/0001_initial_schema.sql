-- Kraftschmiede V2 – Datenbankschema (normalisiert, an V1 orientiert)
-- ================================================================
-- Einmalig im Supabase-Dashboard ausfuehren:
--   Linke Leiste -> "SQL Editor" -> "New query" -> dieses Skript einfuegen -> "Run".
-- Alle Tabellen tragen user_id und Row Level Security: jede angemeldete Person
-- sieht und aendert ausschliesslich eigene Zeilen. Definitionen (Uebungen,
-- Vorlagen, Skills, Journey-Vorlagen, Inventar) werden beim ersten Start pro
-- Nutzer aus einem Seed befuellt. Idempotent: "if not exists" / "drop policy if exists".

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------
-- 1. Inventar (zuerst, da exercises auf inventory_bars verweist)
-- ----------------------------------------------------------------

-- Stangen (Langhantel-Typen). is_default markiert die Standardstange.
create table if not exists public.inventory_bars (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text,
  name       text not null,
  weight     numeric not null,
  is_default boolean not null default false,
  position   integer not null default 0,
  unique (user_id, key)
);

-- Hantelscheiben: je Zeile ein verfuegbarer Scheiben-Typ (Gewicht). Kein
-- Bestandszaehler (wie V1) – der Plate-Loader rechnet ohne Stueck-Limit.
create table if not exists public.inventory_plates (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  weight   numeric not null,
  position integer not null default 0
);

-- Kettlebells: je Zeile ein verfuegbares Gewicht.
create table if not exists public.inventory_kettlebells (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  weight   numeric not null,
  position integer not null default 0
);

-- Equipment-Tor fuer Skills (Klimmzugstange, Baender, Ringe ...). key wird von
-- den Skill-Phasen als Voraussetzung referenziert; active schaltet frei.
create table if not exists public.inventory_equipment (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  key      text not null,
  label    text not null,
  active   boolean not null default false,
  position integer not null default 0,
  unique (user_id, key)
);

-- ----------------------------------------------------------------
-- 2. Uebungen (Katalog) + feine Muskelzuordnung
-- ----------------------------------------------------------------

-- category: barbell | core | bodyweight
-- profile:  strength | core | bodyweight
-- kind:     main | accessory | core | bodyweight
-- equipment: barbell | plate | bar | band | bodyweight
-- metric (nur bodyweight): reps | duration   (sonst null = Gewicht+Wdh)
-- muscle_groups: grobe Gruppen-Tags (z. B. legs, glutes, chest); die feine
--   Regionen-Map liegt in exercise_muscles.
-- rm/rm_as_of/rm_stale: zwischengespeichertes geschaetztes 1RM (Coach).
create table if not exists public.exercises (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  key            text,
  name           text not null,
  category       text not null default 'barbell'
                   check (category in ('barbell','core','bodyweight')),
  profile        text not null default 'strength'
                   check (profile in ('strength','core','bodyweight')),
  kind           text not null default 'main'
                   check (kind in ('main','accessory','core','bodyweight')),
  equipment      text not null default 'barbell'
                   check (equipment in ('barbell','plate','bar','band','bodyweight')),
  bar_id         uuid references public.inventory_bars(id) on delete set null,
  description    text not null default '',
  metric         text check (metric in ('reps','duration')),
  muscle_groups  text[] not null default '{}',
  rep_range_min  integer,
  rep_range_max  integer,
  target_score   numeric not null default 3,
  work_weight    numeric not null default 0,
  recovery_hours integer not null default 48,
  rm             numeric,
  rm_as_of       date,
  rm_stale       boolean not null default false,
  active         boolean not null default true,
  position       integer not null default 0,
  unique (user_id, key)
);

-- Feine Muskel-Beteiligung je Uebung: region_id entspricht den Code-/SVG-Regionen
-- (z. B. quadrizeps, latissimus); kategorie steuert die Einfaerbung der Muscle-Map.
create table if not exists public.exercise_muscles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  region_id   text not null,
  kategorie   text not null
                check (kategorie in ('primaer','sekundaer','stabilisierend')),
  unique (exercise_id, region_id)
);

-- ----------------------------------------------------------------
-- 3. Trainings-Vorlagen
-- ----------------------------------------------------------------

create table if not exists public.templates (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  key      text,
  name     text not null,
  image    text,
  position integer not null default 0,
  unique (user_id, key)
);

-- Uebung in einer Vorlage mit Rolle (primary=Hauptuebung, secondary=Assistenz, core).
create table if not exists public.template_exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  role        text not null default 'primary'
                check (role in ('primary','secondary','core')),
  position    integer not null default 0
);

-- ----------------------------------------------------------------
-- 4. Journey-Vorlagen (kuratierte Periodisierungen)
-- ----------------------------------------------------------------

create table if not exists public.journey_templates (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  key      text,
  name     text not null,
  tagline  text,
  for_whom text,
  summary  text,
  position integer not null default 0,
  unique (user_id, key)
);

-- focus: reentry | hypertrophy | strength | power | endurance | test | maintenance
-- rep_target_min/max: Ziel-Wiederholungsband der Phase (steuert Doppelprogression).
create table if not exists public.journey_template_phases (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  journey_template_id uuid not null references public.journey_templates(id) on delete cascade,
  name                text not null,
  focus               text not null
                        check (focus in ('reentry','hypertrophy','strength','power','endurance','test','maintenance')),
  weeks               integer not null,
  sets_start          integer not null,
  sets_end            integer not null,
  deload_week         integer,
  rep_target_min      integer,
  rep_target_max      integer,
  position            integer not null default 0
);

-- ----------------------------------------------------------------
-- 5. Skills (Definitionen als Seed in der DB; Fortschritt separat)
-- ----------------------------------------------------------------

create table if not exists public.skills (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  key      text,
  name     text not null,
  category text,
  image    text,
  position integer not null default 0,
  unique (user_id, key)
);

-- consecutive_sessions: Anzahl AUFEINANDERFOLGENDER erfolgreicher Einheiten,
-- die den Aufstieg in die naechste Phase ausloesen (Reset bei Fehlversuch).
create table if not exists public.skill_phases (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  skill_id             uuid not null references public.skills(id) on delete cascade,
  label                text not null,
  description          text not null default '',
  consecutive_sessions integer not null default 2,
  position             integer not null default 0
);

-- Phasen-Uebung; exercise_id verknuepft optional mit der Katalog-Uebung
-- (damit der Uebungs-Verlauf die Skill-Einheiten findet). metric: reps | duration.
create table if not exists public.skill_phase_exercises (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  skill_phase_id uuid not null references public.skill_phases(id) on delete cascade,
  name           text not null,
  metric         text not null default 'reps'
                   check (metric in ('reps','duration')),
  sets           integer not null default 3,
  target         integer not null,
  tempo          text,
  exercise_id    uuid references public.exercises(id) on delete set null,
  position       integer not null default 0
);

-- Equipment-Voraussetzung einer Skill-Phase (verweist per key auf inventory_equipment).
create table if not exists public.skill_phase_equipment (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  skill_phase_id uuid not null references public.skill_phases(id) on delete cascade,
  equipment_key  text not null
);

-- ----------------------------------------------------------------
-- 6. Nutzerzustand: Journeys, Phasen
-- ----------------------------------------------------------------

create table if not exists public.journeys (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  active             boolean not null default false,
  status             text not null default 'active'
                       check (status in ('active','archived')),
  source_template_id uuid references public.journey_templates(id) on delete set null,
  start_date         date,
  created_at         timestamptz not null default now()
);

-- Invariante: genau eine aktive Journey pro Nutzer.
create unique index if not exists journeys_one_active_per_user
  on public.journeys (user_id) where (active);

-- Phasen der konkreten Journey (Kopie der Vorlagenphasen, frei anpassbar).
create table if not exists public.phases (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  journey_id     uuid not null references public.journeys(id) on delete cascade,
  name           text not null,
  focus          text not null
                   check (focus in ('reentry','hypertrophy','strength','power','endurance','test','maintenance')),
  weeks          integer not null,
  sets_start     integer not null,
  sets_end       integer not null,
  deload_week    integer,
  rep_target_min integer,
  rep_target_max integer,
  position       integer not null default 0
);

-- ----------------------------------------------------------------
-- 7. Trainingseinheiten + Uebung-in-Einheit + Saetze
-- ----------------------------------------------------------------

-- type: strength | yoga | skill ; status: live | done
-- week: eingefrorene globale Journey-Wochennummer (nachvollziehbar bei Altdaten)
-- body/general_warmup: kleine Wertobjekte als jsonb (Befinden-Snapshot, Aufwaermen)
-- skill_phase/skill_result: nur fuer Skill-Einheiten
create table if not exists public.sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           date not null,
  type           text not null check (type in ('strength','yoga','skill')),
  status         text not null default 'done' check (status in ('live','done')),
  journey_id     uuid references public.journeys(id) on delete set null,
  phase_id       uuid references public.phases(id) on delete set null,
  template_id    uuid references public.templates(id) on delete set null,
  skill_id       uuid references public.skills(id) on delete set null,
  week           integer,
  duration_sec   integer,
  minutes        integer,
  notes          text not null default '',
  started_at     timestamptz,
  body           jsonb not null default '{}'::jsonb,
  general_warmup jsonb not null default '{}'::jsonb,
  skill_phase    integer,
  skill_result   text check (skill_result in ('completed','missed','skipped')),
  created_at     timestamptz not null default now()
);

create index if not exists sessions_user_date_idx on public.sessions (user_id, date desc);

-- Uebung-in-Einheit (V1 "entry"): traegt Stange, Coach-Vorschlag und optionalen
-- 1RM-Test. Bei Skill-Einheiten ohne Katalogbezug ist exercise_id null und der
-- Name kommt aus der Skill-Phasen-Uebung.
create table if not exists public.session_exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  uuid not null references public.sessions(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  name        text,
  bar_id      uuid references public.inventory_bars(id) on delete set null,
  metric      text check (metric in ('reps','duration','weight_reps')),
  tested_1rm  numeric,
  suggestion  jsonb not null default '{}'::jsonb,
  position    integer not null default 0
);

-- Einzelner Satz. kind: warmup | work. Fuer Haltezeit-Uebungen zaehlt duration_sec
-- statt reps/weight. Geplant (target_*) vs. tatsaechlich; score, failed, manuelle
-- Anpassung (adjusted/adjust_note); met = Ziel erreicht (Skill).
create table if not exists public.sets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  kind                text not null default 'work' check (kind in ('warmup','work')),
  position            integer not null default 0,
  reps                integer,
  weight              numeric,
  duration_sec        integer,
  score               numeric,
  failed              boolean not null default false,
  done                boolean not null default false,
  target_reps         integer,
  target_weight       numeric,
  target_score        numeric,
  adjusted            boolean not null default false,
  adjust_note         text not null default '',
  met                 boolean
);

-- ----------------------------------------------------------------
-- 8. Skill-Fortschritt, Koerperdaten, Einstellungen
-- ----------------------------------------------------------------

-- counter = Konsekutiv-Zaehler (Reset bei Fehlversuch). log = kurze Versuchshistorie.
create table if not exists public.skill_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  skill_id      uuid not null references public.skills(id) on delete cascade,
  active        boolean not null default false,
  current_phase integer not null default 0,
  counter       integer not null default 0,
  mastered      boolean not null default false,
  log           jsonb not null default '[]'::jsonb,
  unique (user_id, skill_id)
);

-- Tages-Befinden / Erholungs-Check (Muskelkater 0..3, Bereitschaft, Schmerz, Notiz).
create table if not exists public.body_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  legs       integer not null default 0,
  upper_body integer not null default 0,
  overall    integer not null default 0,
  readiness  integer not null default 3,
  pain_flag  boolean not null default false,
  pain_note  text not null default '',
  notes      text not null default '',
  unique (user_id, date)
);

-- InBody-/BIA-Messungen als eigene Zeitreihe.
create table if not exists public.composition (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  date               date not null,
  weight             numeric,
  body_fat_kg        numeric,
  body_fat_pct       numeric,
  skeletal_muscle_kg numeric,
  tbw_kg             numeric,
  phase_angle        numeric,
  visceral_fat       numeric,
  unique (user_id, date)
);

-- Eine Zeile pro Nutzer. recovery_windows/timers als kleine jsonb-Wertobjekte.
create table if not exists public.settings (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  rm_formula              text not null default 'mean',
  weekly_frequency_target integer not null default 3,
  weight_step             numeric not null default 2.5,
  unit                    text not null default 'kg',
  recovery_windows        jsonb not null default '{"default":48,"squat":48,"deadlift":72}'::jsonb,
  timers                  jsonb not null default '{"setRestSec":120,"exerciseRestSec":180,"autoStart":true,"sound":true,"vibrate":true}'::jsonb
);

-- ----------------------------------------------------------------
-- 9. Row Level Security + Grants fuer alle Tabellen
-- ----------------------------------------------------------------
-- Jede Tabelle hat eine user_id-Spalte. Pro Tabelle: RLS aktivieren, vier
-- Policies (select/insert/update/delete strikt auf die eigene user_id) und
-- Zugriff fuer die Rolle authenticated freigeben (Data API). Da "neue Tabellen
-- automatisch freigeben" beim Projekt deaktiviert wurde, sind die Grants noetig;
-- die Zeilensicherheit bleibt die eigentliche Schutzschicht.

grant usage on schema public to authenticated;

do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "%1$s_select_own" on public.%1$I', t);
    execute format($p$create policy "%1$s_select_own" on public.%1$I
        for select using (auth.uid() = user_id)$p$, t);

    execute format('drop policy if exists "%1$s_insert_own" on public.%1$I', t);
    execute format($p$create policy "%1$s_insert_own" on public.%1$I
        for insert with check (auth.uid() = user_id)$p$, t);

    execute format('drop policy if exists "%1$s_update_own" on public.%1$I', t);
    execute format($p$create policy "%1$s_update_own" on public.%1$I
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id)$p$, t);

    execute format('drop policy if exists "%1$s_delete_own" on public.%1$I', t);
    execute format($p$create policy "%1$s_delete_own" on public.%1$I
        for delete using (auth.uid() = user_id)$p$, t);

    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
