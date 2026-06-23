import type { AudioPrefs } from "@/lib/liveAudio";
import type { SkillLiveExercise } from "@/lib/liveSession";
import { LiveNumberInput } from "./LiveNumberInput";
import { SkillWatchValue } from "./SkillWatchValue";
import { SetCheck } from "./SetCheck";

// Eine Uebungskarte der laufenden Skill-Einheit (Phase 11, Lieferung 5).
// Kopf mit Name, optionalem Tempo und dem Metrik-Tag (WDH/DAUER); Tabelle
// Satz | Ziel | Ergebnis | Haken. Bei Haltezeit kommt die Stoppuhr-Zelle, bei
// Wiederholungen das einfache Zahlenfeld. Anders als beim Kraft-Workout gibt es
// keinen aktiven (naechsten) Satz und keine Pausen-Vorschlaege - nur abhaken und
// das Ergebnis eintragen (V1-Paritaet liveSkillSession).

const ROW = "grid grid-cols-[34px_1fr_1.4fr_30px] items-center gap-2";

function rowCls(done: boolean): string {
  const base = ROW + " my-0.5 rounded-[11px] border-2 px-1.5 py-2 text-[14px]";
  return done ? base + " border-transparent bg-primary/[0.07]" : base + " border-transparent";
}

export function SkillLiveCard({
  exercise,
  watchSi,
  audioPrefs,
  onToggleSet,
  onValue,
  onStartWatch,
  onStopWatch,
}: {
  exercise: SkillLiveExercise;
  /** Index des Satzes mit laufender Stoppuhr in dieser Uebung, sonst null. */
  watchSi: number | null;
  audioPrefs: AudioPrefs;
  onToggleSet: (si: number) => void;
  onValue: (si: number, value: number) => void;
  onStartWatch: (si: number) => void;
  onStopWatch: () => void;
}): React.ReactElement {
  const isDur = exercise.metric === "duration";
  const tag = isDur ? "DAUER" : "WDH";
  const targetLabel = isDur ? exercise.target + " s" : exercise.target + " Wdh";

  return (
    <div className="overflow-hidden rounded-[14px] bg-card shadow-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-bold text-foreground">{exercise.name}</div>
          {exercise.tempo && (
            <div className="mt-0.5 text-[12px] text-muted-foreground">{exercise.tempo}</div>
          )}
        </div>
        <span className="flex-none rounded-pill bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {tag}
        </span>
      </div>

      <div className="px-4 pb-4 pt-2">
        <div
          className={
            ROW +
            " border-b border-border px-1.5 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground [&>span]:text-center"
          }
        >
          <span>Satz</span>
          <span>Ziel</span>
          <span>Ergebnis</span>
          <span />
        </div>

        {exercise.sets.map((st, si) => (
          <div key={si} className={rowCls(st.done)}>
            <span className="text-center text-muted-foreground">S{si + 1}</span>
            <span className="text-center font-mono text-muted-foreground">{targetLabel}</span>
            {isDur ? (
              <SkillWatchValue
                value={st.value}
                target={exercise.target}
                active={watchSi === si}
                audioPrefs={audioPrefs}
                onStart={() => onStartWatch(si)}
                onStop={onStopWatch}
                onCommit={(v) => onValue(si, v)}
                ariaLabel={"Haltezeit Satz " + (si + 1)}
              />
            ) : (
              <LiveNumberInput
                value={st.value ?? 0}
                onCommit={(v) => onValue(si, v)}
                decimal={false}
                ariaLabel={"Wiederholungen Satz " + (si + 1)}
              />
            )}
            <SetCheck
              done={st.done}
              active={false}
              onToggle={() => onToggleSet(si)}
              ariaLabel={"Satz " + (si + 1) + " abhaken"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
