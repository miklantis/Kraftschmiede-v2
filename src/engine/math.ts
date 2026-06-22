// Mathe-Helfer der Engine. Reine Funktionen ohne Seiteneffekte.

// Groesster gemeinsamer Teiler auf zwei Nachkommastellen genau (Scheiben sind
// meist in 1,25er-Schritten, daher ueber Ganzzahlen in Hundertsteln gerechnet).
export function gcd(a: number, b: number): number {
  a = Math.round(a * 100);
  b = Math.round(b * 100);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a / 100;
}

// Kleinster ladbarer Gesamtschritt einer Seite = ggT der verfuegbaren Scheiben.
export function plateGrid(plates: number[]): number {
  if (!plates || !plates.length) return 1.25;
  let g = plates[0]!;
  for (let i = 1; i < plates.length; i++) g = gcd(g, plates[i]!);
  return g;
}

// Auf zwei Nachkommastellen runden.
export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

// Arithmetisches Mittel; leeres Array ergibt 0.
export function avg(a: number[]): number {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}
