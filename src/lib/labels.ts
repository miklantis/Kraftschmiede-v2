import type { Focus } from "@/schemas/shared";

// Anzeigename des Periodisierungs-Fokus (Domaenensprache deutsch, 1:1 aus V1).
const FOCUS_LABELS: Record<Focus, string> = {
  reentry: "Wiedereinstieg",
  hypertrophy: "Hypertrophie",
  strength: "Maximalkraft",
  power: "Intensivierung",
  endurance: "Kraftausdauer",
  test: "Test/Peak",
  maintenance: "Erhaltung",
};

export function focusLabel(focus: Focus | string | null | undefined): string {
  if (!focus) return "";
  return FOCUS_LABELS[focus as Focus] ?? String(focus);
}

// Einheit einer Skill-Metrik fuer Ziel-Anzeigen ("3 × 8 Wdh.", "3 × 30 Sek.").
export function skillMetricUnit(metric: string | null | undefined): string {
  if (metric === "reps") return "Wdh.";
  if (metric === "duration") return "Sek.";
  return "";
}

// Anzeigename der Uebungsart (kind). 1:1 aus V1 (data.js kindLabel).
const KIND_LABELS: Record<string, string> = {
  main: "Hauptübung",
  accessory: "Assistenz",
  core: "Core",
  bodyweight: "Körpergewicht",
};
export function kindLabel(kind: string | null | undefined): string {
  if (!kind) return "–";
  return KIND_LABELS[kind] ?? kind;
}
