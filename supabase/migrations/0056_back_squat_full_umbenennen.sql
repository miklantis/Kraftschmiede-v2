-- 0056 "Deep Back Squat" heisst "Back Squat (Full)" (Issue #418)
-- ----------------------------------------------------------------------------
-- Folgeaenderung zu Migration 0055: Name noch einmal angepasst, Beschreibung
-- bleibt unveraendert. Der key bleibt 'back_squat'.
--
-- Fuer wen: alle Nutzer mit dieser Uebung im Katalog.
-- Idempotent: greift nur Zeilen mit dem alten Namen.

begin;

update public.exercises
   set name = 'Back Squat (Full)'
 where key = 'back_squat'
   and name = 'Deep Back Squat';

commit;

-- Kontrolle (nach dem Lauf auszufuehren, erwartet 0 Zeilen):
--   select id, user_id, name from public.exercises
--    where key = 'back_squat' and name = 'Deep Back Squat';
