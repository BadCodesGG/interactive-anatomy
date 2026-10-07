import { describe, expect, it, vi } from "vitest";
import { createTourStore } from "./tour-store";

describe("the tour store", () => {
  it("starts idle", () => {
    expect(createTourStore().getState()).toEqual({ active: false, step: 0 });
  });

  it("starts on the first step, or on the one asked for", () => {
    const s = createTourStore();
    s.start();
    expect(s.getState()).toEqual({ active: true, step: 0 });
    s.start(3);
    expect(s.getState()).toEqual({ active: true, step: 3 });
  });

  it("moves between steps only while running", () => {
    const s = createTourStore();
    s.goto(2);
    expect(s.getState().active).toBe(false);
    s.start();
    s.goto(2);
    expect(s.getState()).toEqual({ active: true, step: 2 });
  });

  it("stops back to idle", () => {
    const s = createTourStore();
    s.start(4);
    s.stop();
    expect(s.getState()).toEqual({ active: false, step: 0 });
  });

  it("turns nonsense steps into a whole number of at least zero", () => {
    const s = createTourStore();
    s.start(-3);
    expect(s.getState().step).toBe(0);
    s.goto(2.9);
    expect(s.getState().step).toBe(2);
    s.goto(Number.NaN);
    expect(s.getState().step).toBe(0);
    s.goto(Infinity);
    expect(s.getState().step).toBe(0);
  });

  it("tells subscribers about a change, once, and not about a no-op", () => {
    const s = createTourStore();
    const fn = vi.fn();
    const off = s.subscribe(fn);
    s.start(1);
    expect(fn).toHaveBeenCalledTimes(1);
    s.goto(1);
    s.start(1);
    expect(fn).toHaveBeenCalledTimes(1);
    s.stop();
    s.stop();
    expect(fn).toHaveBeenCalledTimes(2);
    off();
    s.start();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
