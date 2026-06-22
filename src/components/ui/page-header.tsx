import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Seitenkopf oben auf jeder Feature-Seite: kleine Datumszeile plus grosser Titel.
// Optik 1:1 aus V1 (ks-screen-head): am Handy grosser Titel (34px) mit 26px Abstand
// darunter, am Desktop ruhiger (28px). Der untere Abstand gehoert zum Kopf, damit
// jede Seite denselben Rhythmus erbt.
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
    <header className={cn("mb-[26px] min-[960px]:mb-6 min-[960px]:pt-1.5", className)}>
      {date != null && (
        <div className="text-sm font-medium text-muted-foreground min-[960px]:text-[13px]">
          {date}
        </div>
      )}
      <h1 className="mt-1 text-[34px] font-bold tracking-[-0.5px] text-foreground min-[960px]:mt-px min-[960px]:text-[28px] min-[960px]:tracking-[-0.4px]">
        {title}
      </h1>
    </header>
  );
}
