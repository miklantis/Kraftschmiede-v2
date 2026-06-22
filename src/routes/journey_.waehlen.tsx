import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import {
  TemplateCard,
  type TemplateCardModel,
} from "@/components/journey/TemplateCard";
import { JourneyNameEdit } from "@/components/journey/JourneyNameEdit";
import {
  useJourneyTemplates,
  type JourneyTemplateWithPhases,
} from "@/hooks/useJourneyTemplates";
import { useActiveJourney } from "@/hooks/useJourney";
import { useJourneyActions } from "@/hooks/useJourneyActions";
import { totalWeeks } from "@/lib/journey";

// Vorlagen-Waehler: Zurueck-Knopf, optional Namensfeld der aktiven Journey,
// dann die Vorlagen als Karten. Eine Vorlage waehlen legt eine neue aktive
// Journey an und fuehrt zurueck ins Training (wie V1). Optik aus V1 (jr-pick).
export const Route = createFileRoute("/journey_/waehlen")({
  component: JourneyPickerPage,
});

const INTRO =
  "Eine Journey gibt dir über mehrere Wochen einen roten Faden mit aufeinander aufbauenden Phasen. Wähle die, die zu deinem Ziel passt.";

function JourneyPickerPage(): React.ReactElement {
  const navigate = useNavigate();
  const templatesQ = useJourneyTemplates();
  const journeyQ = useActiveJourney();
  const actions = useJourneyActions();

  const active = journeyQ.data ?? null;
  const hasActive = active !== null;
  const title = hasActive ? "Vorlage wechseln" : "Journey wählen";

  const start = (template: JourneyTemplateWithPhases): void => {
    void actions.createFromTemplate(template).then(() => {
      void navigate({ to: "/" });
    });
  };

  const back = (
    <Link
      to="/journey"
      className="mb-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary"
    >
      <ChevronLeft className="size-4" />
      Journey
    </Link>
  );

  if (templatesQ.isLoading || journeyQ.isLoading) {
    return (
      <div>
        {back}
        <p className="text-sm text-muted-foreground">Wird geladen …</p>
      </div>
    );
  }

  if (templatesQ.isError) {
    return (
      <div>
        {back}
        <p className="text-sm text-danger">
          Vorlagen konnten nicht geladen werden
          {templatesQ.error instanceof Error
            ? ": " + templatesQ.error.message
            : "."}
        </p>
      </div>
    );
  }

  const templates = templatesQ.data ?? [];
  const models: Array<{ template: JourneyTemplateWithPhases; card: TemplateCardModel }> =
    templates.map((t) => ({
      template: t,
      card: {
        id: t.id,
        name: t.name,
        duration: `${totalWeeks(t.phases)} Wochen · ${t.phases.length} ${
          t.phases.length === 1 ? "Phase" : "Phasen"
        }`,
        tagline: t.tagline ?? "",
        forWhom: t.for_whom ?? "",
        summary: t.summary ?? "",
        phaseNames: t.phases.map((p) => p.name),
        active: active !== null && t.id === active.source_template_id,
      },
    }));

  return (
    <div>
      {back}

      {active !== null && (
        <JourneyNameEdit
          name={active.name}
          busy={actions.isRenaming}
          onCommit={(next) => void actions.rename(active.id, next)}
        />
      )}

      <h1 className="mb-3 text-[28px] font-bold tracking-[-0.4px] text-foreground min-[960px]:mb-4 min-[960px]:text-[34px] min-[960px]:tracking-[-0.5px]">
        {title}
      </h1>
      <p className="mb-6 max-w-[680px] text-[13px] leading-[1.55] text-muted-foreground min-[960px]:mb-7 min-[960px]:text-[14.5px]">
        {INTRO}
      </p>

      {actions.error != null && (
        <p className="mb-4 text-sm text-danger">
          Aktion fehlgeschlagen
          {actions.error instanceof Error
            ? ": " + actions.error.message
            : "."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-[18px] min-[960px]:grid-cols-2">
        {models.map(({ template, card }) => (
          <TemplateCard
            key={card.id}
            model={card}
            busy={actions.isCreating}
            onStart={() => start(template)}
          />
        ))}
      </div>
    </div>
  );
}
