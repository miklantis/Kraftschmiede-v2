import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface PageRevealProps {
  /** Die Seiteninhalte. Die Bloecke werden gestaffelt eingefadet. */
  children: ReactNode;
  /** Zusaetzliche Klassen fuer den Wrapper (z. B. Abstaende/Layout). */
  className?: string;
}

/**
 * PageReveal – dezent gestaffeltes Einfaden beim Seitenwechsel.
 *
 * Umschliesst den Seiteninhalt. Die Bloecke kommen nacheinander leicht von
 * unten herein. Die Reihenfolge wird nach dem Mount im DOM gesetzt (CSS-Variable
 * `--ks-reveal-i` je Element), damit die Staffelung unabhaengig von der
 * Verschachtelung jeder Seite zuverlaessig greift.
 *
 * Layout-Regeln pro direktem Kind des Wrappers:
 * - `data-reveal-group` (an einem Element irgendwo im Kind): zweispaltiges
 *   Layout. Jede so markierte Spalte staffelt ihre eigenen Bloecke; alle
 *   Spalten starten parallel und laufen je von oben nach unten.
 * - `data-reveal-flatten`: der Container wird aufgeloest, seine Kinder werden
 *   einzeln nacheinander gestaffelt (fuer Masonry-/columns-Layouts).
 * - sonst: das Kind selbst ist ein Block und wird als Ganzes gestaffelt.
 *
 * Greift nur beim Mount (Seitenwechsel). Respektiert „Bewegung reduzieren".
 * Werte (Versatz, Dauer, Staffelung) stehen als CSS-Variablen in
 * `src/index.css` (`--ks-reveal-*`) und lassen sich dort zentral justieren.
 */
export function PageReveal({
  children,
  className,
}: PageRevealProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (root == null) return;

    let index = 0;
    const mark = (el: HTMLElement, i: number): void => {
      el.style.setProperty("--ks-reveal-i", String(i));
      el.classList.add("ks-reveal-item");
    };

    for (const child of Array.from(root.children) as HTMLElement[]) {
      const groups = child.querySelectorAll<HTMLElement>("[data-reveal-group]");

      if (groups.length > 0) {
        // Zweispaltig: jede Spalte ab gleichem Start, parallel von oben nach unten.
        const start = index;
        let maxLen = 0;
        for (const group of Array.from(groups)) {
          let i = start;
          for (const block of Array.from(group.children) as HTMLElement[]) {
            mark(block, i);
            i += 1;
          }
          maxLen = Math.max(maxLen, i - start);
        }
        index = start + maxLen;
      } else if (child.hasAttribute("data-reveal-flatten")) {
        // Container aufloesen: Kinder einzeln nacheinander staffeln.
        for (const block of Array.from(child.children) as HTMLElement[]) {
          mark(block, index);
          index += 1;
        }
      } else {
        mark(child, index);
        index += 1;
      }
    }
  }, []);

  return (
    <div
      ref={ref}
      className={className ? "ks-reveal " + className : "ks-reveal"}
    >
      {children}
    </div>
  );
}
