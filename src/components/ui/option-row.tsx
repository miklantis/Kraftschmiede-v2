import { cn } from "@/lib/utils";

// Generische Auswahl-Reihe: zwei oder mehr gleich breite Knoepfe, genau einer
// aktiv. Optik der Yoga-Tageswahl – aktiv im Akzent gefuellt, inaktiv Karte mit
// Rahmen, der beim Ueberfahren den Akzent annimmt. Domaenenfrei; genutzt fuer
// die Tageswahl im Yoga-Dialog und die Zielart im Meilenstein-Dialog.
//
// Abgrenzung: SegmentedControl ist der graue Segment-Umschalter fuer Ansichten,
// ChipSwitch die kompakte Chip-Reihe. OptionRow ist die breite Variante fuer
// Formularfelder, deren Optionen die volle Zeile fuellen sollen.

export type OptionRowAccent = "primary" | "yoga";

export interface OptionRowItem<T extends string> {
  value: T;
  label: string;
}

const ACCENT: Record<OptionRowAccent, { on: string; off: string }> = {
  primary: {
    on: "border-primary bg-primary text-white",
    off: "border-border bg-card text-foreground hover:border-primary",
  },
  yoga: {
    on: "border-yoga bg-yoga text-white",
    off: "border-border bg-card text-foreground hover:border-yoga",
  },
};

export function OptionRow<T extends string>({
  options,
  value,
  onChange,
  accent = "primary",
  disabled = false,
  ariaLabel,
  className,
}: {
  options: ReadonlyArray<OptionRowItem<T>>;
  value: T;
  onChange: (next: T) => void;
  accent?: OptionRowAccent;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}): React.ReactElement {
  const farbe = ACCENT[accent];
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex gap-2", className)}
    >
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-control border p-[11px] text-[14px] font-semibold transition-colors disabled:opacity-60",
              on ? farbe.on : farbe.off,
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
