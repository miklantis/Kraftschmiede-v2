import { cn } from "@/lib/utils";

// Generischer Einfach-Auswahl-Chip-Umschalter (genau einer aktiv). Optik aus
// V1 (.ub-metric): kleine Buttons, inaktiv dezent grau, aktiv markengruen
// gefuellt. Domaenenfrei; genutzt fuer den Uebungs-Metrik-Umschalter und
// spaeter die Koerper-Metriken. Bei nur einer Option zeigt der Aufrufer die
// Reihe i. d. R. gar nicht erst an.

export interface ChipOption<K extends string> {
  key: K;
  label: string;
}

export interface ChipSwitchProps<K extends string> {
  options: ReadonlyArray<ChipOption<K>>;
  value: K;
  onChange: (key: K) => void;
  className?: string;
  ariaLabel?: string;
}

export function ChipSwitch<K extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: ChipSwitchProps<K>): React.ReactElement {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-[7px]", className)}
    >
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.key)}
            className={cn(
              "rounded-[9px] px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors min-[960px]:px-3.5 min-[960px]:py-2",
              on
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
