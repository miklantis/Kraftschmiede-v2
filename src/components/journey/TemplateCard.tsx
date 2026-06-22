// Anzeige-Modell einer Vorlagenkarte (reine Strings/Flags).
export interface TemplateCardModel {
  id: string;
  name: string;
  duration: string; // z. B. "12 Wochen · 4 Phasen"
  tagline: string;
  forWhom: string;
  summary: string;
  phaseNames: string[];
  active: boolean;
}

// Eine Vorlage im Waehler: Name, Dauer, Kurzbeschreibung, "Fuer wen",
// Zusammenfassung, Phasen-Chips und Startknopf. Die aktive Vorlage zeigt einen
// ruhenden Status statt eines Knopfs. Optik aus V1 (jr-tpl).
export function TemplateCard({
  model,
  busy,
  onStart,
}: {
  model: TemplateCardModel;
  busy: boolean;
  onStart: () => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col rounded-[18px] bg-card p-4 shadow-card min-[960px]:p-[22px]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="text-[16px] font-bold text-foreground min-[960px]:text-[18px]">
          {model.name}
        </span>
        <span className="flex-none rounded-[7px] bg-secondary px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          {model.duration}
        </span>
      </div>
      {model.tagline !== "" && (
        <div className="mb-2 text-[13px] font-semibold text-primary min-[960px]:mb-3 min-[960px]:text-[14px]">
          {model.tagline}
        </div>
      )}
      {model.forWhom !== "" && (
        <div className="mb-1.5 text-[12px] leading-[1.5] text-[#a0a0a5] min-[960px]:text-[13px]">
          <strong className="font-semibold text-muted-foreground">Für:</strong>{" "}
          {model.forWhom}
        </div>
      )}
      {model.summary !== "" && (
        <div className="mb-3 flex-1 text-[12px] leading-[1.5] text-muted-foreground min-[960px]:mb-3.5 min-[960px]:text-[13px] min-[960px]:leading-[1.55]">
          {model.summary}
        </div>
      )}
      {model.phaseNames.length > 0 && (
        <div className="mb-3.5 flex flex-wrap gap-1.5 min-[960px]:mb-[18px]">
          {model.phaseNames.map((p, i) => (
            <span
              key={i}
              className="rounded-[7px] bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground/80"
            >
              {p}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={busy || model.active}
        onClick={onStart}
        className={
          "w-full rounded-control py-3 text-sm font-semibold transition-[filter] " +
          (model.active
            ? "cursor-default bg-secondary text-muted-foreground"
            : "bg-primary text-primary-foreground hover:brightness-105 disabled:opacity-60")
        }
      >
        {model.active ? "✓ Aktive Journey" : "Diese Journey starten"}
      </button>
    </div>
  );
}
