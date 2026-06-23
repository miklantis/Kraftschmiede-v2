import { Overlay } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { useLiveSession } from "@/hooks/useLiveSession";
import { useFinishSession } from "@/hooks/useFinishSession";
import { liveEndSummary } from "@/lib/liveFinish";
import { useLiveClock } from "./useLiveClock";

// Ende-Popup. Zeigt - wie V1 (buildEndInner/endSummaryData) - je Uebung eine
// Karte mit "erledigt / gesamt" und den Arbeitssaetzen als Chips (erledigte
// hervorgehoben), dazu die Trainingsdauer. "Speichern" schreibt nur die
// abgehakten Saetze normalisiert in den Verlauf (useFinishSession; bei fehlendem
// Netz pausiert und spaeter nachgeholt) und raeumt die laufende Einheit lokal.
// "Verwerfen" raeumt nur lokal.
export function EndModal(): React.ReactElement {
  const live = useLiveSession();
  const { finishWorkout, isSaving } = useFinishSession();
  const s = live.session;
  const open = live.ending && s != null;
  const clock = useLiveClock(open && s ? s.startedAt : null);

  const summary = s ? liveEndSummary(s) : [];

  function onSave(): void {
    if (!s) return;
    finishWorkout(s);
    live.clear();
  }

  return (
    <Overlay
      open={open}
      onClose={live.closeEnd}
      title={s ? "Workout " + s.title + " beenden" : undefined}
    >
      {s && (
        <>
          <div className="mb-3 flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-secondary px-2.5 py-1 text-[13px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="font-mono">{clock}</span>
            </span>
          </div>

          <div className="mb-4 flex flex-col gap-2">
            {summary.map((e, i) => (
              <div key={e.name + i} className="rounded-[14px] bg-secondary px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[15px] font-semibold text-foreground">{e.name}</span>
                  <span className="font-mono text-[13px] text-muted-foreground">{e.count}</span>
                </div>
                {e.chips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {e.chips.map((c, j) => (
                      <span
                        key={j}
                        className={
                          "rounded-pill px-2 py-0.5 text-[12px] font-medium " +
                          (c.done
                            ? "bg-primary/12 text-primary"
                            : "bg-card text-muted-foreground")
                        }
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mb-3.5 text-center text-xs text-muted-foreground">
            Speichern übernimmt nur erledigte Sätze in den Verlauf.
          </div>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="h-auto w-full rounded-[14px] py-3.5 text-base leading-tight"
          >
            Speichern
          </Button>
          <Button
            variant="destructive"
            onClick={live.discard}
            className="mt-2 h-auto w-full rounded-[14px] py-3.5 text-base leading-tight"
          >
            Verwerfen
          </Button>
        </>
      )}
    </Overlay>
  );
}
