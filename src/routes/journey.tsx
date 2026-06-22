import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { ActiveJourneyCard } from "@/components/journey/ActiveJourneyCard";
import { PhaseList } from "@/components/journey/PhaseList";
import { JourneyEmpty } from "@/components/journey/JourneyEmpty";
import { useJourneyView } from "@/hooks/useJourneyView";

// Journey: aktive Journey, Phasen-Ablauf und (spaeter) die Periodisierungskurve.
// Reine Anzeige plus der Weg zum Vorlagen-Waehler. Einspaltig wie V1; Phasen als
// Raster (Desktop) bzw. Liste (Mobile). Die Kurve folgt als zweiter Schritt.
export const Route = createFileRoute("/journey")({
  component: JourneyPage,
});

function JourneyPage(): React.ReactElement {
  const { isLoading, isError, error, data, hasJourney } = useJourneyView();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Journey" />
        <p className="text-sm text-muted-foreground">Wird geladen …</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Journey" />
        <p className="text-sm text-danger">
          Daten konnten nicht geladen werden
          {error instanceof Error ? ": " + error.message : "."}
        </p>
      </div>
    );
  }

  if (!hasJourney || !data) {
    return (
      <div>
        <PageHeader title="Journey" />
        <JourneyEmpty />
      </div>
    );
  }

  const metaLine = [
    data.templateName,
    data.startLong !== null ? "seit " + data.startLong : null,
  ]
    .filter((x): x is string => x !== null && x !== "")
    .join(" · ");

  return (
    <div>
      <PageHeader title="Journey" />
      <div className="flex flex-col gap-7 min-[960px]:gap-8">
        <ActiveJourneyCard name={data.name} metaLine={metaLine} />
        <Section eyebrow="Phasen · Ablauf">
          <PhaseList phases={data.phases} />
        </Section>
      </div>
    </div>
  );
}
