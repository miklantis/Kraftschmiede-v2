import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useLiveSession } from "@/hooks/useLiveSession";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePlates } from "@/hooks/useInventory";
import { useSettings } from "@/hooks/useSettings";
import { useLiveClock } from "./useLiveClock";
import { useGripDrag } from "./useGripDrag";
import { LiveMiniBar } from "./LiveMiniBar";
import { GeneralWarmupCard } from "./GeneralWarmupCard";
import { ExerciseLiveCard } from "./ExerciseLiveCard";
import type { LiveSession } from "@/lib/liveSession";

// Globales Live-Panel der gefuehrten Session.
//  - Desktop (>= 960px): Vollbild-Overlay; eingeklappt eine freischwebende Pille.
//  - Mobile (< 960px): EIN morphendes Bodenblatt - eingeklappt schiebt sich
//    dasselbe Element zum dunklen Mini-Streifen ueber der Navigation; Ziehen am
//    Griff/Kopf klappt auf und zu.
// Lieferung 2: der Inhalt zeigt die vom Coach aufgebaute Einheit (allgemeines
// Aufwaermen + Uebungskarten mit Aufwaerm-/Arbeitssaetzen und Scheiben). Abhaken,
// Werte tippen und Timer folgen in Lieferung 3.

function PanelContent({
  session,
  plates,
  unit,
}: {
  session: LiveSession;
  plates: number[];
  unit: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <GeneralWarmupCard sets={session.generalWarmup.sets} />
      {session.entries.map((entry, i) => (
        <ExerciseLiveCard
          key={entry.exerciseId + i}
          entry={entry}
          plates={plates}
          unit={unit}
        />
      ))}
    </div>
  );
}

function PanelHead({
  title,
  clock,
  onCollapse,
  onEnd,
  grip,
}: {
  title: string;
  clock: string;
  onCollapse: () => void;
  onEnd: () => void;
  grip: boolean;
}): React.ReactElement {
  return (
    <div className="kl-ov-head" {...(grip ? { "data-live-grip": "" } : {})}>
      <button
        type="button"
        aria-label="Panel einklappen"
        className="kl-ov-collapse"
        onClick={onCollapse}
      >
        <ChevronDown className="size-[18px]" strokeWidth={2.2} />
      </button>
      <div className="kl-ov-info">
        <div className="kl-ov-info-title">{title}</div>
      </div>
      <div className="kl-ov-clockchip">
        <span className="kl-ov-clockdot" />
        <span className="kl-ov-clock">{clock}</span>
      </div>
      <button type="button" className="kl-ov-end" onClick={onEnd}>
        Beenden
      </button>
    </div>
  );
}

export function LivePanel(): React.ReactElement | null {
  const live = useLiveSession();
  const isDesktop = useIsDesktop();
  const platesQ = usePlates();
  const settingsQ = useSettings();
  const ovRef = useRef<HTMLDivElement>(null);
  const startedAt = live.session?.startedAt ?? null;
  const clock = useLiveClock(startedAt);

  // Ziehgeste nur am Handy; bei Desktop deaktiviert.
  useGripDrag(ovRef, live.collapsed, live.setCollapsed, !isDesktop && !!live.session);

  if (!live.session) return null;
  const s = live.session;
  const plates = (platesQ.data ?? []).map((p) => p.weight);
  const unit = settingsQ.data?.unit ?? "kg";
  const title = "Workout " + s.title;
  const subtitle =
    s.entries.length > 0 ? s.entries.length + " Übungen" : "läuft";

  // --- Desktop ---
  if (isDesktop) {
    if (live.collapsed) {
      return (
        <LiveMiniBar
          title={title + " läuft"}
          subtitle={subtitle}
          clock={clock}
          onExpand={live.expand}
        />
      );
    }
    return (
      <div className="kl-ov kl-ov--desk">
        <PanelHead
          title={title}
          clock={clock}
          onCollapse={live.collapse}
          onEnd={live.requestEnd}
          grip={false}
        />
        <div className="kl-ov-scroll">
          <div className="kl-ov-inner">
            <PanelContent session={s} plates={plates} unit={unit} />
          </div>
        </div>
      </div>
    );
  }

  // --- Mobile: ein morphendes Element ---
  const cls =
    "kl-ov kl-ov--mob" +
    (live.collapsed ? " is-collapsed" : "") +
    (live.entering ? " is-entering" : "");
  return (
    <div
      ref={ovRef}
      className={cls}
      onAnimationEnd={live.clearEntering}
    >
      <div className="kl-ov-grip" data-live-grip="">
        <div className="kl-ov-grip-bar" />
      </div>
      <PanelHead
        title={title}
        clock={clock}
        onCollapse={live.collapse}
        onEnd={live.requestEnd}
        grip
      />
      <div className="kl-ov-scroll">
        <PanelContent session={s} plates={plates} unit={unit} />
      </div>
    </div>
  );
}
