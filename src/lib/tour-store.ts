/**
 * Whether the sandwich tour is running, and which step it is on. A small store outside React: the
 * tour panel (the page's React tree) and the bolus (inside the canvas, a different React tree) both
 * read it. It knows nothing of the steps, so the stage chunk that watches it carries none of the
 * tour's text or curve data; callers keep the step within range.
 */

export interface TourState {
  active: boolean;
  /** Zero-based step index; meaningful while `active`. */
  step: number;
}

export interface TourStore {
  getState(): TourState;
  subscribe(fn: () => void): () => void;
  /** Starts the tour on a step (the first by default). */
  start(step?: number): void;
  /** Moves to another step; does nothing while the tour is not running. */
  goto(step: number): void;
  stop(): void;
}

const IDLE: TourState = { active: false, step: 0 };
const whole = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

export function createTourStore(): TourStore {
  let state = IDLE;
  const listeners = new Set<() => void>();
  const set = (next: TourState) => {
    if (next.active === state.active && next.step === state.step) return;
    state = next;
    listeners.forEach((fn) => fn());
  };
  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    start: (step = 0) => set({ active: true, step: whole(step) }),
    goto(step) {
      if (state.active) set({ active: true, step: whole(step) });
    },
    stop: () => set(IDLE),
  };
}

/** The page's one tour. */
export const tour = createTourStore();
