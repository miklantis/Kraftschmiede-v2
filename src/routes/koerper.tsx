import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { RestBanner } from "@/components/body/RestBanner";
import { BodySoreMap } from "@/components/body/BodySoreMap";
import { BodyStateCard } from "@/components/body/BodyStateCard";
import { BodyHistoryCard } from "@/components/body/BodyHistoryCard";
import { useBodyView } from "@/hooks/useBodyView";

// Koerper-Seite. Zwei Haelften: links das taegliche Befinden (Empfehlungs-
// Banner, Muskelkater-Figur, Eingabe, Verlauf), spaeter rechts die Koerper-
// messung (Phase 9, Schritt 2). Vorerst die Befinden-Haelfte als einzelne,
// breitenbegrenzte Spalte; das Zwei-Spalten-Raster kommt mit der Messung dazu.
export const Route = createFileRoute("/koerper")({
  component: KoerperPage,
});

function KoerperPage(): React.ReactElement {
  const view = useBodyView();

  if (view.isLoading) {
    return (
      <div>
        <PageHeader title="Körper" />
        <p className="text-sm text-muted-foreground">Wird geladen …</p>
      </div>
    );
  }

  if (view.isError) {
    return (
      <div>
        <PageHeader title="Körper" />
        <p className="text-sm text-danger">
          Daten konnten nicht geladen werden
          {view.error instanceof Error ? ": " + view.error.message : "."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Körper" />
      <div className="mx-auto flex max-w-[560px] flex-col gap-7">
        <RestBanner advice={view.advice} />

        <Section eyebrow="Muskelkater">
          <BodySoreMap values={view.soreValues} info={view.soreInfo} />
        </Section>

        <Section eyebrow="Körperzustand heute">
          <BodyStateCard today={view.today} hasToday={view.hasToday} />
        </Section>

        <Section eyebrow="Verlauf">
          <BodyHistoryCard history={view.history} />
        </Section>
      </div>
    </div>
  );
}
