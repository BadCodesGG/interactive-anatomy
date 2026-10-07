"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Sandwich } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExplodeState, useExplodeStore } from "@/engine/explode";
import { tour } from "@/lib/tour-store";

// The steps, captions and curve, and the panel that shows them, are fetched only when the tour starts.
const TourPanel = dynamic(() => import("./tour-panel"), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="min-h-40 border border-border bg-surface" />,
});

const running = () => tour.getState().active;

/**
 * The tour's way in: a card with a Start button, which becomes the tour panel while it runs. It
 * carries none of the tour's data. A `?tour=N` address starts the tour on step N once the 3D view is
 * ready, and the strict parse of N lives in the lazy chunk too, so a page without that parameter never loads it.
 */
export function TourEntry() {
  const store = useExplodeStore();
  const { ready, opening } = useExplodeState(store);
  const active = useSyncExternalStore(tour.subscribe, running, () => false);
  const start = useRef<HTMLButtonElement>(null);
  const was = useRef(false);

  useEffect(() => {
    if (!ready || opening || tour.getState().active) return;
    if (!new URLSearchParams(window.location.search).has("tour")) return;
    let live = true;
    void import("@/lib/sandwich-tour").then(({ parseTourParam }) => {
      const step = parseTourParam(window.location.search);
      if (live && step !== null && !tour.getState().active) tour.start(step);
    });
    return () => {
      live = false;
    };
  }, [ready, opening]);

  // Closing the tour hands the keyboard back to the button that opened it: the phone's shortcut under the Explode row when that
  // is what is on screen, else this card's Start button.
  useEffect(() => {
    if (was.current && !active) {
      const shortcut = document.querySelector<HTMLButtonElement>("[data-tour-shortcut]");
      (shortcut && shortcut.offsetParent !== null ? shortcut : start.current)?.focus();
    }
    was.current = active;
  }, [active]);

  useEffect(() => () => tour.stop(), []);

  if (active) return <TourPanel />;
  return (
    <section data-tour-entry aria-labelledby="tour-entry-title" className="border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-tertiary">Guided tour</p>
          <h2 id="tour-entry-title" className="font-display text-2xl font-semibold leading-tight text-ink">
            Follow a sandwich
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Follow one bite from the mouth to the colon. The camera stops at each organ on the way and says what happens there.
          </p>
        </div>
        <Button ref={start} variant="outline" data-tour-start disabled={!ready || opening} onClick={() => tour.start(0)} className="h-11 min-w-11 px-5">
          <Sandwich aria-hidden />
          Start the tour
        </Button>
      </div>
      {(!ready || opening) && <p className="mt-2 text-xs text-ink-tertiary">Available once the 3D view has loaded.</p>}
    </section>
  );
}

/**
 * A phone's way into the tour: the card with the Start button sits three screens down, so this compact
 * button sits under the Explode row and starts the same tour. Hidden from md up, where the card is beside the stage.
 * While the tour runs the sheet at the bottom of the screen takes over and this button steps aside.
 */
export function TourShortcut() {
  const store = useExplodeStore();
  const { ready, opening } = useExplodeState(store);
  const active = useSyncExternalStore(tour.subscribe, running, () => false);
  return (
    <Button variant="outline" size="sm" data-tour-shortcut disabled={!ready || opening} hidden={active} onClick={() => tour.start(0)} className="self-start md:hidden">
      <Sandwich aria-hidden />
      Follow a sandwich
    </Button>
  );
}
