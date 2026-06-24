import { useEffect, useState } from "react";
import { Overlay } from "@/components/ui/overlay";
import { ExerciseLiveCard } from "@/components/live/ExerciseLiveCard";
import { useSessionsDetailed } from "@/hooks/useSessionsDetailed";
import { useExercises } from "@/hooks/useExercises";
import { useEditSession } from "@/hooks/useEditSession";
import type { HistorySessionInput, HistoryExercise } from "@/lib/history";
import type { LiveEntry } from "@/lib/liveSession";

// Panel zum nachtraeglichen Korrigieren einer abgeschlossenen Kraft-Einheit
// (Verlauf, Schritt 2a). Wiederverwendet die Live-Karte im Bearbeiten-Modus –
// gleiche Optik wie waehrend des Trainings, aber ohne Ablauf (kein Timer/Haken/
// aktiver Satz, keine Stange/Scheiben, keine Aufwaermsaetze). Laeuft auf dem
// generischen Overlay (Desktop zentriert, Mobile Bodenblatt) wie „Yoga eintragen“.
//
// Skill- und Yoga-Einheiten folgen in den Schritten 2b/2c; hier kommt nur Kraft an.

interface PanelSet {
  reps: number;
  weight: number;
  score: number;
  targetReps: number;
  targetWeight: number;
  adjusted: boolean;
  adjustNote: string;
}
interface PanelExercise {
  sessionExerciseId: string;
  exerciseId: string | null;
  name: string;
  sets: PanelSet[];
}
interface PanelDraft {
  date: string;
  minutes: number;
  exercises: PanelExercise[];
}

function workSetsOf(ex: HistoryExercise): PanelSet[] {
  return ex.sets
    .filter((s) => s.kind !== "warmup")
    .map((s) => {
      const reps = s.reps ?? 0;
      const weight = s.weight ?? 0;
      return {
        reps,
        weight,
        score: s.score ?? 3,
        targetReps: s.targetReps ?? reps,
        targetWeight: s.targetWeight ?? weight,
        adjusted: s.adjusted ?? false,
        adjustNote: "",
      };
    });
}

function buildDraft(
  input: HistorySessionInput,
  exName: (id: string) => string | undefined,
): PanelDraft {
  const exercises = input.exercises
    .slice()
    .sort((a, b) => a.position - b.position)
    .filter((ex) => ex.sessionExerciseId != null)
    .map((ex) => ({
      sessionExerciseId: ex.sessionExerciseId as string,
      exerciseId: ex.exerciseId,
      name:
        (ex.exerciseId ? exName(ex.exerciseId) : undefined) ||
        ex.name ||
        "Übung",
      sets: workSetsOf(ex),
    }));
  return {
    date: input.date,
    minutes: input.durationSec ? Math.round(input.durationSec / 60) : 0,
    exercises,
  };
}

function toLiveEntry(ex: PanelExercise): LiveEntry {
  return {
    exerciseId: ex.exerciseId ?? "",
    exerciseName: ex.name,
    category: "core", // neutral: keine Stange/Scheiben im Bearbeiten-Modus
    tag: "",
    barId: null,
    barName: null,
    barWeight: null,
    warmupSets: [],
    sets: ex.sets.map((s) => ({
      reps: s.reps,
      weight: s.weight,
      score: s.score,
      targetReps: s.targetReps,
      targetWeight: s.targetWeight,
      done: false,
      failed: false,
      adjusted: s.adjusted,
      adjustNote: s.adjustNote,
    })),
  };
}

export function SessionEditPanel({
  sessionId,
  open,
  onClose,
}: {
  sessionId: string | null;
  open: boolean;
  onClose: () => void;
}): React.ReactElement {
  const detailedQ = useSessionsDetailed();
  const exercisesQ = useExercises();
  const edit = useEditSession();

  const [draft, setDraft] = useState<PanelDraft | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const input =
    sessionId != null
      ? (detailedQ.data ?? []).find((s) => s.id === sessionId) ?? null
      : null;

  // Entwurf beim Oeffnen aus den gespeicherten Werten aufbauen (einmal je
  // Sitzung). Schliessen setzt zurueck.
  useEffect(() => {
    if (!open) {
      setDraft(null);
      setLoadedFor(null);
      return;
    }
    if (input && loadedFor !== input.id) {
      const exName = new Map(
        (exercisesQ.data ?? []).map((e) => [e.id, e.name]),
      );
      setDraft(buildDraft(input, (id) => exName.get(id)));
      setLoadedFor(input.id);
    }
  }, [open, input, loadedFor, exercisesQ.data]);

  function setExercises(
    fn: (exs: PanelExercise[]) => PanelExercise[],
  ): void {
    setDraft((d) => (d ? { ...d, exercises: fn(d.exercises) } : d));
  }

  function updateSet(
    ei: number,
    si: number,
    kind: "reps" | "weight" | "score",
    value: number,
  ): void {
    setExercises((exs) =>
      exs.map((ex, i) =>
        i !== ei
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j !== si ? s : { ...s, [kind]: value },
              ),
            },
      ),
    );
  }

  function addSet(ei: number): void {
    setExercises((exs) =>
      exs.map((ex, i) => {
        if (i !== ei) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const next: PanelSet = last
          ? { ...last, adjusted: false, adjustNote: "" }
          : {
              reps: 8,
              weight: 0,
              score: 3,
              targetReps: 8,
              targetWeight: 0,
              adjusted: false,
              adjustNote: "",
            };
        return { ...ex, sets: [...ex.sets, next] };
      }),
    );
  }

  function delSet(ei: number): void {
    setExercises((exs) =>
      exs.map((ex, i) =>
        i !== ei || ex.sets.length <= 1
          ? ex
          : { ...ex, sets: ex.sets.slice(0, -1) },
      ),
    );
  }

  function setMinutes(value: number): void {
    setDraft((d) => (d ? { ...d, minutes: Math.max(0, value) } : d));
  }

  function save(): void {
    if (!draft || !sessionId) return;
    edit.save({
      sessionId,
      date: draft.date,
      durationSec: draft.minutes > 0 ? draft.minutes * 60 : null,
      exercises: draft.exercises.map((ex) => ({
        sessionExerciseId: ex.sessionExerciseId,
        exerciseId: ex.exerciseId,
        sets: ex.sets,
      })),
    });
    onClose();
  }

  return (
    <Overlay open={open} onClose={onClose} title="Einheit bearbeiten">
      {!draft ? (
        <p className="py-4 text-[14px] text-muted-foreground">Wird geladen …</p>
      ) : draft.exercises.length === 0 ? (
        <p className="py-4 text-[14px] text-muted-foreground">
          Diese Einheit lässt sich hier nicht bearbeiten.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Dauer (Minuten) */}
          <div className="flex items-center justify-between rounded-control bg-muted px-4 py-2.5">
            <span className="text-[13px] font-semibold text-muted-foreground">
              Dauer
            </span>
            <span className="flex items-baseline gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                aria-label="Dauer in Minuten"
                className="h-[26px] w-[64px] rounded-[8px] bg-card px-2 text-right font-mono text-[16px] font-semibold text-foreground shadow-card outline-none focus:ring-2 focus:ring-primary/40"
                value={String(draft.minutes)}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setMinutes(Number.isNaN(n) ? 0 : n);
                }}
              />
              <span className="text-[13px] font-medium text-muted-foreground">
                min
              </span>
            </span>
          </div>

          {/* Uebungen als Live-Karten im Bearbeiten-Modus */}
          {draft.exercises.map((ex, ei) => (
            <ExerciseLiveCard
              key={ex.sessionExerciseId}
              entry={toLiveEntry(ex)}
              ei={ei}
              active={null}
              plateMode={0}
              plates={[]}
              bars={[]}
              unit="kg"
              editMode
              onToggleWarm={() => {}}
              onToggleSet={() => {}}
              onWarmValue={() => {}}
              onSetValue={(si, kind, value) => updateSet(ei, si, kind, value)}
              onAddSet={() => addSet(ei)}
              onDelSet={() => delSet(ei)}
              onChangeBar={() => {}}
              onCyclePlate={() => {}}
            />
          ))}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={edit.isSaving}
              className="w-full rounded-control bg-primary py-3 text-[15px] font-semibold text-primary-foreground transition-[filter] hover:brightness-105 disabled:opacity-50"
            >
              {edit.isSaving ? "Speichern …" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-[14px] font-medium text-muted-foreground"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </Overlay>
  );
}
