// Duenner, DOM-naher Baustein (wie liveAudio/wakeLock): Textdatei herunterladen
// bzw. Text in die Zwischenablage kopieren. Bewusst ohne React/State, robuste
// Fallbacks. Wird vom Export-Hook genutzt; die reine Aufbau-Logik bleibt davon
// getrennt.

// Loest einen Datei-Download fuer einen Textinhalt aus (Blob + temporaerer Link).
export function downloadTextFile(
  filename: string,
  text: string,
  mime = "application/json",
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}

// Kopiert Text in die Zwischenablage. Nutzt die Clipboard-API, faellt sonst auf
// das alte execCommand-Verfahren zurueck. Gibt zurueck, ob es geklappt hat.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText !== undefined) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // weiter mit dem Fallback
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
