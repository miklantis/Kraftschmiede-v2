import { cn } from "@/lib/utils";
import type { RestAdvice } from "@/engine";

// Empfehlungs-Banner oben auf der Koerper-Seite. Ampel aus restAdvice:
// gruen ok / amber caution+rest / neutral unknown. Titel + Gruende wie V1.
const TITLES: Record<RestAdvice["level"], string> = {
  ok: "Bereit fürs Training",
  caution: "Vorsicht – reduziert trainieren",
  rest: "Rest-Tag empfohlen",
  unknown: "Heute noch nicht erfasst",
};

export function RestBanner({
  advice,
  className,
}: {
  advice: RestAdvice;
  className?: string;
}): React.ReactElement {
  const sub = advice.reasons.length
    ? advice.reasons.join(" · ")
    : "Körperzustand grün.";

  const tone =
    advice.level === "ok"
      ? "border-primary/25 bg-primary/10"
      : advice.level === "unknown"
        ? "border-border bg-muted"
        : "border-deviation/35 bg-deviation/10";
  const dot =
    advice.level === "ok"
      ? "bg-primary"
      : advice.level === "unknown"
        ? "bg-muted-foreground"
        : "bg-deviation";
  const title =
    advice.level === "ok"
      ? "text-primary"
      : advice.level === "unknown"
        ? "text-muted-foreground"
        : "text-warning-foreground";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[16px] border p-[14px_16px] min-[960px]:p-[15px_18px]",
        tone,
        className,
      )}
    >
      <span className={cn("size-2.5 flex-none rounded-full", dot)} />
      <div className="flex-1">
        <div className={cn("text-[15px] font-semibold", title)}>
          {TITLES[advice.level]}
        </div>
        <div className="text-[13px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}
