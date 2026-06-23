import type { LiveGeneralWarmupSet } from "@/lib/liveSession";

// Allgemeines Aufwaermen (Cardio) als erste Karte der Session. Lieferung 2:
// reine Anzeige der geplanten Saetze; Bearbeiten/Abhaken und +/- folgen in
// Lieferung 3.

const MODE_LABEL: Record<string, string> = {
  bike: "Rad",
  row: "Rudern",
  walk: "Gehen",
  vario: "Vario",
  other: "Sonstiges",
};

function InertCheck(): React.ReactElement {
  return (
    <span
      aria-hidden
      className="ml-auto size-[22px] rounded-md border border-border bg-secondary/60"
    />
  );
}

export function GeneralWarmupCard({
  sets,
}: {
  sets: LiveGeneralWarmupSet[];
}): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-[14px] bg-card shadow-card">
      <div className="border-b border-border px-4 py-3 text-[15px] font-semibold text-foreground">
        Aufwärmen
      </div>
      <div className="px-4 py-2">
        <div className="grid grid-cols-[28px_1fr_1fr_28px] items-center gap-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>Satz</span>
          <span>Dauer (min)</span>
          <span>Art</span>
          <span />
        </div>
        {sets.map((ws, i) => (
          <div
            key={i}
            className="grid grid-cols-[28px_1fr_1fr_28px] items-center gap-2 border-t border-border py-2.5 text-[14px]"
          >
            <span className="text-muted-foreground">S{i + 1}</span>
            <span className="font-mono text-foreground">{ws.minutes}</span>
            <span className="text-foreground">
              {MODE_LABEL[ws.mode] ?? ws.mode}
            </span>
            <InertCheck />
          </div>
        ))}
      </div>
    </div>
  );
}
