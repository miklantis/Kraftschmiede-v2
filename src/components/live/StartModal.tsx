import { useNavigate } from "@tanstack/react-router";
import { Overlay } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { useLiveSession } from "@/hooks/useLiveSession";
import { useLatestBody } from "@/hooks/useBody";
import { fmtKg, todayISO } from "@/lib/format";
import type { LiveEntry } from "@/lib/liveSession";

// Start-Popup (vor dem Workout). Nutzt das Overlay-Primitive (Desktop zentriert,
// Mobile Bodenblatt). Zeigt die Vorschau der aufgebauten Saetze - 1:1 wie V1
// (live.js buildStartInner): Untertitel "Vorschau deiner Saetze", bei fehlendem
// heutigem Koerperzustand ein Hinweis-Banner ("Eintragen" -> Koerper-Seite), und
// je Uebung eine Karte mit "N x Satz" plus den Satz-Chips (Wdh x kg).
// "Los geht's" laesst das Popup ausfahren und danach das Panel hereinfahren.

// Satz-Chip wie V1: "Wdh × kg" mit deutschem Komma (z. B. "7 × 25 kg").
function setChip(reps: number, weight: number): string {
  return reps + " × " + fmtKg(weight) + " kg";
}

function StartCard({ entry }: { entry: LiveEntry }): React.ReactElement {
  return (
    <div className="rounded-[14px] bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold text-foreground">
          {entry.exerciseName}
        </span>
        <span className="text-[13px] text-muted-foreground">
          {entry.sets.length} × Satz
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {entry.sets.map((st, i) => (
          <span
            key={i}
            className="rounded-[10px] bg-secondary px-3 py-1.5 font-mono text-[13px] font-medium text-foreground"
          >
            {setChip(st.reps, st.weight)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StartModal(): React.ReactElement {
  const live = useLiveSession();
  const navigate = useNavigate();
  const bodyQ = useLatestBody();
  const p = live.pending;

  // Banner nur, wenn heute noch kein Koerperzustand erfasst ist (V1 todayBody()).
  const todayBodyDone = bodyQ.data?.date === todayISO();

  // Aus dem Popup zum Koerper-Tab: Vorschau verwerfen, dort eintragen.
  const toBody = (): void => {
    live.cancelStart();
    void navigate({ to: "/koerper" });
  };

  return (
    <Overlay
      open={p != null}
      onClose={live.cancelStart}
      title={p ? "Workout " + p.title + " starten" : undefined}
    >
      {p && (
        <>
          <div className="mb-3 text-[13px] text-muted-foreground">
            {p.entries.length} Übungen · Vorschau deiner Sätze
          </div>

          {!todayBodyDone && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-[14px] border border-warning/30 bg-warning/10 px-4 py-3">
              <div>
                <div className="text-[15px] font-semibold text-warning-foreground">
                  Körperzustand noch nicht erfasst
                </div>
                <div className="mt-0.5 text-[13px] text-warning-foreground/80">
                  Kurz eintragen → bessere Gewichtsvorschläge.
                </div>
              </div>
              <button
                type="button"
                onClick={toBody}
                className="flex-none rounded-[10px] border border-warning/40 bg-card px-3.5 py-2 text-[14px] font-semibold text-warning-foreground"
              >
                Eintragen
              </button>
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3">
            {p.entries.map((entry, i) => (
              <StartCard key={entry.exerciseId + i} entry={entry} />
            ))}
          </div>

          <Button
            onClick={live.confirmStart}
            className="h-auto w-full rounded-[14px] py-3.5 text-base leading-tight"
          >
            Los geht’s
          </Button>
          <Button
            variant="outline"
            onClick={live.cancelStart}
            className="mt-2 h-auto w-full rounded-[14px] py-3.5 text-base leading-tight min-[960px]:hidden"
          >
            Abbrechen
          </Button>
        </>
      )}
    </Overlay>
  );
}
