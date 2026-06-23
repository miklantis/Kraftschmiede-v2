import { useState } from "react";
import { useUserId } from "./useUserId";
import {
  buildExport,
  serializeExport,
  exportFilename,
} from "@/lib/exportData";
import { fetchAllData } from "@/lib/exportSource";
import { downloadTextFile } from "@/lib/download";

// Voll-Export (Sicherung): holt den kompletten Bestand (gemeinsame Quelle
// fetchAllData) und baut daraus das lesbare JSON, ausgegeben als Datei. Der
// Aufbau liegt im reinen exportData-Modul, der Datei-Download im download-
// Baustein; der Hook orchestriert nur.

type Status = "idle" | "file" | "error";

export function useExport(): {
  exportToFile: () => Promise<void>;
  status: Status;
  isPending: boolean;
  error: string | null;
} {
  const userId = useUserId();
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportToFile(): Promise<void> {
    if (userId === null) {
      setError("Nicht angemeldet.");
      setStatus("error");
      return;
    }
    setIsPending(true);
    setError(null);
    try {
      const raw = await fetchAllData();
      const text = serializeExport(buildExport(raw));
      downloadTextFile(exportFilename(), text);
      setStatus("file");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    } finally {
      setIsPending(false);
    }
  }

  return { exportToFile, status, isPending, error };
}
