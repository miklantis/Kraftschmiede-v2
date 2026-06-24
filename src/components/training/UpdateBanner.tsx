import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppUpdate } from "@/hooks/useAppUpdate";

// Dezenter Hinweis-Streifen oben auf der Trainingsseite: erscheint nur, wenn
// eine neue Huelle bereitliegt. "Aktualisieren" uebernimmt sie (neuer Service
// Worker aktiv + einmaliges Neuladen). Optik 1:1 zum Klar-Look der JourneyStrip:
// weiche Karte, akzent-getoentes Symbolfeld.
// In Lieferung 3 wird der Streifen antippbar und oeffnet das "Was ist neu"-Popup;
// der "Aktualisieren"-Knopf wandert dann dorthin.
export function UpdateBanner(): React.ReactElement | null {
  const { updateAvailable, applyUpdate } = useAppUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="flex items-center gap-3 rounded-card bg-card px-4 py-3 text-foreground shadow-card min-[960px]:gap-[14px] min-[960px]:rounded-[18px] min-[960px]:px-5 min-[960px]:py-4">
      <div className="flex size-[38px] flex-none items-center justify-center rounded-control bg-primary/12 text-primary min-[960px]:size-[42px] min-[960px]:rounded-xl">
        <RefreshCw className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-foreground min-[960px]:text-[16px]">
          Neue Version verfügbar
        </div>
        <div className="truncate text-[13px] text-muted-foreground">
          Tippe auf Aktualisieren, um sie zu übernehmen.
        </div>
      </div>
      <Button size="sm" onClick={applyUpdate}>
        Aktualisieren
      </Button>
    </div>
  );
}
