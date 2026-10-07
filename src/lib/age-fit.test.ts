import { describe, expect, it } from "vitest";
import { ageStages } from "@/data/ages";
import { ageFitRadius, apparentSize } from "./age-fit";

describe("ageFitRadius", () => {
  it("leaves the adult framing alone", () => {
    expect(ageFitRadius(3, 1)).toBe(3);
  });

  it("comes in on a smaller body, but only partway, so the size still reads", () => {
    const adult = 3;
    const infant = ageFitRadius(adult * 0.4, 0.4);
    expect(infant).toBeLessThan(adult);
    // The body now fills the cube root of 0.4 of what an adult does (about 74%), not 0.4.
    expect((adult * 0.4) / infant).toBeCloseTo(Math.cbrt(0.4));
    expect((adult * 0.4) / infant).toBeGreaterThan(0.7);
    expect((adult * 0.4) / infant).toBeLessThan(1);
  });

  it("keeps the stages in size order on screen", () => {
    const sizes = ageStages.map((s) => apparentSize(s.heightScale));
    for (let i = 1; i < ageStages.length; i++) {
      if (ageStages[i].heightScale > ageStages[i - 1].heightScale) expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
    }
    expect(Math.max(...sizes)).toBeLessThanOrEqual(1);
  });
});
