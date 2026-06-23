import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { List, ListRow } from "@/components/ui/list";
import { StatRow } from "@/components/ui/stat-row";
import { ExerciseChartCard } from "@/components/exercise/ExerciseChartCard";
import { useExerciseDetail } from "@/hooks/useExerciseDetail";
import { exerciseRowSub } from "@/lib/exercises";
import { longDateShort } from "@/lib/format";

// Uebungs-Detail. Eigenstaendige Vollseite (entschachtelt mit _), ersetzt die
// Liste wie in V1. Schritt 3 zeigt Kopf, Statistik-Reihe und den Trainings-
// verlauf; Verlaufsdiagramm (Schritt 4) und Muscle-Map (Schritt 5) folgen.
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
  const {
    isLoading,
    isError,
    error,
    exercise,
    stats,
    verlauf,
    chartHistory,
    metricOptions,
    defaultMetric,
    unit,
  } = useExerciseDetail(exerciseId);

  if (isLoading) {
    return (
      <div>
        <BackLink />
        <p className="text-sm text-muted-foreground">Wird geladen …</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <BackLink />
        <p className="text-sm text-danger">
          Daten konnten nicht geladen werden
          {error instanceof Error ? ": " + error.message : "."}
        </p>
      </div>
    );
  }

  if (!exercise) {
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
      <PageHeader title={exercise.name} className="mb-3 min-[960px]:mb-4" />
      <div className="-mt-2 mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-[20px] bg-muted px-2.5 py-1 text-[13px] font-medium text-muted-foreground">
          {exerciseRowSub(exercise)}
        </span>
      </div>
      {exercise.description && (
        <p className="mb-5 text-[15px] leading-[1.5] text-muted-foreground">
          {exercise.description}
        </p>
      )}

      <StatRow cells={stats} className="mb-6" />

      {metricOptions.length > 0 && (
        <div className="mb-6">
          <ExerciseChartCard
            history={chartHistory}
            options={metricOptions}
            defaultMetric={defaultMetric}
            unit={unit}
          />
        </div>
      )}

      <Section eyebrow="Verlauf">
        {verlauf.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">
            Noch keine absolvierte Session mit dieser Übung.
          </p>
        ) : (
          <List bordered>
            {verlauf.map((r, i) => (
              <ListRow
                key={i}
                title={longDateShort(r.date)}
                subtitle={r.line || undefined}
                trailing={
                  r.right ? (
                    <span className="font-mono text-[14px] text-muted-foreground tabular-nums">
                      {r.right}
                    </span>
                  ) : undefined
                }
              />
            ))}
          </List>
        )}
      </Section>
    </div>
  );
}
