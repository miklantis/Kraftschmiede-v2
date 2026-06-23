import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Generisches Stepper-Primitive: zwei eckige ±-Knoepfe links und rechts, in der
// Mitte ein beliebiger Wert (children). Domaenenfrei – kennt weder Einheit noch
// Grenzen; der Aufrufer reicht onDecrement/onIncrement und die Wert-Darstellung
// herein und sperrt die Knoepfe bei Bedarf. Wiederverwendet vom "Uebung
// anpassen"-Popup und spaeter von der Koerper-Seite und der Live-Session.
//
// Die Knoepfe haben einen einheitlichen Look (muted, abgerundet); der aeussere
// Container (Hintergrund/Polsterung) bleibt Sache des Aufrufers ueber className,
// weil er je Dialog unterschiedlich aussieht.
export function Stepper({
  onDecrement,
  onIncrement,
  children,
  size = "md",
  decLabel = "Weniger",
  incLabel = "Mehr",
  disabled = false,
  className,
}: {
  onDecrement: () => void;
  onIncrement: () => void;
  children: ReactNode;
  size?: "md" | "sm";
  decLabel?: string;
  incLabel?: string;
  disabled?: boolean;
  className?: string;
}): React.ReactElement {
  const btn = cn(
    "flex flex-none items-center justify-center rounded-control bg-muted font-semibold text-foreground",
    "transition-[filter] hover:brightness-95 disabled:opacity-40 disabled:hover:brightness-100",
    size === "md" ? "size-9 text-[19px]" : "size-8 text-[17px]",
  );
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <button
        type="button"
        aria-label={decLabel}
        onClick={onDecrement}
        disabled={disabled}
        className={btn}
      >
        −
      </button>
      {children}
      <button
        type="button"
        aria-label={incLabel}
        onClick={onIncrement}
        disabled={disabled}
        className={btn}
      >
        +
      </button>
    </div>
  );
}
