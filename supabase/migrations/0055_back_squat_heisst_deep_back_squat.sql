-- 0055 "Back Squat" heisst "Deep Back Squat" (Issue #416)
-- ----------------------------------------------------------------------------
-- Die Uebung geht bei ihrem Ausfuehrenden komplett in die Tiefe (Hüfte unter
-- Kniehöhe), waehrend im Kraftsport-Sprachgebrauch "Back Squat" oft nur bis
-- parallel meint. Zur Abgrenzung bekommt sie den Namen "Deep Back Squat" und
-- eine praezisierte Beschreibung. Der key bleibt 'back_squat' - alle
-- Verknuepfungen (Saetze, Meilensteine, 1RM-Tests, Phasen-Anker) haengen an
-- der Uebungs-ID, nicht am key.
--
-- Fuer wen: alle Nutzer mit dieser Uebung im Katalog.
-- Idempotent: greift nur Zeilen mit dem alten Namen.

begin;

update public.exercises
   set name = 'Deep Back Squat',
       description = 'Kniebeuge mit der Langhantel auf dem oberen Rücken bis in die volle Tiefe (Hüfte unter Kniehöhe); Hüfte und Knie gemeinsam beugen und strecken.'
 where key = 'back_squat'
   and name = 'Back Squat';

commit;

-- Kontrolle (nach dem Lauf auszufuehren, erwartet 0 Zeilen):
--   select id, user_id, name from public.exercises
--    where key = 'back_squat' and name = 'Back Squat';
