import type { ReactElement } from "react";
import { Download, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExport } from "@/hooks/useExport";

// Voll-Export des Bestands als ein lesbares JSON. Zwei Wege wie V1: als Datei
// (kraftschmiede_DATUM.json) oder in die Zwischenablage. Die Aufbau-/DOM-Logik
// steckt in useExport bzw. den lib-Bausteinen; hier nur Knoepfe + Status.
export function DataExport(): ReactElement {
  const { exportToFile, exportToClipboard, status, isPending, error } =
    useExport();

  return (
    <section className="w-full max-w-md space-y-3 text-left">
      <h2 className="text-sm font-semibold">Export</h2>
      <p className="text-muted-foreground text-xs">
        Sichert deinen kompletten Bestand (Einheiten, Übungen, Vorlagen,
        Journeys, Skill-Fortschritt, Messungen, Einstellungen, Inventar) als ein
        JSON.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void exportToFile()}
          disabled={isPending}
        >
          <Download />
          Als Datei
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void exportToClipboard()}
          disabled={isPending}
        >
          <ClipboardCopy />
          In die Zwischenablage
        </Button>
      </div>

      {status === "file" && !isPending ? (
        <p className="text-muted-foreground text-xs">Datei heruntergeladen.</p>
      ) : null}
      {status === "clipboard" && !isPending ? (
        <p className="text-muted-foreground text-xs">
          In die Zwischenablage kopiert.
        </p>
      ) : null}
      {error !== null ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
