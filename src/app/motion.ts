/**
 * The body's own movement: a heartbeat, breathing, and a slow sway of the camera. Pure maths and
 * three vectors, no React: `./living` drives it from the stage's frame loop.
 *
 * Nothing here writes a part's own transform. The stage owns each part's scale (the age slider's
 * looks, which it reads back and reports as `applied`) and position (the explode pose), so movement goes
 * on a node of its own between the part and what it draws: a `PartMotion`.
 */
import { Group, Vector3, type Object3D } from "three";

export type Vec3 = readonly [number, number, number];

export const HEART_BPM = 66;
export const BREATH_SECONDS = 4;
/** The camera sways this far either side of where the visitor left it, and takes this long over a full swing. */
export const SWAY_RADIANS = 0.05;
export const SWAY_SECONDS = 24;

/** A lub and a dub: two beats a cycle, the second softer and a third of a cycle after the first. */
const BEATS = [
  { at: 0, gain: 1 },
  { at: 0.33, gain: 0.6 },
] as const;
/** Seconds the heart takes to swell into a beat, and the time constant of its relaxing. */
const RISE = 0.07;
const FALL = 0.11;

const smooth = (x: number) => x * x * (3 - 2 * x);

/** One beat's envelope `s` seconds after it started: a quick swell, then a slower relax. */
function beat(s: number): number {
  if (s < 0) return 0;
  return s < RISE ? smooth(s / RISE) : Math.exp(-(s - RISE) / FALL);
}

/** How far into a heartbeat the heart is at time `t` seconds: 0 at rest, 1 at the top of the lub. */
export function heartPulse(t: number, bpm = HEART_BPM): number {
  const period = 60 / bpm;
  const s = ((t % period) + period) % period;
  return Math.min(1, Math.max(...BEATS.map((b) => b.gain * beat(s - b.at * period))));
}

/** How full the lungs are at time `t`: 0 breathed out, 1 breathed in, a slow cosine. */
export function breathPhase(t: number, seconds = BREATH_SECONDS): number {
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / seconds);
}

/** The camera's azimuth offset at time `t`. */
export function swayAngle(t: number): number {
  return SWAY_RADIANS * Math.sin((2 * Math.PI * t) / SWAY_SECONDS);
}

/** What one driver at full does to a part: its scale grows by these fractions, and it shifts by these (model units, parent space). */
export interface Move {
  scale?: Vec3;
  shift?: Vec3;
}

/** A heart swells by about 4.5 percent at the top of a beat: a little more than a real one, so that it reads at plate size. */
export const HEARTBEAT: Record<string, Move> = {
  heart: { scale: [0.045, 0.045, 0.045] },
};

/**
 * What the ribcage does at full inhalation. Every rib does it too: the ribs share the ribcage's node origin
 * (see the body map's `pivot`), so each scaling about it is the whole cage widening, as it was when the
 * ribcage was one part.
 */
const RIBCAGE_BREATH: Move = { scale: [0.016, 0.01, 0.022], shift: [0, 0.012, 0] };

/** The ids of the 24 ribs, as the body sidecar names them: `rib_1_left` to `rib_12_right`. */
export const RIB_IDS: readonly string[] = Array.from({ length: 12 }, (_, i) => (["left", "right"] as const).map((side) => `rib_${i + 1}_${side}`)).flat();

/**
 * Breathing at full inhalation. The lungs fill (more up and down than across), the ribcage lifts and widens,
 * and the diaphragm, which the models do not include, is shown by what rides on it: the heart and the organs
 * below it are pushed down. A body is BODY_HEIGHT_UNITS (5) tall for 175 cm, so 0.05 is 1.75 cm.
 */
export const BREATHING: Record<string, Move> = {
  lungs: { scale: [0.045, 0.065, 0.05], shift: [0, -0.03, 0] },
  ribcage: RIBCAGE_BREATH,
  ...Object.fromEntries(RIB_IDS.map((id) => [id, RIBCAGE_BREATH])),
  heart: { shift: [0, -0.02, 0] },
  liver: { shift: [0, -0.055, 0] },
  stomach: { shift: [0, -0.05, 0] },
  spleen: { shift: [0, -0.05, 0] },
  pancreas: { shift: [0, -0.045, 0] },
  gallbladder: { shift: [0, -0.05, 0] },
  small_intestine: { shift: [0, -0.04, 0] },
  large_intestine: { shift: [0, -0.035, 0] },
};

/** The ids of every part that moves at all. */
export const MOVING: readonly string[] = [...new Set([...Object.keys(HEARTBEAT), ...Object.keys(BREATHING)])];

const addScaled = (into: Vector3, by: Vec3 | undefined, k: number) => {
  if (by) into.set(into.x + by[0] * k, into.y + by[1] * k, into.z + by[2] * k);
};

/** The scale and shift a part should carry at these two drivers (each 0 to 1), on top of what the stage gave it. */
export function movement(id: string, pulse: number, breath: number, into: { scale: Vector3; shift: Vector3 }): void {
  into.scale.set(1, 1, 1);
  into.shift.set(0, 0, 0);
  addScaled(into.scale, HEARTBEAT[id]?.scale, pulse);
  addScaled(into.shift, HEARTBEAT[id]?.shift, pulse);
  addScaled(into.scale, BREATHING[id]?.scale, breath);
  addScaled(into.shift, BREATHING[id]?.shift, breath);
}

/**
 * One part's movement, on a node of its own: the part's own content (its mesh, or the node that holds
 * it) is moved under a child group, and the group is scaled and shifted. The part node itself is never
 * written, so the stage's scale and position for it stay exactly what the stage set, and what it reports.
 *
 * The group scales about the part's origin, as scaling the part would. A shift is given in the part's
 * parent space, the space the explode pose moves it in, so it is divided by the part's own scale (the
 * models are quantised: the node carries the part's size). Assumes the part is not rotated.
 */
export class PartMotion {
  readonly node = new Group();
  private readonly moved: Object3D[] = [];

  /** `isPart` tells another part, nested under this one, from content: a nested part is left where it is. */
  constructor(
    private readonly part: Object3D,
    private readonly isPart: (o: Object3D) => boolean,
  ) {}

  /** Moves the part's content under the group. */
  attach(): void {
    for (const child of [...this.part.children]) {
      if (child === this.node || this.isPart(child)) continue;
      this.node.add(child);
      this.moved.push(child);
    }
    this.part.add(this.node);
  }

  apply(scale: Vector3, shift: Vector3): void {
    const s = this.part.scale;
    this.node.scale.copy(scale);
    this.node.position.set(shift.x / s.x, shift.y / s.y, shift.z / s.z);
  }

  /** Back to standing still. */
  release(): void {
    this.node.scale.set(1, 1, 1);
    this.node.position.set(0, 0, 0);
  }

  /** Puts the content back under the part and takes the group away. */
  detach(): void {
    this.release();
    for (const child of this.moved) this.part.add(child);
    this.moved.length = 0;
    this.part.remove(this.node);
  }
}
