import { plateBreakdown } from "@/engine";
import { fmtNum } from "@/lib/format";

// Scheiben pro Seite als schlichte Chips (1:1 aus V1 klSubChips). `total` ist das
// Gesamtgewicht inkl. Stange; daraus rechnet die Engine die Belegung je Seite.
// Rest > 0 -> Warn-Chip (nicht exakt ladbar); nur Stange -> dezenter Hinweis.
export function PlateChips({
  total,
  barWeight,
  plates,
}: {
  total: number;
  barWeight: number;
  plates: number[];
}): React.ReactElement | null {
  const pb = plateBreakdown(total, barWeight, plates);

  if (pb.remainder > 0) {
    return (
      <div className="flex flex-wrap gap-1 pl-[28px]">
        <span className="rounded-pill bg-warning/12 px-2 py-0.5 font-mono text-[11px] text-warning-foreground">
          Rest {fmtNum(pb.remainder * 2)}
        </span>
      </div>
    );
  }

  if (!pb.plates.length) {
    return (
      <div className="pl-[28px] text-[11px] text-muted-foreground">nur Stange</div>
    );
  }

  const chips: string[] = [];
  pb.plates.forEach((pp) => {
    for (let i = 0; i < pp.count; i++) chips.push(fmtNum(pp.plate));
  });

  return (
    <div className="flex flex-wrap gap-1 pl-[28px]">
      {chips.map((c, i) => (
        <span
          key={i}
          className="rounded-pill bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
        >
          {c}
        </span>
      ))}
    </div>
  );
}
