import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Ruhiger Erklaer-/Lauftext direkt auf dem Hintergrund - bewusst OHNE Karte,
// Rahmen oder eigenen Hintergrund (das bleibt Card/Section vorbehalten). Optik
// aus der Uebungs-Beschreibung uebernommen: gedaempfte Farbe, angenehme
// Zeilenhoehe. Auf Seiten gebraucht, die einen einleitenden Absatz brauchen
// (z. B. "Was ist eine Skill?"). Standardmaessig mit Abstand nach unten zum
// folgenden Inhalt; ueber `className` ueberschreibbar.
export function Prose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <p
      className={cn(
        "mb-5 text-[15px] leading-[1.5] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
