import { cn } from "@/lib/utils";

// Generische Statistik-Reihe: ein paar Zellen mit grossem Wert und kleinem
// Label darunter. Domaenenfrei (Optik aus V1 ub-statrow). Auf schmalen Karten
// nebeneinander; mit accent wird ein Wert in der Markenfarbe hervorgehoben.
export interface StatCell {
  value: string;
  label: string;
  accent?: boolean;
}

export function StatRow({
  cells,
  className,
}: {
  cells: StatCell[];
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-[16px] bg-card p-4 shadow-card",
        className,
      )}
    >
      {cells.map((c, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div
            className={cn(
              "font-mono text-[20px] font-semibold tabular-nums",
              c.accent ? "text-primary" : "text-foreground",
            )}
          >
            {c.value}
          </div>
          <div className="text-[12px] text-muted-foreground">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
