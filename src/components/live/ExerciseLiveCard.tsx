import { scoreInfo } from "@/engine";
import { fmtKg } from "@/lib/format";
import type { LiveEntry } from "@/lib/liveSession";
import { PlateChips } from "./PlateChips";

// Eine Uebungskarte der laufenden Session (Phase 11, Lieferung 2). Kopf mit Name,
// Tag und (bei Langhantel) Stange; darunter die Tabelle Satz | Wdh | kg | RIR |
// Haken - erst Aufwaermsaetze (A1..), dann Arbeitssaetze (S1..), bei Langhantel
// mit Scheiben-Chips je Satz. Reine Anzeige der vom Coach geplanten Werte;
// Bearbeiten/Abhaken, Stangenwechsel und +/- folgen in Lieferung 3.

const ROW = "grid grid-cols-[28px_1fr_1fr_minmax(40px,52px)_28px] items-center gap-2";

function InertCheck(): React.ReactElement {
  return (
    <span
      aria-hidden
      className="ml-auto size-[22px] rounded-md border border-border bg-secondary/60"
    />
  );
}

export function ExerciseLiveCard({
  entry,
  plates,
  unit,
}: {
  entry: LiveEntry;
  plates: number[];
  unit: string;
}): React.ReactElement {
  const isBar = entry.category === "barbell" && entry.barWeight != null;
  const showChips = isBar && plates.length > 0;

  return (
    <div className="overflow-hidden rounded-[14px] bg-card shadow-card">
      <div className="border-b border-border px-4 py-3">
        <div className="text-[15px] font-semibold text-foreground">
          {entry.exerciseName}
        </div>
        {entry.tag && (
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            {entry.tag}
          </div>
        )}
        {isBar && entry.barName && (
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            Stange · {entry.barName} · {fmtKg(entry.barWeight)} {unit}
          </div>
        )}
      </div>

      <div className="px-4 py-2">
        <div
          className={
            ROW +
            " py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          }
        >
          <span>Satz</span>
          <span>Wdh</span>
          <span>kg</span>
          <span>RIR</span>
          <span />
        </div>

        {entry.warmupSets.map((ws, wi) => (
          <div key={"w" + wi}>
            <div
              className={ROW + " border-t border-border py-2.5 text-[14px] text-muted-foreground"}
            >
              <span className="text-muted-foreground">A{wi + 1}</span>
              <span className="font-mono">{ws.reps}</span>
              <span className="font-mono">{fmtKg(ws.weight)}</span>
              <span className="text-muted-foreground">–</span>
              <InertCheck />
            </div>
            {showChips && (
              <div className="pb-1.5">
                <PlateChips
                  total={ws.weight}
                  barWeight={entry.barWeight!}
                  plates={plates}
                />
              </div>
            )}
          </div>
        ))}

        {entry.sets.map((st, si) => {
          const inf = scoreInfo(st.score);
          return (
            <div key={"s" + si}>
              <div className={ROW + " border-t border-border py-2.5 text-[14px]"}>
                <span className="text-muted-foreground">S{si + 1}</span>
                <span className="font-mono text-foreground">{st.reps}</span>
                <span className="font-mono text-foreground">{fmtKg(st.weight)}</span>
                <span className="font-mono text-muted-foreground">
                  {inf ? inf.rir : "–"}
                </span>
                <InertCheck />
              </div>
              {showChips && (
                <div className="pb-1.5">
                  <PlateChips
                    total={st.weight}
                    barWeight={entry.barWeight!}
                    plates={plates}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
