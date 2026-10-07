import { PerspectiveCamera, Sphere, Vector3 } from "three";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createCameraControls } from "@/engine/explode/camera";
import type { AppliedLooks } from "@/engine/explode";
import { fitPose, picksExploded } from "./fit-pose";

const base = { selected: null, k: 0, applied: null };
const looks: AppliedLooks = { looks: null, root: 1, parts: {} };
const settled: AppliedLooks = { looks: null, root: 1, parts: { frontal: 1.1 } };

describe("picksExploded", () => {
  it("is a pick on an exploded pose that has arrived", () => {
    expect(picksExploded(base, { selected: "frontal", k: 1, target: 1, applied: null }, 1)).toBe(true);
    expect(picksExploded({ selected: "frontal", k: 1, applied: null }, { selected: "parietal", k: 1, target: 1, applied: null }, 1)).toBe(true);
  });

  it("is also the explode tween settling with a part already picked", () => {
    expect(picksExploded({ selected: "frontal", k: 0.4, applied: null }, { selected: "frontal", k: 1, target: 1, applied: null }, 1)).toBe(true);
  });

  it("is also a look settling with a part picked: the stage recentres on the part after the pick's own move", () => {
    expect(picksExploded({ selected: "frontal", k: 1, applied: looks }, { selected: "frontal", k: 1, target: 1, applied: settled }, 1)).toBe(true);
  });

  it("is not the first look to settle, which the stage does not answer with a move", () => {
    expect(picksExploded({ selected: "frontal", k: 1, applied: null }, { selected: "frontal", k: 1, target: 1, applied: looks }, 1)).toBe(false);
  });

  it("is not a deselect, an assembled pose, a tween still under way, or a change that is neither", () => {
    expect(picksExploded({ selected: "frontal", k: 1, applied: null }, { selected: null, k: 1, target: 1, applied: null }, 1)).toBe(false);
    expect(picksExploded(base, { selected: "frontal", k: 0, target: 0, applied: null }, 0)).toBe(false);
    expect(picksExploded(base, { selected: "frontal", k: 1, target: 1, applied: null }, 0.6)).toBe(false);
    expect(picksExploded({ selected: "frontal", k: 1, applied: null }, { selected: "frontal", k: 1, target: 1, applied: null }, 1)).toBe(false);
  });
});

describe("fitPose", () => {
  beforeAll(() => {
    // camera-controls measures its canvas with a DOMRect, which node has not got; it is never read here.
    vi.stubGlobal("DOMRect", class {});
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  const rig = () => {
    const controls = createCameraControls(new PerspectiveCamera(35, 1.6), undefined as unknown as HTMLElement);
    controls.update(0);
    return controls;
  };
  const offsetEnd = (c: ReturnType<typeof rig>) => c.getFocalOffset(new Vector3(), true).y;

  it("frames the sphere and lifts the view by the stage's lift, after the engine cleared it for the pick", () => {
    const controls = rig();
    const sphere = new Sphere(new Vector3(0, 1, 0), 2);
    // The engine's pick: clear the lift, fly to the part.
    void controls.setFocalOffset(0, 0, 0, true);
    void controls.fitToSphere(new Sphere(new Vector3(3, 0, 0), 0.4), true);
    fitPose(controls, sphere, 0.1, true);
    expect(offsetEnd(controls)).toBeCloseTo(0.2, 9);
    expect(controls.getTarget(new Vector3(), true).toArray()).toEqual([0, 1, 0]);
  });

  it("adds no lift when the stage has none, and a bare fitToSphere clears any that was there", () => {
    const controls = rig();
    void controls.setFocalOffset(0, 0.3, 0, false);
    fitPose(controls, new Sphere(new Vector3(), 1), 0, true);
    expect(offsetEnd(controls)).toBe(0);
  });

  it("is immediate when not animated", () => {
    const controls = rig();
    fitPose(controls, new Sphere(new Vector3(), 1), 0.1, false);
    expect(controls.getFocalOffset(new Vector3(), false).y).toBeCloseTo(0.1, 9);
  });
});
