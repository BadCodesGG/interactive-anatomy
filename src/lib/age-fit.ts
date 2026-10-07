/**
 * How far the camera follows the body as it is drawn smaller. The stage frames the model at full
 * size and only recentres when an age look changes it, so an infant (0.4 of the adult height) stood
 * in the middle of the plate at a fifth of its area, with every leader line fanning out of one spot.
 * The camera comes in by the cube root of the scale instead of all the way: the infant fills
 * about 74% of the height an adult does, not 40%, so a smaller body still reads as smaller.
 */

/** How much of the adult's height the body fills on screen at a root scale: the cube root, so 1 at adult and the order kept. */
export const apparentSize = (root: number): number => Math.cbrt(root);

/** The radius the camera fits, given the radius of the body as drawn now (its framing included) and its root scale. */
export function ageFitRadius(drawnRadius: number, root: number): number {
  return drawnRadius / apparentSize(root);
}
