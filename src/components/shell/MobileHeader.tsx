import { AccountButton } from "./AccountButton";

// Schlanker Kopf fuer Mobile (unter 960px). Rechts oben das Konto-Symbol; die
// Hauptnavigation liegt unten in der Bottom-Nav. Die Darstellung (hell/dunkel)
// wird vorerst nur in den Einstellungen umgeschaltet.
export function MobileHeader(): React.ReactElement {
  return (
    <header className="flex items-center justify-end px-4 pt-3 pb-1">
      <AccountButton variant="compact" />
    </header>
  );
}
