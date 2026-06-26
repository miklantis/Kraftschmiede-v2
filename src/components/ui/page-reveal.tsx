import { Children, cloneElement, isValidElement } from "react";
import type { CSSProperties, ReactNode } from "react";

interface PageRevealProps {
  /** Die Seiteninhalte. Die direkten Kinder werden gestaffelt eingefadet. */
  children: ReactNode;
  /** Zusaetzliche Klassen fuer den Wrapper (z. B. Abstaende/Layout). */
  className?: string;
}

/**
 * PageReveal – dezent gestaffeltes Einfaden beim Seitenwechsel.
 *
 * Umschliesst den Seiteninhalt; jedes direkte Kind kommt leicht von unten
 * herein, nacheinander. Greift nur beim Mount (Seitenwechsel), nicht bei
 * Zustandsaenderungen innerhalb der Seite. Respektiert „Bewegung reduzieren".
 *
 * Die konkreten Werte (Versatz, Dauer, Staffelung) stehen als CSS-Variablen
 * in `src/index.css` (`--ks-reveal-*`) und lassen sich dort zentral justieren.
 */
export function PageReveal({
  children,
  className,
}: PageRevealProps): React.ReactElement {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <div className={className ? "ks-reveal " + className : "ks-reveal"}>
      {items.map((child, index) => {
        const el = child as React.ReactElement<{ style?: CSSProperties }>;
        return cloneElement(el, {
          style: {
            ...(el.props.style ?? {}),
            ["--ks-reveal-i" as string]: index,
          } as CSSProperties,
        });
      })}
    </div>
  );
}
