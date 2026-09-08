// Schreib-Baustein rund um den Uebungskatalog: die Aktionen der
// Uebungs-Meilensteine, der 1RM-Tests und der Katalog-Pflege als duenne Folgen
// ueber der Naht ExerciseStore. Hier liegen die Absicht-zu-Handgriff-Zuordnung,
// die Reihenfolge mehrstufiger Ablaeufe und die Anmeldepruefung – an einem Ort.
// Das eigentliche Schreiben und Fehlerwerfen macht der uebergebene Speicher.
//
// Haengt nur an der Naht (Typ ExerciseStore) und an den Schema-Typen, kennt
// Supabase nicht. Dadurch mit einem Speicher im Arbeitsspeicher pruefbar.
//
// Zur Regel des Rekords: der 1RM-Test setzt das 1RM der Uebung bewusst nach oben
// UND nach unten (anders als die Automatik im Training, wo das 1RM ein Rekord
// ist und nie automatisch sinkt). Was beim Loeschen eines Tests mit dem Rekord
// passiert, entscheidet weiterhin die reine Funktion `rollbackForDelete` beim
// Aufrufer – hier wird das Ergebnis nur ausgefuehrt.

import type {
  ExerciseStore,
  RmTestRowIns,
  UebungMeilensteinRowIns,
  UebungPatch,
} from "./exerciseStore";

/** Was der Nutzer mit einem Uebungs-Meilenstein will. Uebung und Nutzer-Kennung
 *  stehen nur beim Anlegen fest. */
/** Wogegen ein Meilenstein zaehlt: entweder ein festes Ziel in Kilogramm oder
 *  ein Faktor auf einen Koerperwert (Koerpergewicht bzw. fettfreie Masse). Der
 *  dynamische Zielwert wird nicht gespeichert, sondern beim Anzeigen aus dem
 *  Basiswert der letzten 30 Tage gerechnet. */
export type MeilensteinZiel =
  | { basis: "fix"; targetRm: number }
  | { basis: "koerpergewicht" | "ffm"; faktor: number };

export type MilestoneAction =
  | { type: "add"; exerciseId: string; name: string; ziel: MeilensteinZiel }
  | { type: "update"; id: string; name: string; ziel: MeilensteinZiel }
  | { type: "delete"; id: string }
  /** `ziel` ist der im Moment des Erreichens gueltige Zielwert in kg. */
  | { type: "markAchieved"; id: string; date: string; ziel: number };

/** Was der Nutzer mit einem 1RM-Test will. `restore` beschreibt beim Loeschen,
 *  auf welchen Stand der Rekord zurueckgeht – null heisst: der Rekord bleibt
 *  unberuehrt (der Test war nicht der juengste). */
export type RmTestAction =
  | {
      type: "add";
      exerciseId: string;
      date: string;
      weight: number;
      reps: number;
      estRm: number;
      previousRm: number | null;
      /** Freitext-Notiz zum Test (leer = keine Notiz). */
      notiz: string;
    }
  | {
      // Nachtraegliche Notiz zum Test (1RM-Block der Uebungsseite). Die
      // Messwerte bleiben unberuehrt.
      type: "updateNote";
      id: string;
      notiz: string;
    }
  | {
      type: "delete";
      id: string;
      exerciseId: string;
      restore: { rm: number | null; asOf: string | null } | null;
    };

/** Die im "Uebung anpassen"-Popup gepflegten Felder: Arbeitsgewicht und – nur
 *  wenn das Repband dort editierbar war – die Repband-Grenzen. Der Ziel-Score
 *  ist seit Issue #298 keine Stellschraube mehr. */
export interface ExerciseEditValues {
  work_weight: number;
  rep_range_min?: number;
  rep_range_max?: number;
}

/** Das Ziel in die drei Spalten uebersetzen. Immer alle drei, damit beim
 *  Wechsel der Art kein Rest der vorherigen stehen bleibt – die Datenbank
 *  laesst genau eine der beiden Kombinationen zu. */
function zielFelder(ziel: MeilensteinZiel): {
  basis: MeilensteinZiel["basis"];
  target_rm: number | null;
  faktor: number | null;
} {
  return ziel.basis === "fix"
    ? { basis: "fix", target_rm: ziel.targetRm, faktor: null }
    : { basis: ziel.basis, target_rm: null, faktor: ziel.faktor };
}

/** Eine Meilenstein-Aktion abspielen: Absicht herein, Handgriffe auf den
 *  Speicher heraus. Ohne angemeldeten Nutzer wird nichts geschrieben. */
export async function writeMilestoneAction(
  store: ExerciseStore,
  userId: string | null,
  action: MilestoneAction,
): Promise<void> {
  if (userId === null) throw new Error("Nicht angemeldet.");

  if (action.type === "add") {
    const row: UebungMeilensteinRowIns = {
      user_id: userId,
      exercise_id: action.exerciseId,
      name: action.name,
      ...zielFelder(action.ziel),
    };
    await store.insertMeilenstein(row);
    return;
  }

  if (action.type === "update") {
    await store.updateMeilenstein(action.id, {
      name: action.name,
      ...zielFelder(action.ziel),
    });
    return;
  }

  if (action.type === "markAchieved") {
    await store.markMeilensteinAchieved(action.id, action.date, action.ziel);
    return;
  }

  await store.deleteMeilenstein(action.id);
}

/** Eine 1RM-Test-Aktion abspielen. Anlegen und Loeschen sind zweistufig, und die
 *  Reihenfolge ist Teil der Absicht: erst die Test-Zeile, dann der Katalog –
 *  beim Loeschen erst die Zeile weg, dann (falls noetig) der Rekord zurueck.
 *  Die Notiz ist einstufig: sie beruehrt den Katalog nicht. */
export async function writeRmTestAction(
  store: ExerciseStore,
  userId: string | null,
  action: RmTestAction,
): Promise<void> {
  if (userId === null) throw new Error("Nicht angemeldet.");

  if (action.type === "add") {
    const row: RmTestRowIns = {
      user_id: userId,
      exercise_id: action.exerciseId,
      date: action.date,
      weight: action.weight,
      reps: action.reps,
      est_rm: action.estRm,
      previous_rm: action.previousRm,
      notiz: action.notiz,
    };
    await store.insertRmTest(row);
    // Der Test ist der frische Beleg: Rekord auf den gemessenen Wert, Datum des
    // Tests als Beleg-Datum, Veralten-Kennzeichen weg.
    await store.updateUebung(action.exerciseId, {
      rm: action.estRm,
      rm_as_of: action.date,
      rm_stale: false,
    });
    return;
  }

  if (action.type === "updateNote") {
    await store.updateRmTest(action.id, { notiz: action.notiz });
    return;
  }

  await store.deleteRmTest(action.id);

  if (action.restore) {
    // Rekord auf den Stand vor dem Test zuruecksetzen. Ohne Vorwert gilt die
    // Uebung wieder als "kein 1RM" (rm_stale, damit klar ist, dass ein frischer
    // Beleg fehlt).
    await store.updateUebung(action.exerciseId, {
      rm: action.restore.rm,
      rm_as_of: action.restore.asOf,
      rm_stale: action.restore.rm == null,
    });
  }
}

/** Die Katalog-Pflege abspielen: genau die uebergebenen Felder werden
 *  geschrieben, kein weiteres. */
export async function writeExerciseEdit(
  store: ExerciseStore,
  userId: string | null,
  id: string,
  values: ExerciseEditValues,
): Promise<void> {
  if (userId === null) throw new Error("Nicht angemeldet.");
  const patch: UebungPatch = { ...values };
  await store.updateUebung(id, patch);
}
