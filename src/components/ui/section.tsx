import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Abschnitt mit kleiner Eyebrow-Ueberschrift plus Inhalt. Auf jeder Seite
// gebraucht. Optik aus V1 (train-eyebrow): kleine, gesperrte Versal-Ueberschrift
// in muted, darunter der Inhalt.
export function Section({
  eyebrow,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <section className={cn("flex flex-col", className)}>
      {eyebrow != null && (
        <div className="mb-2.5 text-[13px] font-semibold tracking-[0.6px] text-muted-foreground uppercase min-[960px]:mb-3 min-[960px]:text-xs min-[960px]:tracking-[0.7px]">
          {eyebrow}
        </div>
      )}
      {children}
    </section>
  );
}
