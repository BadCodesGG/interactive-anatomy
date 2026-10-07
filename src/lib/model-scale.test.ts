import { describe, expect, it } from "vitest";
import { BODY_HEIGHT_CM, BODY_HEIGHT_UNITS, BRAIN_LENGTH_CM, BRAIN_LENGTH_UNITS, CM_PER_UNIT } from "./model-scale";
import { BOLUS_RADIUS, WAYPOINTS } from "./sandwich-tour";

describe("model scale", () => {
  it("is the real length over the model's length", () => {
    expect(CM_PER_UNIT.body).toBe(BODY_HEIGHT_CM / BODY_HEIGHT_UNITS);
    expect(CM_PER_UNIT.brain).toBe(BRAIN_LENGTH_CM / BRAIN_LENGTH_UNITS);
  });

  it("sizes the tour in the same units: a bolus about 0.9 cm in radius, a route inside a body of that height", () => {
    expect(BOLUS_RADIUS * CM_PER_UNIT.body).toBeCloseTo(0.9, 6);
    for (const w of WAYPOINTS) {
      expect(w.at[1]).toBeGreaterThan(0);
      expect(w.at[1]).toBeLessThan(BODY_HEIGHT_UNITS);
    }
  });
});
