import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Darstellung: "system" folgt der Geraeteeinstellung, sonst fest hell/dunkel.
export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  // Tatsaechlich aktive Darstellung nach Aufloesung von "system".
  resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "ks-theme";

function getSystemPreference(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    readStoredTheme() === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    const apply = (): void => {
      const next = theme === "system" ? getSystemPreference() : theme;
      setResolved(next);
      document.documentElement.classList.toggle("dark", next === "dark");
    };
    apply();

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
    return undefined;
  }, [theme]);

  const setTheme = useCallback((next: Theme): void => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme muss innerhalb von ThemeProvider verwendet werden.");
  }
  return context;
}
