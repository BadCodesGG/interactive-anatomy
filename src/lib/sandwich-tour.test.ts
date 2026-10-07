import { describe, expect, it } from "vitest";
import { bodyCopy, bodySidecar } from "@/data/body";
import {
  advance,
  buildRoute,
  lumpFactor,
  parseTourParam,
  pointAt,
  segmentAt,
  stepBlend,
  STEP_COUNT,
  STEPS,
  stopsFor,
  TOUR_HIDDEN,
  WAYPOINTS,
  writeTourParam,
  type Waypoint,
} from "./sandwich-tour";

const partIds = new Set(Object.keys(bodySidecar.parts));
const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe("the tour's data", () => {
  it("names only parts the body model has", () => {
    for (const w of WAYPOINTS) expect(partIds.has(w.part), `waypoint part ${w.part}`).toBe(true);
    for (const s of STEPS) expect(partIds.has(s.part), `step part ${s.part}`).toBe(true);
  });

  it("goes mouth to colon through the digestive parts in order", () => {
    const parts = STEPS.map((s) => s.part);
    expect(parts[0]).toBe("mouth_throat");
    expect(parts.at(-1)).toBe("large_intestine");
    expect([...new Set(parts)]).toEqual(["mouth_throat", "oesophagus", "stomach", "small_intestine", "large_intestine"]);
  });

  it("rests each step inside that step's own part, strictly further along the route", () => {
    let last = -1;
    for (const s of STEPS) {
      expect(s.rest).toBeGreaterThan(last);
      expect(s.rest).toBeLessThan(WAYPOINTS.length);
      expect(WAYPOINTS[s.rest].part).toBe(s.part);
      last = s.rest;
    }
  });

  it("has unique step ids, titles and captions, and a caption for every step", () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEP_COUNT);
    for (const s of STEPS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.caption.length).toBeGreaterThan(80);
      expect(s.tone).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(new Set(STEPS.map((s) => s.caption)).size).toBe(STEP_COUNT);
  });

  it("writes no em dash anywhere", () => {
    for (const s of STEPS) expect(`${s.title} ${s.caption}`).not.toContain("—");
  });

  it("keeps every part's waypoints together, in part order (food never doubles back to an earlier organ)", () => {
    const order = ["mouth_throat", "oesophagus", "stomach", "small_intestine", "large_intestine"];
    const seen = WAYPOINTS.map((w) => order.indexOf(w.part));
    expect(seen.every((i) => i >= 0)).toBe(true);
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
  });

  it("every step's part has copy to show in the info panel", () => {
    for (const s of STEPS) expect(bodyCopy[bodySidecar.parts[s.part].copy]).toBeDefined();
  });
});

describe("the parts put aside during the tour", () => {
  it("are real parts of the body, none of them on the bolus's route", () => {
    const onRoute = new Set([...WAYPOINTS.map((w) => w.part), ...STEPS.map((s) => s.part)]);
    expect(new Set(TOUR_HIDDEN).size).toBe(TOUR_HIDDEN.length);
    for (const id of TOUR_HIDDEN) {
      expect(partIds.has(id), id).toBe(true);
      expect(onRoute.has(id), id).toBe(false);
    }
  });
});

describe("the curve", () => {
  const route = buildRoute();

  it("passes through every waypoint", () => {
    WAYPOINTS.forEach((w, i) => expect(pointAt(route, route.knots[i])).toEqual(w.at));
  });

  it("has no jump: consecutive samples stay close, and a sample step is never longer than the gap it crosses", () => {
    for (let i = 1; i < route.points.length; i++) {
      const step = dist(route.points[i], route.points[i - 1]);
      expect(step, `sample ${i}`).toBeLessThan(0.08);
      expect(route.lengths[i]).toBeGreaterThanOrEqual(route.lengths[i - 1]);
    }
    for (let i = 1; i < WAYPOINTS.length; i++) {
      // The curve between two waypoints is at least as long as the straight line, never a teleport.
      expect(route.knots[i] - route.knots[i - 1]).toBeGreaterThanOrEqual(dist(WAYPOINTS[i].at, WAYPOINTS[i - 1].at) - 1e-9);
    }
  });

  it("is continuous in direction across a waypoint (no kink)", () => {
    const e = 1e-3;
    for (let i = 1; i < WAYPOINTS.length - 1; i++) {
      const k = route.knots[i];
      const before = pointAt(route, k - e);
      const here = pointAt(route, k);
      const after = pointAt(route, k + e);
      const d1 = [0, 1, 2].map((j) => here[j] - before[j]);
      const d2 = [0, 1, 2].map((j) => after[j] - here[j]);
      const cos = (d1[0] * d2[0] + d1[1] * d2[1] + d1[2] * d2[2]) / (Math.hypot(...d1) * Math.hypot(...d2));
      expect(cos, `waypoint ${i}`).toBeGreaterThan(0.8);
    }
  });

  it("clamps pointAt to its ends and never leaves the curve's sampled bounds", () => {
    expect(pointAt(route, -5)).toEqual(WAYPOINTS[0].at);
    expect(pointAt(route, route.total + 5)).toEqual(WAYPOINTS.at(-1)!.at);
    const mid = pointAt(route, route.total / 2);
    expect(mid.every(Number.isFinite)).toBe(true);
  });

  it("reports the stops of the steps in increasing length", () => {
    const stops = stopsFor(route);
    expect(stops).toHaveLength(STEP_COUNT);
    expect([...stops].sort((a, b) => a - b)).toEqual(stops);
    expect(stops[0]).toBe(0);
  });

  it("finds the waypoint segment for a length", () => {
    expect(segmentAt(route, -1)).toEqual({ index: 0, fraction: 0 });
    expect(segmentAt(route, route.total + 1)).toEqual({ index: WAYPOINTS.length - 2, fraction: 1 });
    const { index, fraction } = segmentAt(route, (route.knots[4] + route.knots[5]) / 2);
    expect(index).toBe(4);
    expect(fraction).toBeCloseTo(0.5, 6);
  });

  it("refuses a route of one point", () => {
    expect(() => buildRoute([WAYPOINTS[0]] as readonly Waypoint[])).toThrow();
  });
});

describe("travel", () => {
  it("moves toward the target without overshooting, and arrives", () => {
    let s = 0;
    for (let i = 0; i < 600; i++) {
      const next = advance(s, 10, 1 / 60, false);
      expect(next).toBeGreaterThanOrEqual(s);
      expect(next).toBeLessThanOrEqual(10);
      s = next;
    }
    expect(s).toBe(10);
  });

  it("goes backward the same way", () => {
    const next = advance(10, 4, 0.1, false);
    expect(next).toBeLessThan(10);
    expect(next).toBeGreaterThan(4);
  });

  it("jumps straight to the target under reduced motion", () => {
    expect(advance(0, 7.5, 1 / 60, true)).toBe(7.5);
    expect(advance(9, 2, 0, true)).toBe(2);
  });

  it("does not move backward in time, or divide by zero, on a zero or negative frame", () => {
    expect(advance(1, 5, 0, false)).toBe(1);
    expect(advance(1, 5, -1, false)).toBe(1);
  });
});

describe("the food's tone blend", () => {
  const stops = [0, 2, 5, 9];
  it("holds at the ends and between two stops gives their fraction", () => {
    expect(stepBlend(stops, -1)).toEqual({ from: 0, to: 0, fraction: 0 });
    expect(stepBlend(stops, 12)).toEqual({ from: 3, to: 3, fraction: 0 });
    expect(stepBlend(stops, 3.5)).toEqual({ from: 1, to: 2, fraction: 0.5 });
    expect(stepBlend(stops, 2)).toEqual({ from: 1, to: 2, fraction: 0 });
  });
});

describe("the lump", () => {
  it("stays within a fifth of a sphere in every direction and is deterministic", () => {
    for (let i = 0; i < 400; i++) {
      const a = (i * 2.399963) % (2 * Math.PI);
      const z = 1 - (2 * (i + 0.5)) / 400;
      const r = Math.sqrt(1 - z * z);
      const f = lumpFactor(r * Math.cos(a), r * Math.sin(a), z);
      expect(f).toBeGreaterThanOrEqual(0.8);
      expect(f).toBeLessThanOrEqual(1.2);
      expect(lumpFactor(r * Math.cos(a), r * Math.sin(a), z)).toBe(f);
    }
  });

  it("is not a plain sphere", () => {
    const values = new Set([lumpFactor(1, 0, 0), lumpFactor(0, 1, 0), lumpFactor(0, 0, 1), lumpFactor(-1, 0, 0)].map((v) => v.toFixed(4)));
    expect(values.size).toBeGreaterThan(1);
  });
});

describe("the ?tour= parameter", () => {
  it("reads a step number, one-based, as a zero-based index", () => {
    expect(parseTourParam("?tour=1")).toBe(0);
    expect(parseTourParam("tour=3")).toBe(2);
    expect(parseTourParam(`?a=b&tour=${STEP_COUNT}&c=d`)).toBe(STEP_COUNT - 1);
  });

  it.each([
    "",
    "?tour=",
    "?tour=0",
    `?tour=${STEP_COUNT + 1}`,
    "?tour=99999",
    "?tour=-1",
    "?tour=+2",
    "?tour=2.5",
    "?tour=1e1",
    "?tour=0x2",
    "?tour=02",
    "?tour=2%20",
    "?tour=%202",
    "?tour=abc",
    "?tour=NaN",
    "?tour=Infinity",
    "?tour=<script>alert(1)</script>",
    "?tour=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E",
    "?tour=#app",
    "?tour=1&tour=2",
    "?tour[]=1",
    "?TOUR=1",
    "?xtour=1",
  ])("ignores %s", (search) => {
    expect(parseTourParam(search)).toBeNull();
  });

  it("honours a count that is not the default", () => {
    expect(parseTourParam("?tour=2", 2)).toBe(1);
    expect(parseTourParam("?tour=3", 2)).toBeNull();
  });

  it("writes the step one-based, replacing any earlier value", () => {
    expect(writeTourParam("", 0)).toBe("?tour=1");
    expect(writeTourParam("?tour=4", 2)).toBe("?tour=3");
  });

  it("replaces the parameter however it is percent-encoded, so a reload cannot restore a stale step", () => {
    expect(writeTourParam("?%74our=4&keep=1", 1)).toBe("?keep=1&tour=2");
    expect(writeTourParam("?%74our=4", null)).toBe("");
  });

  it("removes the parameter for null and leaves nothing behind when it was the only one", () => {
    expect(writeTourParam("?tour=4", null)).toBe("");
    expect(writeTourParam("", null)).toBe("");
  });

  it("keeps every other parameter byte for byte and in order", () => {
    expect(writeTourParam("?part=stomach&x=a%20b&tour=2&explode=1", 5)).toBe("?part=stomach&x=a%20b&explode=1&tour=6");
    expect(writeTourParam("?part=stomach&tour=2&y=", null)).toBe("?part=stomach&y=");
  });

  it("round-trips", () => {
    for (let i = 0; i < STEP_COUNT; i++) expect(parseTourParam(writeTourParam("?a=1", i))).toBe(i);
  });
});
