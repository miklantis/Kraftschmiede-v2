import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

// Kopfkarte der Journey-Seite: kleine Eyebrow, grosser Name, Meta-Zeile
// (Vorlage + Startdatum) und der Bearbeiten-Knopf, der zum Vorlagen-Waehler
// fuehrt. Optik aus V1 (jr-active): weiche Karte, Akzent-getoenter Rahmenknopf.
export function ActiveJourneyCard({
  name,
  metaLine,
}: {
  name: string;
  metaLine: string;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-4 rounded-card bg-card px-5 py-[18px] shadow-card min-[960px]:px-6 min-[960px]:py-[22px]">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted-foreground min-[960px]:text-[12px]">
          Aktive Journey
        </div>
        <div className="mt-0.5 truncate text-[22px] font-bold text-foreground min-[960px]:text-[26px]">
          {name}
        </div>
        {metaLine !== "" && (
          <div className="mt-1 truncate text-[13px] text-muted-foreground min-[960px]:text-[14px]">
            {metaLine}
          </div>
        )}
      </div>
      <Link
        to="/journey/waehlen"
        aria-label="Journey bearbeiten"
        className="inline-flex flex-none items-center gap-2 rounded-control border border-primary/40 bg-card px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 min-[960px]:px-3.5"
      >
        <Pencil className="size-[15px]" />
        <span className="hidden min-[960px]:inline">Bearbeiten</span>
      </Link>
    </div>
  );
}
