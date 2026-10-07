/**
 * The camera's idle sway, applied to camera-controls without fighting it. Pure, no React and no three:
 * `./living` calls `step` from the stage's frame loop.
 *
 * A non-transition `rotate` sets the controls' current angles to their end values. That is right for a
 * camera at rest, and wrong the moment anything else is moving it: a drag's coast after release would
 * stop dead, and a transition (Reset view, an authored view) would jump to its end. camera-controls
 * does not expose its end values, so settledness is read from what it does show: the current azimuth
 * and polar angle. Anything that moves them (a coast, a transition, a fly-in) changes them from one
 * frame to the next, and the sway leaves the camera alone until two frames agree.
 */
import { swayAngle } from "./motion";

/** The part of camera-controls the sway uses. */
export interface Orbit {
  /** The pointer action in progress (0 when none). */
  readonly currentAction: number;
  readonly azimuthAngle: number;
  readonly polarAngle: number;
  rotate(azimuthAngle: number, polarAngle: number, enableTransition?: boolean): Promise<void>;
}

export class Sway {
  /** The angles the camera had when the sway last looked, or NaN before it has looked. */
  private azimuth = NaN;
  private polar = NaN;
  private angle = 0;

  /**
   * Adds the change in the sway since the last frame to the camera's azimuth, when `allowed` and the
   * controls are settled; otherwise leaves them alone. Returns whether the camera moved, so the caller
   * can ask for a frame only then.
   */
  step(t: number, controls: Orbit, allowed: boolean): boolean {
    // A running offset: the sway's phase advances whether or not it is applied, so a pause is not caught up.
    const angle = swayAngle(t);
    const delta = angle - this.angle;
    this.angle = angle;
    const settled = allowed && controls.currentAction === 0 && controls.azimuthAngle === this.azimuth && controls.polarAngle === this.polar;
    if (settled) void controls.rotate(delta, 0, false);
    // Read after the write, so the next frame compares against where the sway left the camera.
    this.azimuth = controls.azimuthAngle;
    this.polar = controls.polarAngle;
    return settled;
  }
}
