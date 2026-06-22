import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Seitenkopf oben auf jeder Feature-Seite: kleine Datumszeile plus grosser Titel.
// Optik 1:1 aus V1 (ks-screen-head, mobile-first): Titel am Handy 28px, am Desktop
// 34px; Datum 13/14px. Der untere Abstand gehoert zum Kopf (Handy 16, Desktop 26px),
// damit jede Seite denselben Rhythmus erbt.
export function PageHeader({
  title,
  date,
  className,
}: {
  title: ReactNode;
  date?: ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <header
      className={cn("mb-4 pt-1.5 min-[960px]:mb-[26px] min-[960px]:pt-0", className)}
    >
      {date != null && (
        <div className="text-[13px] font-medium text-muted-foreground min-[960px]:text-[14px]">
          {date}
        </div>
      )}
      <h1 className="mt-px text-[28px] font-bold tracking-[-0.4px] text-foreground min-[960px]:mt-1 min-[960px]:text-[34px] min-[960px]:tracking-[-0.5px]">
        {title}
      </h1>
    </header>
  );
}
