import { SettingsGroup, SettingRow } from "@/components/ui/setting-list";
import { Switch } from "@/components/ui/switch";
import { useInventoryActions } from "@/hooks/useInventoryActions";
import type { EquipmentItem } from "@/hooks/useInventory";

// Inventar - Geraete (Skills). Schalter je Equipment (Klimmzugstange, Baender,
// Ringe, Parallettes ...): active schaltet das Tor fuer Skill-Phasen frei, die
// das Geraet voraussetzen. Wie V1; nur die Anzeige, die Tor-Logik liegt im
// Skill-Advice der Engine.
export function InventoryEquipment({
  equipment,
}: {
  equipment: EquipmentItem[];
}): React.ReactElement {
  const { toggleEquipment } = useInventoryActions();

  return (
    <SettingsGroup>
      {equipment.map((e) => (
        <SettingRow key={e.key} label={e.label}>
          <Switch
            label={e.label}
            checked={e.active}
            onChange={(on) => void toggleEquipment(e.key, on)}
          />
        </SettingRow>
      ))}
    </SettingsGroup>
  );
}
