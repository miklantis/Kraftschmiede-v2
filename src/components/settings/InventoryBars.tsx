import { X } from "lucide-react";
import { SettingsGroup, SettingRow } from "@/components/ui/setting-list";
import { useInventoryActions } from "@/hooks/useInventoryActions";
import type { BarItem } from "@/hooks/useInventory";
import { fmtKg } from "@/lib/format";

// Inventar - Stangen. Liste der Langhantel-Typen (Name links, Gewicht + Loeschen
// rechts); darunter Preset-Knoepfe zum schnellen Hinzufuegen (wie V1). Neue
// Stangen werden ohne key angelegt. unit kommt aus den Einstellungen.
const BAR_PRESETS: { name: string; weight: number }[] = [
  { name: "Standard", weight: 20 },
  { name: "Kurz / Leicht", weight: 15 },
  { name: "Olympia", weight: 20 },
  { name: "SZ-Curl", weight: 8 },
  { name: "Frauen", weight: 15 },
];

export function InventoryBars({
  bars,
  unit,
}: {
  bars: BarItem[];
  unit: string;
}): React.ReactElement {
  const { addBar, deleteBar } = useInventoryActions();

  return (
    <div className="flex flex-col gap-3">
      {bars.length > 0 && (
        <SettingsGroup>
          {bars.map((b) => (
            <SettingRow key={b.id} label={b.name}>
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {fmtKg(b.weight)} {unit}
                </span>
                <button
                  type="button"
                  aria-label={`${b.name} entfernen`}
                  onClick={() => void deleteBar(b.id)}
                  className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </span>
            </SettingRow>
          ))}
        </SettingsGroup>
      )}

      <div className="flex flex-wrap gap-2">
        {BAR_PRESETS.map((p) => (
          <button
            key={p.name + p.weight}
            type="button"
            onClick={() => void addBar(p.name, p.weight)}
            className="inline-flex items-center rounded-pill border border-dashed border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            + {p.name} · {fmtKg(p.weight)}
          </button>
        ))}
      </div>
    </div>
  );
}
