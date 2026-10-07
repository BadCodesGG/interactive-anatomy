/**
 * The studio floor's height, measured only when the layout it depends on has changed. Walking every
 * part's meshes and transforming their bounds is the cost of `lowestPoint`; doing it every frame for
 * a floor that sits still while the model does is what `./living` used to pay on an on-demand stage.
 */
import type { Object3D } from "three";
import { lowestPoint } from "@/engine/explode/ground";

export class FloorHeight {
  private key: readonly unknown[] | null = null;
  private low: number | null = null;

  /**
   * The lowest world y of the visible parts, or null when none is visible. Measured again when any
   * value of `key` differs from the last call's, or when `volatile` (something is tweening and the key
   * does not show how far); otherwise the last answer. The world matrices are brought up to date first,
   * since the measure reads them and the key can change in the same frame a part is moved.
   */
  lowest(root: Object3D, parts: Iterable<Object3D>, key: readonly unknown[], volatile = false): number | null {
    if (!volatile && this.key && key.length === this.key.length && key.every((v, i) => Object.is(v, this.key![i]))) return this.low;
    root.updateMatrixWorld(true);
    this.key = key;
    this.low = lowestPoint(parts);
    return this.low;
  }
}

/**
 * The layer the floor is on. The stage camera draws it; the contact shadow's depth camera (layer 0 only)
 * does not. The floor follows the pose a frame apart from the ground, so while parts travel down it can sit
 * above that camera, and drawn into its pass it shades the whole contact plane.
 */
export const FLOOR_LAYER = 1;

/** Lets the camera draw the floor's layer; the undo puts the camera's layers back as they were. */
export function showFloorLayer(camera: Object3D): () => void {
  const had = camera.layers.isEnabled(FLOOR_LAYER);
  camera.layers.enable(FLOOR_LAYER);
  return () => {
    if (!had) camera.layers.disable(FLOOR_LAYER);
  };
}
