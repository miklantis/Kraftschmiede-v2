import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useExercises } from "@/hooks/useExercises";
import { exerciseRowSub } from "@/lib/exercises";

// Uebungs-Detail. Eigenstaendige Vollseite (entschachtelt mit _), ersetzt die
// Liste wie in V1 (Detail ist kein Unter-Outlet der Liste). Schritt 2 legt nur
// den Kopf an (Zurueck, Name, Badge); Statistik, Verlaufschart, Muscle-Map und
// "Uebung anpassen" folgen in den naechsten Schritten.
export const Route = createFileRoute("/uebungen_/$exerciseId")({
  component: ExerciseDetailPage,
});

function BackLink(): React.ReactElement {
  return (
    <Link
      to="/uebungen"
      className="mb-3 inline-flex items-center gap-1 text-[15px] font-medium text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-[18px]" />
      Übungen
    </Link>
  );
}

function ExerciseDetailPage(): React.ReactElement {
  const { exerciseId } = Route.useParams();
  const exercisesQ = useExercises();

  if (exercisesQ.isLoading) {
    return (
      <div>
        <BackLink />
        <p className="text-sm text-muted-foreground">Wird geladen …</p>
      </div>
    );
  }

  const ex = (exercisesQ.data ?? []).find((e) => e.id === exerciseId) ?? null;

  if (!ex) {
    return (
      <div>
        <BackLink />
        <p className="text-sm text-muted-foreground">
          Diese Übung wurde nicht gefunden.
        </p>
      </div>
    );
  }

  return (
    <div>
      <BackLink />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-[28px] font-bold tracking-[-0.4px] text-foreground min-[960px]:text-[34px] min-[960px]:tracking-[-0.5px]">
          {ex.name}
        </h1>
        <span className="rounded-[20px] bg-muted px-2.5 py-1 text-[13px] font-medium text-muted-foreground">
          {exerciseRowSub(ex)}
        </span>
      </div>
      {ex.description && (
        <p className="mt-3 text-[15px] leading-[1.5] text-muted-foreground">
          {ex.description}
        </p>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        Statistik, Verlaufsdiagramm und Muscle-Map folgen im nächsten Schritt.
      </p>
    </div>
  );
}
