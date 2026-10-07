/**
 * Framing the whole exploded pose after a pick, with the same lift the stage frames it with. Pure
 * (no React; three only through the controls it is handed), so it is unit-tested.
 */
import type { Sphere } from "three";
import type { ExplodeState } from "@/engine/explode";

/** The part of camera-controls a refit uses. */
export interface Fitter {
  fitToSphere(sphere: Sphere, enableTransition: boolean): Promise<unknown>;
  setFocalOffset(x: number, y: number, z: number, enableTransition?: boolean): Promise<unknown>;
}

/**
 * Frames `sphere` and lifts the view `lift` of its radius, the stage's own `fitTo`: `lift` is the
 * stage's `lift` prop, and the engine clears the focal offset on every pick, so a refit that only
 * fits the sphere would leave the lift at 0.
 */
export function fitPose(controls: Fitter, sphere: Sphere, lift: number, animate: boolean): void {
  void controls.fitToSphere(sphere, animate);
  if (lift !== 0) void controls.setFocalOffset(0, lift * sphere.radius, 0, animate);
}

/**
 * Whether a store change moves the camera onto the picked part while the pose is exploded and has
 * arrived: the condition under which the whole pose gets the last word. Three things do it: a pick, the
 * explode tween settling with a part already picked, and a look that settled (`applied` changing), which
 * the stage answers by recentring on the picked part at the same distance. That last one lands a moment
 * after the pick's own fly-to, so a refit that only answered the pick would be undone by it and the pose
 * would end up centred on the part.
 */
export function picksExploded(
  prev: Pick<ExplodeState, "selected" | "k" | "applied">,
  next: Pick<ExplodeState, "selected" | "k" | "target" | "applied">,
  frameK: number,
): boolean {
  const moved = next.selected !== prev.selected || next.k !== prev.k || (next.applied !== prev.applied && prev.applied !== null);
  return moved && next.selected !== null && next.target >= 0.5 && frameK === next.target;
}
