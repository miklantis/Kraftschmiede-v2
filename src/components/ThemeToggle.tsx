import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/lib/theme";

// Schaltet die Darstellung der Reihe nach durch: hell -> dunkel -> system -> hell.
// Vorlaeufig auf der Startseite; die endgueltige Platzierung (Navigation/Einstellungen)
// folgt in spaeteren Phasen.
const NEXT: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const LABEL: Record<Theme, string> = {
  light: "Hell",
  dark: "Dunkel",
  system: "System",
};

export function ThemeToggle(): React.ReactElement {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Darstellung: ${LABEL[theme]}. Klicken zum Umschalten.`}
    >
      <Icon />
      {LABEL[theme]}
    </Button>
  );
}
