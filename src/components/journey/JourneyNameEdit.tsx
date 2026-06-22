import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

// Editierbares Namensfeld der aktiven Journey (oben im Waehler). Aenderung wird
// beim Verlassen oder mit Enter uebernommen, leer oder unveraendert wird
// verworfen; Escape setzt zurueck. Optik aus V1 (jr-edit-name).
export function JourneyNameEdit({
  name,
  busy,
  onCommit,
}: {
  name: string;
  busy: boolean;
  onCommit: (next: string) => void;
}): React.ReactElement {
  const [value, setValue] = useState(name);
  const ref = useRef<HTMLInputElement>(null);

  // Aenderungen von aussen (nach erfolgreicher Umbenennung) uebernehmen.
  useEffect(() => {
    setValue(name);
  }, [name]);

  const commit = (): void => {
    const next = value.trim();
    if (next === "" || next === name) {
      setValue(name);
      return;
    }
    onCommit(next);
  };

  return (
    <div className="mb-5">
      <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">
        Name dieser Journey · zum Ändern tippen
      </div>
      <div className="flex items-center gap-2.5">
        <input
          ref={ref}
          value={value}
          disabled={busy}
          spellCheck={false}
          aria-label="Name dieser Journey"
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              ref.current?.blur();
            } else if (e.key === "Escape") {
              setValue(name);
              ref.current?.blur();
            }
          }}
          className="min-w-0 flex-1 rounded-control border border-border bg-input px-3 py-2 text-[18px] font-semibold text-foreground outline-none focus:border-ring disabled:opacity-60 min-[960px]:text-[20px]"
        />
        <Pencil className="size-[15px] flex-none text-primary" aria-hidden />
      </div>
    </div>
  );
}
