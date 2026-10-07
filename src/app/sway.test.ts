import { PerspectiveCamera } from "three";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createCameraControls } from "@/engine/explode/camera";
import { SWAY_RADIANS, SWAY_SECONDS } from "./motion";
import { Sway, type Orbit } from "./sway";

const DT = 1 / 60;

/** The real camera-controls, with no canvas, driven the way the stage drives it: update, then the sway, once a frame. */
function rig() {
  const controls = createCameraControls(new PerspectiveCamera(), undefined as unknown as HTMLElement);
  controls.rotateTo(0.6, 1.1, false);
  controls.update(0);
  const sway = new Sway();
  let t = 5;
  return {
    controls,
    sway,
    frame(allowed = true) {
      t += DT;
      controls.update(DT);
      return sway.step(t, controls, allowed);
    },
  };
}

describe("Sway", () => {
  // camera-controls measures its canvas with a DOMRect, which node has not got; it is never read here.
  beforeAll(() => {
    vi.stubGlobal("DOMRect", class {});
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("looks for a frame, then carries the camera along the sway while it is settled", () => {
    const r = rig();
    expect(r.frame()).toBe(false);
    const start = r.controls.azimuthAngle;
    let moved = 0;
    for (let i = 0; i < 120; i++) if (r.frame()) moved++;
    expect(moved).toBe(120);
    expect(Math.abs(r.controls.azimuthAngle - start)).toBeGreaterThan(1e-4);
    expect(Math.abs(r.controls.azimuthAngle - start)).toBeLessThanOrEqual(2 * SWAY_RADIANS);
  });

  it("stays out of a chase's way (Reset view, an authored view, a drag's coast): the camera is not snapped to its end", () => {
    const r = rig();
    for (let i = 0; i < 10; i++) r.frame();
    const end = r.controls.azimuthAngle + 1;
    void r.controls.rotateTo(end, r.controls.polarAngle, true);
    r.frame();
    // Eased, not jumped: the first frame of a transition is a small step toward the end.
    expect(r.controls.azimuthAngle).toBeLessThan(end - 0.5);
    let last = r.controls.azimuthAngle;
    for (let i = 0; i < 10; i++) {
      r.frame();
      expect(r.controls.azimuthAngle).toBeGreaterThan(last);
      expect(r.controls.azimuthAngle).toBeLessThan(end);
      last = r.controls.azimuthAngle;
    }
    // And the transition still arrives, with the sway going on around it.
    for (let i = 0; i < 600; i++) r.frame();
    expect(Math.abs(r.controls.azimuthAngle - end)).toBeLessThanOrEqual(2 * SWAY_RADIANS);
  });

  it("waits for the camera to stop moving, then goes on", () => {
    const r = rig();
    for (let i = 0; i < 10; i++) r.frame();
    void r.controls.rotateTo(r.controls.azimuthAngle + 0.3, r.controls.polarAngle, true);
    let waited = 0;
    while (!r.frame() && waited < 1200) waited++;
    expect(waited).toBeGreaterThan(10);
    expect(waited).toBeLessThan(1200);
    expect(r.frame()).toBe(true);
  });

  it("does nothing while not allowed, and does not catch up afterwards", () => {
    const r = rig();
    for (let i = 0; i < 10; i++) r.frame();
    const before = r.controls.azimuthAngle;
    for (let i = 0; i < 300; i++) expect(r.frame(false)).toBe(false);
    expect(r.controls.azimuthAngle).toBe(before);
    r.frame();
    // One frame's worth of sway, not the five seconds that passed.
    const bound = (2 * Math.PI * SWAY_RADIANS * DT) / SWAY_SECONDS + 1e-9;
    expect(Math.abs(r.controls.azimuthAngle - before)).toBeLessThanOrEqual(bound * 2);
  });

  it("leaves the controls alone while a pointer action holds them", () => {
    const rotate = vi.fn(() => Promise.resolve());
    const held: Orbit = { currentAction: 1, azimuthAngle: 0.5, polarAngle: 1, rotate };
    const sway = new Sway();
    for (let i = 0; i < 5; i++) expect(sway.step(i * DT, held, true)).toBe(false);
    expect(rotate).not.toHaveBeenCalled();
  });
});
