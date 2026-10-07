/**
 * How big the anatomy models are, in one place. `scripts/build-models.mjs` scales each model so its longest
 * side is a fixed number of units (the body stands on y = 0, the brain is centred), and the real thing is
 * a known length, so every "centimetres per unit" figure in the app derives from these. The body GLB's
 * measured extents are asserted against them in `model-scale.glb.test.ts`.
 */

/** The body model's height, in model units: `size` of the body spec in scripts/build-models.mjs. */
export const BODY_HEIGHT_UNITS = 5;
/** The adult it stands for. */
export const BODY_HEIGHT_CM = 175;

/** The brain model's front-to-back length (its longest side), in model units: `size` of the brain spec. */
export const BRAIN_LENGTH_UNITS = 2.2;
/** The average adult brain's length from front to back. */
export const BRAIN_LENGTH_CM = 16.7;

/** Real centimetres in one unit of each model's world. */
export const CM_PER_UNIT: Record<"body" | "brain", number> = {
  body: BODY_HEIGHT_CM / BODY_HEIGHT_UNITS,
  brain: BRAIN_LENGTH_CM / BRAIN_LENGTH_UNITS,
};
