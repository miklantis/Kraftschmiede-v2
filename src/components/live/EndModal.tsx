import { Overlay } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { useLiveSession } from "@/hooks/useLiveSession";
import { useFinishSession } from "@/hooks/useFinishSession";
import { useFinishSkill } from "@/hooks/useFinishSkill";
import { liveEndSummary } from "@/lib/liveFinish";
import { skillEndSummary } from "@/lib/skillFinish";
import type { SkillSession, WorkoutSession } from "@/lib/liveSession";
import { useLiveClock } from "./useLiveClock";

// Ende-Popup. Zeigt - wie V1 - je Uebung eine Karte mit "erledigt / gesamt" und
// den Saetzen als Chips (erledigte hervorgehoben), dazu die Trainingsdauer.
// "Speichern" schreibt nur die abgehakten Saetze normalisiert in den Verlauf
// (bei fehlendem Netz pausiert und spaeter nachgeholt) und raeumt die laufende
// Einheit lokal; "Verwerfen" raeumt nur lokal. Workout und Skill teilen sich das
// Popup, schreiben aber ueber getrennte Pfade (Skill schreibt zusaetzlich den
// Fortschritt fort).

function ChipRow({
  name,
  count,
  allDone,
  chips,
}: {
  name: string;
  count: string;
  allDone: boolean;
  chips: { label: string; done: boolean }[];
}): React.ReactElement {
  return (
    <div className="rounded-[14px] bg-secondary px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-semibold text-foreground">{name}</span>
        <span
          className={
            "font-mono text-[13px] " +
            (allDone ? "text-primary" : "text-muted-foreground")
          }
        >
          {count}
        </span>
      </div>
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((c, j) => (
            <span
              key={j}
              className={
                "rounded-pill px-2 py-0.5 text-[12px] font-medium " +
                (c.done ? "bg-primary/12 text-primary" : "bg-card text-muted-foreground")
              }
            >
              {c.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutEnd({ s }: { s: WorkoutSession }): React.ReactElement {
  const live = useLiveSession();
  const { finishWorkout, isSaving } = useFinishSession();
  const summary = liveEndSummary(s);
  function onSave(): void {
    finishWorkout(s);
    live.clear();
  }
  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        {summary.map((e, i) => (
          <ChipRow
            key={e.name + i}
            name={e.name}
            count={e.count}
            allDone={false}
            chips={e.chips}
          />
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
  );
}

function SkillEnd({ s }: { s: SkillSession }): React.ReactElement {
  const live = useLiveSession();
  const { finishSkill, isSaving } = useFinishSkill();
  const summary = skillEndSummary(s, Date.now());
  function onSave(): void {
    finishSkill(s);
    live.clear();
  }
  return (
    <>
      <div className="mb-3 flex justify-center">
        <span className="text-[13px] text-muted-foreground">
          {summary.doneSets} / {summary.totalSets} Sätze
        </span>
      </div>
      <div className="mb-4 flex flex-col gap-2">
        {summary.entries.map((e, i) => (
          <ChipRow
            key={e.name + i}
            name={e.name}
            count={e.count}
            allDone={e.allDone}
            chips={e.chips}
          />
        ))}
      </div>
      <div className="mb-3.5 text-center text-xs text-muted-foreground">
        Speichern wertet die Einheit aus und schreibt den Fortschritt fort.
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
  );
}

export function EndModal(): React.ReactElement {
  const live = useLiveSession();
  const s = live.session;
  const open = live.ending && s != null;
  const clock = useLiveClock(open && s ? s.startedAt : null);
  const isSkill = s?.kind === "skill";

  return (
    <Overlay
      open={open}
      onClose={live.closeEnd}
      title={s ? (isSkill ? "Skill " : "Workout ") + s.title + " beenden" : undefined}
    >
      {s && (
        <>
          <div className="mb-3 flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-secondary px-2.5 py-1 text-[13px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="font-mono">{clock}</span>
            </span>
          </div>
          {s.kind === "skill" ? <SkillEnd s={s} /> : <WorkoutEnd s={s} />}
        </>
      )}
    </Overlay>
  );
}
