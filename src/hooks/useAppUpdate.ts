import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot, applyUpdate } from "@/lib/pwaUpdate";

// Liefert das Update-Signal des Service Workers an die UI. Die aufrufende
// Komponente kennt die SW-Technik nicht (gleiche Kapselung wie die Hooks fuer
// Datenzugriffe). updateAvailable wird true, sobald eine neue Huelle wartet;
// applyUpdate uebernimmt sie.
export function useAppUpdate(): {
  updateAvailable: boolean;
  applyUpdate: () => void;
} {
  const updateAvailable = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  );
  return { updateAvailable, applyUpdate };
}
