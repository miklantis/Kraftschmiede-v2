import { useMemo } from "react";
import { useComposition } from "./useComposition";
import { basisWerte } from "@/lib/meilensteinBasis";
import { todayISO } from "@/lib/format";
import type { MeilensteinBasisWerte } from "@/lib/meilensteinBasis";

// Die Koerperwerte, gegen die dynamische Uebungs-Meilensteine rechnen:
// Koerpergewicht und fettfreie Masse, jeweils gemittelt ueber die letzten 30
// Tage. Liest die vorhandene Mess-Abfrage mit (kein zusaetzlicher Zugriff) und
// rechnet daraus. Ist noch nichts geladen oder liegt im Fenster keine Messung,
// stehen beide Werte auf null – dynamische Meilensteine warten dann auf eine
// Messung.
export function useMeilensteinBasis(): MeilensteinBasisWerte {
  const compositionQ = useComposition();
  const rows = compositionQ.data;
  return useMemo(
    () => basisWerte(rows ?? [], todayISO()),
    [rows],
  );
}
