"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAge } from "@/components/age/age-context";
import { Button } from "@/components/ui/button";
import { useExplodeState, useExplodeStore } from "@/engine/explode";
import { DEFAULT_AGE_STAGE } from "@/lib/age-looks";
import { STEP_COUNT, STEPS, writeTourParam } from "@/lib/sandwich-tour";
import { tour } from "@/lib/tour-store";

/** How far the skeleton fades while the tour runs (the X-ray slider, 0 to 1). */
const TOUR_XRAY = 0.92;

const LABEL = "text-xs font-semibold uppercase tracking-[0.08em] text-ink-tertiary";

/**
 * The running tour: which step, its caption, Previous and Next. Loaded only when the tour starts.
 * Each step selects its organ (the stage frames it and the part panel shows it), keeps the model
 * assembled, and mirrors the step in the address as `?tour=N`. Arrow keys, Home, End and Escape work
 * while focus is in the panel; the caption is a polite live region, so a screen reader hears each step.
 * On a phone the panel is a sheet at the bottom and the part sheet stands aside (globals.css).
 */
export default function TourPanel() {
  const store = useExplodeStore();
  const { step } = useSyncExternalStore(tour.subscribe, tour.getState, tour.getState);
  const { target } = useExplodeState(store);
  const { stage, setStage } = useAge();
  const heading = useRef<HTMLHeadingElement>(null);
  const sheet = useRef<HTMLElement>(null);
  const [more, setMore] = useState(false);
  const index = Math.min(step, STEP_COUNT - 1);
  const current = STEPS[index];
  const last = index === STEP_COUNT - 1;

  // The curve runs through the adult body.
  useEffect(() => setStage(DEFAULT_AGE_STAGE), [setStage]);

  useEffect(() => {
    store.set({ selected: current.part, isolated: true, target: 0 });
    const { pathname, search, hash } = window.location;
    const next = writeTourParam(search, index);
    if (next !== search) window.history.replaceState(window.history.state, "", `${pathname}${next}${hash}`);
  }, [store, current.part, index]);

  useEffect(() => {
    document.documentElement.dataset.tourActive = "";
    heading.current?.focus({ preventScroll: true });
    // The Start button may sit well below the stage: put the stage at the top, so on a desktop it shares the screen with this
    // panel (the side column's first card) and on a phone it stands above the sheet that opens over the bottom.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelector("[data-plate]")?.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
    // The skeleton fades so the organs, and the bolus inside them, show; the visitor's own X-ray setting comes back at the end.
    const xray = store.getState().xray;
    store.setXray(TOUR_XRAY);
    return () => {
      delete document.documentElement.dataset.tourActive;
      store.setXray(xray);
      store.select(null);
      // The last step's close-up is no place to leave the camera: it goes back to the normal view (instantly under reduced motion).
      store.resetView();
      const { pathname, search, hash } = window.location;
      window.history.replaceState(window.history.state, "", `${pathname}${writeTourParam(search, null)}${hash}`);
    };
  }, [store]);

  // In a short landscape window the sheet scrolls inside its cap: say so while there is more under the fold.
  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const measure = () => setMore(el.scrollHeight - el.clientHeight - el.scrollTop > 2);
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      resize.disconnect();
    };
  }, [index, stage, target]);

  const go = (to: number) => tour.goto(Math.min(Math.max(to, 0), STEP_COUNT - 1));
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const moves: Record<string, () => void> = {
      ArrowRight: () => go(index + 1),
      ArrowDown: () => go(index + 1),
      ArrowLeft: () => go(index - 1),
      ArrowUp: () => go(index - 1),
      Home: () => go(0),
      End: () => go(STEP_COUNT - 1),
      Escape: () => tour.stop(),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    move();
  };

  const note =
    target > 0.02
      ? "The bolus is hidden while the model is exploded. Press Assemble to follow it again."
      : stage !== DEFAULT_AGE_STAGE
        ? "The route follows the adult body. Set Age to Adult to see the bolus sit inside the organs."
        : null;

  return (
    <section
      ref={sheet}
      data-tour-panel
      data-tour-step={index + 1}
      aria-label="Follow a sandwich"
      onKeyDown={onKeyDown}
      className="border border-border bg-surface p-4 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50 max-md:border-x-0 max-md:border-b-0 max-md:shadow-2xl short:md:max-h-[calc(100svh-2rem)] short:max-md:max-h-[45svh] short:overflow-y-auto short:py-2 short:max-md:flex short:max-md:flex-wrap short:max-md:items-center short:max-md:gap-x-3"
    >
      <div className="flex items-start justify-between gap-3 short:max-md:contents">
        <div className="min-w-0 short:max-md:order-1 short:max-md:flex-1">
          <p className={LABEL}>
            <span className="md:hidden">Follow a sandwich · </span>
            <span data-tour-count>Step {index + 1} of {STEP_COUNT}</span>
          </p>
          <h2 ref={heading} tabIndex={-1} data-tour-title className="font-display text-2xl font-semibold leading-tight text-ink outline-none short:text-xl">
            {current.title}
          </h2>
        </div>
        <Button variant="ghost" size="icon" aria-label="End the tour" data-tour-stop onClick={() => tour.stop()} className="size-11 shrink-0 short:max-md:order-3">
          <X />
        </Button>
      </div>
      <ol aria-hidden="true" className="mt-2 flex gap-1 short:mt-1 short:max-md:order-4 short:max-md:basis-full">
        {STEPS.map((s, i) => (
          <li key={s.id} className={`h-0.5 flex-1 ${i <= index ? "bg-accent" : "bg-border"}`} />
        ))}
      </ol>
      <p data-tour-caption aria-live="polite" aria-atomic="true" className="mt-3 short:mt-2 text-[15px] leading-snug text-ink max-md:max-h-[26vh] max-md:overflow-y-auto short:max-h-none short:overflow-visible short:max-md:order-5 short:max-md:basis-full">
        {current.caption}
      </p>
      {note && (
        <p data-tour-note className="mt-2 text-xs text-ink-tertiary short:max-md:order-6 short:max-md:basis-full">
          {note}
        </p>
      )}
      {/* In a short landscape window on a phone the buttons share the title's row, so the caption has the sheet (it covers the stage's foot and is capped at 45svh); in the side column, beside the stage, the sheet may use the window's height. */}
      <div className="mt-3 flex items-center justify-between gap-3 short:max-md:order-2 short:max-md:mt-0 short:max-md:gap-2">
        {/* aria-disabled, not disabled: pressing Previous on step 2 leaves it inert on step 1 with the keyboard focus still on it. */}
        <Button variant="outline" data-tour-prev aria-disabled={index === 0} onClick={() => go(index - 1)} className="h-11 min-w-11 px-4 aria-disabled:pointer-events-none aria-disabled:opacity-50">
          <ChevronLeft aria-hidden />
          Previous
        </Button>
        <Button data-tour-next onClick={() => (last ? tour.stop() : go(index + 1))} className="h-11 min-w-11 px-5">
          {last ? "Finish" : "Next"}
          {!last && <ChevronRight aria-hidden />}
        </Button>
      </div>
      <p className="mt-3 text-xs text-ink-tertiary short:mt-1 short:max-md:order-7 short:max-md:basis-full">The skeleton is faded and the heart, lungs and airway are put aside so the digestive tract shows. The bolus follows a simplified path; the real tube is longer and more coiled.</p>
      {/* In a short landscape window the sheet scrolls inside its cap: while there is more under the fold, a fade and "More" sit on its bottom edge. */}
      <div aria-hidden="true" className="sticky bottom-0 z-20 hidden h-0 short:block short:max-md:order-8 short:max-md:basis-full">
        {more && (
          <span data-tour-more className="pointer-events-none absolute -inset-x-4 bottom-0 flex h-7 items-end justify-center bg-gradient-to-t from-surface to-transparent pb-0.5 text-xs font-semibold text-ink-secondary">
            <ChevronDown className="size-4" />
            More
          </span>
        )}
      </div>
    </section>
  );
}
