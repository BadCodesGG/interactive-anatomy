import { describe, expect, it } from "vitest";
import { Object3D, Vector3 } from "three";
import { bodySidecar } from "@/data/body";
import { BREATH_SECONDS, BREATHING, breathPhase, HEART_BPM, HEARTBEAT, heartPulse, MOVING, movement, PartMotion, RIB_IDS, SWAY_RADIANS, swayAngle } from "./motion";

const sample = (fn: (t: number) => number, from: number, to: number, step = 0.005) => {
  const out: { t: number; v: number }[] = [];
  for (let t = from; t <= to; t += step) out.push({ t, v: fn(t) });
  return out;
};

/** Times at which a sampled signal is a local maximum above `floor`. */
const peaks = (points: { t: number; v: number }[], floor: number) =>
  points.filter((p, i) => i > 0 && i < points.length - 1 && p.v > floor && p.v >= points[i - 1].v && p.v > points[i + 1].v).map((p) => p.t);

describe("heartPulse", () => {
  it("stays within 0 and 1 and comes to rest between beats", () => {
    const all = sample(heartPulse, 0, 3);
    expect(Math.min(...all.map((p) => p.v))).toBeGreaterThanOrEqual(0);
    expect(Math.max(...all.map((p) => p.v))).toBeLessThanOrEqual(1);
    expect(Math.min(...all.map((p) => p.v))).toBeLessThan(0.02);
  });

  it("is a lub and a softer dub, twice a cycle, at the resting rate", () => {
    const period = 60 / HEART_BPM;
    const cycle = peaks(sample(heartPulse, 0, period - 0.01, 0.002), 0.2);
    expect(cycle).toHaveLength(2);
    const [lub, dub] = cycle;
    expect(heartPulse(lub)).toBeGreaterThan(0.95);
    expect(heartPulse(dub)).toBeGreaterThan(0.5);
    expect(heartPulse(dub)).toBeLessThan(0.7);
    expect(dub - lub).toBeGreaterThan(0.25);
    expect(dub - lub).toBeLessThan(0.4);
    // Ten seconds of it is 66 / 6 lubs, give or take the one on the edge.
    const lubs = peaks(sample(heartPulse, 0, 10, 0.002), 0.9);
    expect(lubs.length).toBeGreaterThanOrEqual(10);
    expect(lubs.length).toBeLessThanOrEqual(12);
  });

  it("repeats every beat cycle, including before time zero", () => {
    const period = 60 / HEART_BPM;
    expect(heartPulse(0.21 + period)).toBeCloseTo(heartPulse(0.21), 9);
    expect(heartPulse(0.21 - period)).toBeCloseTo(heartPulse(0.21), 9);
  });
});

describe("breathPhase", () => {
  it("is out at 0, in at half a cycle and out again after a whole one", () => {
    expect(breathPhase(0)).toBeCloseTo(0, 9);
    expect(breathPhase(BREATH_SECONDS / 2)).toBeCloseTo(1, 9);
    expect(breathPhase(BREATH_SECONDS)).toBeCloseTo(0, 9);
  });

  it("takes about four seconds a breath", () => {
    expect(BREATH_SECONDS).toBe(4);
  });
});

describe("swayAngle", () => {
  it("never leaves the sway's bounds and starts at zero", () => {
    const all = sample(swayAngle, 0, 60, 0.05);
    expect(Math.max(...all.map((p) => Math.abs(p.v)))).toBeLessThanOrEqual(SWAY_RADIANS + 1e-9);
    expect(swayAngle(0)).toBe(0);
  });
});

describe("movement", () => {
  const into = { scale: new Vector3(), shift: new Vector3() };

  it("swells the heart with the beat and sinks it a little with the breath", () => {
    movement("heart", 1, 0, into);
    expect(into.scale.x).toBeCloseTo(1 + HEARTBEAT.heart.scale![0], 9);
    expect(into.shift.y).toBe(0);
    movement("heart", 0, 1, into);
    expect(into.scale.toArray()).toEqual([1, 1, 1]);
    expect(into.shift.y).toBeLessThan(0);
  });

  it("fills the lungs more up and down than across, and lifts the ribcage", () => {
    movement("lungs", 0, 1, into);
    expect(into.scale.y).toBeGreaterThan(into.scale.x);
    expect(into.scale.x).toBeGreaterThan(1);
    movement("ribcage", 0, 1, into);
    expect(into.shift.y).toBeGreaterThan(0);
  });

  it("breathes every rib as the ribcage does, so the split cage still lifts and widens", () => {
    const cage = { scale: new Vector3(), shift: new Vector3() };
    movement("ribcage", 0, 1, cage);
    expect(cage.shift.y).toBeGreaterThan(0);
    expect(RIB_IDS).toHaveLength(24);
    for (const id of RIB_IDS) {
      movement(id, 0, 1, into);
      expect(into.scale.toArray(), id).toEqual(cage.scale.toArray());
      expect(into.shift.toArray(), id).toEqual(cage.shift.toArray());
      expect(MOVING, id).toContain(id);
    }
  });

  it("names exactly the ribs the body sidecar has, so none is left still", () => {
    const sidecarRibs = Object.keys(bodySidecar.parts).filter((id) => id.startsWith("rib_"));
    expect([...RIB_IDS].sort()).toEqual(sidecarRibs.sort());
  });

  it("puts the organs under the diaphragm down with the breath, and leaves everything else alone", () => {
    for (const id of ["liver", "stomach", "spleen", "pancreas", "gallbladder", "small_intestine", "large_intestine"]) {
      movement(id, 1, 1, into);
      expect(into.shift.y, id).toBeLessThan(0);
      expect(into.scale.toArray(), id).toEqual([1, 1, 1]);
    }
    movement("skull", 1, 1, into);
    expect([...into.scale.toArray(), ...into.shift.toArray()]).toEqual([1, 1, 1, 0, 0, 0]);
  });

  it("names every moving part once", () => {
    expect(new Set(MOVING).size).toBe(MOVING.length);
    for (const id of Object.keys(BREATHING)) expect(MOVING).toContain(id);
  });
});

describe("PartMotion", () => {
  /** A part the way the models build one: the node carries the part's size (quantised meshes), its content hangs off it. */
  const build = () => {
    const root = new Object3D();
    const part = new Object3D();
    part.name = "heart";
    part.scale.setScalar(2);
    part.position.set(0, 5, 0);
    const content = new Object3D();
    content.position.set(1, 0, 0);
    const nested = new Object3D();
    nested.name = "nested";
    part.add(content, nested);
    root.add(part);
    const motion = new PartMotion(part, (o) => o === nested);
    motion.attach();
    return { root, part, content, nested, motion };
  };
  const world = (o: Object3D) => o.getWorldPosition(new Vector3());
  const factor = (s: number, dy: number) => ({ scale: new Vector3(s, s, s), shift: new Vector3(0, dy, 0) });

  it("never writes the part node, so the scale the stage reports (the node's over its base) stays clean", () => {
    const { part, motion } = build();
    const f = factor(1.5, -1);
    for (let i = 0; i < 5; i++) motion.apply(f.scale, f.shift);
    expect(part.scale.toArray()).toEqual([2, 2, 2]);
    expect(part.position.toArray()).toEqual([0, 5, 0]);
  });

  it("scales the content about the part's origin and shifts it in the parent's units, whatever the part's own scale", () => {
    const { root, content, motion } = build();
    const f = factor(1.5, -1);
    motion.apply(f.scale, f.shift);
    root.updateMatrixWorld(true);
    // x: the part's scale 2 times the movement's 1.5 times the content's local 1. y: 5 down by exactly 1.
    expect(world(content).toArray()).toEqual([3, 4, 0].map((v) => expect.closeTo(v, 9)));
  });

  it("does not compound frame after frame, and release stands the content still", () => {
    const { root, content, motion } = build();
    const f = factor(1.5, -1);
    for (let i = 0; i < 5; i++) motion.apply(f.scale, f.shift);
    root.updateMatrixWorld(true);
    expect(world(content).x).toBeCloseTo(3, 9);
    motion.release();
    root.updateMatrixWorld(true);
    expect(world(content).toArray()).toEqual([2, 5, 0]);
  });

  it("follows the stage rescaling the part, keeping the shift's size in the parent's units", () => {
    const { root, part, content, motion } = build();
    const f = factor(1, -1);
    motion.apply(f.scale, f.shift);
    part.scale.setScalar(4);
    motion.apply(f.scale, f.shift);
    root.updateMatrixWorld(true);
    expect(world(content).y).toBeCloseTo(4, 9);
  });

  it("leaves a part nested inside it where it is", () => {
    const { root, part, nested, motion } = build();
    const before = world(nested).toArray();
    const f = factor(1.5, -1);
    motion.apply(f.scale, f.shift);
    root.updateMatrixWorld(true);
    expect(nested.parent).toBe(part);
    expect(world(nested).toArray()).toEqual(before);
  });

  it("puts the content back under the part on detach", () => {
    const { part, content, motion } = build();
    motion.detach();
    expect(content.parent).toBe(part);
    expect(part.children).not.toContain(motion.node);
  });
});
