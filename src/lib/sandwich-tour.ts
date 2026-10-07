/**
 * Follow a sandwich: a stepped tour from the mouth to the colon. Pure data and maths, no React and
 * no three, so it is unit-tested and the lazy tour chunk (src/app/tour-scene.tsx) only draws it.
 *
 * The bolus travels along one smooth curve through waypoints that sit inside the digestive parts of
 * the body model (model units: the body stands BODY_HEIGHT_UNITS tall on y = 0, patient's right is -x,
 * the front is +z). The waypoints were read off the model's own vertices; `sandwich-tour.glb.test.ts`
 * fails when one drifts outside its part after the model is rebuilt.
 */

import { segmentKey } from "@/engine/explode/deep-link";
import { CM_PER_UNIT } from "./model-scale";

export type Point = readonly [number, number, number];

export interface Waypoint {
  /** The body part the bolus is inside at this point. */
  part: string;
  at: Point;
}

export interface TourStep {
  id: string;
  title: string;
  /** The body part the camera frames and the info panel selects. */
  part: string;
  /** Plain anatomy, two or three sentences. */
  caption: string;
  /** Index into WAYPOINTS where the bolus rests for this step. */
  rest: number;
  /** The food's colour at this step: the route blends between one step's tone and the next. */
  tone: string;
}

/** Mouth to sigmoid colon. Each part's points run in the direction food moves. */
export const WAYPOINTS: readonly Waypoint[] = [
  { part: "mouth_throat", at: [0.0, 4.46, 0.12] },
  { part: "mouth_throat", at: [0.0, 4.41, 0.05] },
  { part: "mouth_throat", at: [0.0, 4.35, -0.01] },
  { part: "oesophagus", at: [0.002, 4.3, -0.028] },
  { part: "oesophagus", at: [0.001, 4.1, -0.085] },
  { part: "oesophagus", at: [0.004, 3.95, -0.116] },
  { part: "oesophagus", at: [0.004, 3.78, -0.109] },
  { part: "oesophagus", at: [-0.001, 3.62, -0.048] },
  { part: "oesophagus", at: [0.022, 3.528, -0.004] },
  { part: "stomach", at: [0.11, 3.46, 0.05] },
  { part: "stomach", at: [0.19, 3.4, 0.07] },
  { part: "stomach", at: [0.09, 3.3, 0.15] },
  { part: "stomach", at: [-0.03, 3.29, 0.15] },
  { part: "small_intestine", at: [-0.1, 3.29, 0.07] },
  { part: "small_intestine", at: [-0.16, 3.12, 0.06] },
  { part: "small_intestine", at: [0.05, 3.0, 0.14] },
  { part: "small_intestine", at: [0.22, 2.93, 0.11] },
  { part: "small_intestine", at: [0.09, 2.78, 0.13] },
  { part: "small_intestine", at: [-0.08, 2.7, 0.11] },
  { part: "small_intestine", at: [-0.2, 2.76, 0.06] },
  { part: "large_intestine", at: [-0.26, 2.73, 0.01] },
  { part: "large_intestine", at: [-0.25, 2.95, 0.005] },
  { part: "large_intestine", at: [-0.225, 3.17, 0.04] },
  { part: "large_intestine", at: [-0.1, 3.2, 0.13] },
  { part: "large_intestine", at: [0.05, 3.19, 0.13] },
  { part: "large_intestine", at: [0.24, 3.26, 0.03] },
  { part: "large_intestine", at: [0.265, 3.05, -0.016] },
  { part: "large_intestine", at: [0.26, 2.85, -0.002] },
  { part: "large_intestine", at: [0.17, 2.68, -0.02] },
  { part: "large_intestine", at: [0.03, 2.62, -0.11] },
];

export const STEPS: readonly TourStep[] = [
  {
    id: "mouth",
    title: "Mouth",
    part: "mouth_throat",
    rest: 0,
    tone: "#c08a4a",
    caption:
      "Teeth cut and grind the food while the tongue mixes it with saliva. Saliva softens it, and an enzyme in it, amylase, begins breaking starch down into sugars. The chewed food is rolled into a soft ball called a bolus.",
  },
  {
    id: "throat",
    title: "Throat",
    part: "mouth_throat",
    rest: 2,
    tone: "#c08a4a",
    caption:
      "The tongue pushes the bolus to the back of the mouth and into the pharynx, the throat. As you swallow, a flap called the epiglottis folds over the entrance to the windpipe, so the food is directed toward the oesophagus.",
  },
  {
    id: "oesophagus",
    title: "Oesophagus",
    part: "oesophagus",
    rest: 8,
    tone: "#b9814a",
    caption:
      "The oesophagus is a muscular tube about 25 centimetres long. It runs behind the windpipe and the heart and passes through the diaphragm. Waves of muscle contraction, called peristalsis, push the bolus down to the stomach.",
  },
  {
    id: "stomach",
    title: "Stomach",
    part: "stomach",
    rest: 10,
    tone: "#c9a04e",
    caption:
      "A ring of muscle at the stomach's entrance opens to let the bolus in. The stomach wall churns the food with gastric juice, which contains hydrochloric acid and pepsin, an enzyme that starts breaking down protein. The result is a thick liquid called chyme, which usually leaves over a few hours.",
  },
  {
    id: "small-intestine",
    title: "Small intestine",
    part: "small_intestine",
    rest: 16,
    tone: "#b98a3a",
    caption:
      "Chyme is released in small amounts through the pylorus into the small intestine, several metres of coiled tube. Its first part, the duodenum, receives bile from the liver and gallbladder and digestive enzymes from the pancreas. Most digestion finishes here, and most nutrients pass through the lining into the blood and lymph.",
  },
  {
    id: "ascending-colon",
    title: "Caecum and ascending colon",
    part: "large_intestine",
    rest: 22,
    tone: "#95672f",
    caption:
      "What the small intestine has not absorbed passes through a valve into the caecum, the start of the large intestine on the right side, and climbs as the ascending colon. Water and salts are absorbed here, and gut bacteria ferment some of the fibre that is left.",
  },
  {
    id: "sigmoid-colon",
    title: "Transverse, descending and sigmoid colon",
    part: "large_intestine",
    rest: 29,
    tone: "#7a5230",
    caption:
      "The colon turns at the liver, crosses the upper abdomen as the transverse colon, turns again near the spleen and runs down the left side as the descending colon to the S-shaped sigmoid colon. Most of the water is gone by now, and the remains are formed into stool, which passes on to the rectum.",
  },
];

export const STEP_COUNT = STEPS.length;

/**
 * Parts hidden while the tour runs because they sit in front of the digestive tract from the front
 * (the lungs reach down over the stomach, the airway runs down in front of the oesophagus, and the
 * membranes drape over the intestines). The skeleton fades instead of hiding, through X-ray.
 */
export const TOUR_HIDDEN: readonly string[] = ["heart", "lungs", "airway", "larynx", "thyroid", "thymus", "other"];

/** The bolus's radius: about 0.9 cm, in model units. */
export const BOLUS_RADIUS = 0.9 / CM_PER_UNIT.body;

/**
 * A step number from the address: `?tour=3` is the third step. Strict: exactly one `tour` value, which
 * must be a plain positive integer of one to three digits and within 1..count. Anything else (a
 * decimal, a sign, markup, a selector, an out-of-range number, a repeated key) is ignored. The value is
 * only ever compared against digits, never inserted into the page or used as a selector.
 */
export function parseTourParam(search: string, count: number = STEP_COUNT): number | null {
  const values = new URLSearchParams(search).getAll("tour");
  if (values.length !== 1 || !/^[1-9][0-9]{0,2}$/.test(values[0])) return null;
  const n = Number(values[0]);
  return n <= count ? n - 1 : null;
}

/**
 * The query string (with its `?`, or "" when empty) with `tour` set to a zero-based step, or removed
 * for null. Every other parameter is kept byte for byte and in order.
 */
export function writeTourParam(search: string, step: number | null): string {
  const kept = search
    .replace(/^\?/, "")
    .split("&")
    .filter((seg) => seg !== "" && segmentKey(seg) !== "tour");
  if (step !== null) kept.push(`tour=${step + 1}`);
  return kept.length ? `?${kept.join("&")}` : "";
}

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** A sampled curve: dense points with their running length, plus the length at each waypoint. */
export interface Route {
  points: Point[];
  /** `lengths[i]` is the curve length from the first point to `points[i]`. */
  lengths: number[];
  /** `knots[i]` is the curve length at waypoint `i`. */
  knots: number[];
  total: number;
}

/** Uniform Catmull-Rom between p1 and p2 at t in [0, 1], with p0 and p3 as neighbours. */
function catmull(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  const at = (i: 0 | 1 | 2) =>
    0.5 * (2 * p1[i] + (p2[i] - p0[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (3 * p1[i] - p0[i] - 3 * p2[i] + p3[i]) * t3);
  return [at(0), at(1), at(2)];
}

/**
 * Samples a smooth curve through the waypoints (Catmull-Rom, the ends mirrored so the curve starts and
 * ends on the first and last waypoint). It passes through every waypoint and has no jumps, and is
 * measured by length so the bolus can travel at a steady speed however the waypoints are spaced.
 */
export function buildRoute(waypoints: readonly Waypoint[] = WAYPOINTS, perSegment = 12): Route {
  const p = waypoints.map((w) => w.at);
  if (p.length < 2) throw new Error("a route needs at least two waypoints");
  const ends = (i: number): Point => p[Math.min(Math.max(i, 0), p.length - 1)];
  const points: Point[] = [p[0]];
  const lengths = [0];
  const knots = [0];
  for (let i = 0; i < p.length - 1; i++) {
    for (let k = 1; k <= perSegment; k++) {
      const next = k === perSegment ? p[i + 1] : catmull(ends(i - 1), p[i], p[i + 1], ends(i + 2), k / perSegment);
      lengths.push(lengths[lengths.length - 1] + dist(points[points.length - 1], next));
      points.push(next);
    }
    knots.push(lengths[lengths.length - 1]);
  }
  return { points, lengths, knots, total: lengths[lengths.length - 1] };
}

/** The curve's point at length `s`, clamped to its ends. */
export function pointAt(route: Route, s: number): Point {
  if (s <= 0) return route.points[0];
  if (s >= route.total) return route.points[route.points.length - 1];
  let lo = 0;
  let hi = route.lengths.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (route.lengths[mid] <= s) lo = mid;
    else hi = mid;
  }
  const span = route.lengths[hi] - route.lengths[lo];
  const f = span > 0 ? (s - route.lengths[lo]) / span : 0;
  const a = route.points[lo];
  const b = route.points[hi];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** The waypoint segment that length `s` lies in, and how far along it (0 to 1). */
export function segmentAt(route: Route, s: number): { index: number; fraction: number } {
  const last = route.knots.length - 1;
  if (s <= 0) return { index: 0, fraction: 0 };
  if (s >= route.total) return { index: last - 1, fraction: 1 };
  let i = 0;
  while (i < last - 1 && route.knots[i + 1] <= s) i++;
  const span = route.knots[i + 1] - route.knots[i];
  return { index: i, fraction: span > 0 ? (s - route.knots[i]) / span : 0 };
}

/** The curve length at which each step's bolus rests. */
export function stopsFor(route: Route, steps: readonly TourStep[] = STEPS): number[] {
  return steps.map((s) => route.knots[s.rest]);
}

/** Per-second rate of the bolus easing toward its stop: about 0.7 s to cover most of a leg. */
const TRAVEL_RATE = 3.2;
const ARRIVED = 1e-3;

/** The bolus's next length along the curve: eased toward `target`, or there at once when motion is reduced. */
export function advance(current: number, target: number, dt: number, reduced: boolean): number {
  if (reduced || Math.abs(target - current) < ARRIVED) return target;
  return current + (target - current) * (1 - Math.exp(-TRAVEL_RATE * Math.max(dt, 0)));
}

/** Which two steps length `s` lies between, and how far from the first to the second (0 to 1), for blending the food's tone. */
export function stepBlend(stops: readonly number[], s: number): { from: number; to: number; fraction: number } {
  if (s <= stops[0]) return { from: 0, to: 0, fraction: 0 };
  const last = stops.length - 1;
  if (s >= stops[last]) return { from: last, to: last, fraction: 0 };
  let i = 0;
  while (i < last - 1 && stops[i + 1] <= s) i++;
  return { from: i, to: i + 1, fraction: (s - stops[i]) / (stops[i + 1] - stops[i]) };
}

/**
 * A lump's radius factor in the direction (x, y, z) (a unit vector): 1 plus a few overlapping low
 * ripples, so a sphere becomes a soft irregular bite of food. Deterministic, always within 0.8 to 1.2.
 */
export function lumpFactor(x: number, y: number, z: number): number {
  const ripple = Math.sin(x * 3.1 + y * 1.7) * 0.5 + Math.sin(y * 4.3 - z * 2.9 + 1.3) * 0.3 + Math.sin(z * 5.7 + x * 2.3 + 0.7) * 0.2;
  return 1 + 0.2 * ripple;
}
