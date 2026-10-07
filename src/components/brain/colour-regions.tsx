"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import { useExplodeState, useExplodeStore } from "@/engine/explode";
import { brainLooks } from "@/lib/brain-looks";

/** Where the choice is remembered. */
export const COLOUR_REGIONS_KEY = "anatomy-brain-colour-regions";

const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(COLOUR_REGIONS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Remembers the choice; a blocked or full storage still changes it for this visit. */
function write(on: boolean): void {
  try {
    localStorage.setItem(COLOUR_REGIONS_KEY, on ? "1" : "0");
  } catch {
    // Storage is blocked or full: the listeners below still carry this visit's choice.
  }
  memory = on;
  for (const l of listeners) l();
}

/** What this visit chose, for a storage that would not keep it; null until the visitor chooses. */
let memory: boolean | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * "Colour regions": the brain is drawn a wet pinkish grey, and a region leans toward its teaching colour
 * when hovered or selected. On, every region shows its colour at once. Off by default and remembered.
 * The colours are engine looks (see src/lib/brain-looks.ts), so the canvas eases them per frame.
 */
export function ColourRegions() {
  const store = useExplodeStore();
  const { hovered, selected } = useExplodeState(store);
  const id = useId();
  const on = useSyncExternalStore(subscribe, () => memory ?? read(), () => false);
  useEffect(() => {
    store.setLooks(brainLooks(on, hovered, selected));
  }, [store, on, hovered, selected]);
  // The whole card is the label, so a press anywhere on it toggles the checkbox, and the box itself is 24px or more.
  return (
    <label data-colour-regions className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <input type="checkbox" checked={on} aria-labelledby={`${id}-name`} aria-describedby={`${id}-hint`} onChange={(e) => write(e.currentTarget.checked)} className="mt-0.5 size-6 shrink-0 cursor-pointer accent-accent" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span id={`${id}-name`} className="text-sm font-medium text-ink-secondary">
          Colour regions
        </span>
        <span id={`${id}-hint`} className="text-xs text-ink-tertiary">
          Show each region in its teaching colour.
        </span>
      </span>
    </label>
  );
}
