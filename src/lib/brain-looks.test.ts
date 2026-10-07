import { describe, expect, it } from "vitest";
import { BRAIN_COLOURS } from "@/data/brain-colours";
import { brainSidecar } from "@/data/brain";
import { brainLooks, HOVER_AMOUNT } from "./brain-looks";

describe("BRAIN_COLOURS", () => {
  it("has a colour for exactly the sidecar's regions", () => {
    expect(Object.keys(BRAIN_COLOURS).sort()).toEqual(Object.keys(brainSidecar.parts).sort());
    for (const colour of Object.values(BRAIN_COLOURS)) expect(colour).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("brainLooks", () => {
  it("leaves every region its own grey pink by default", () => {
    const { parts } = brainLooks(false, null, null);
    for (const look of Object.values(parts)) expect(look).toEqual({ tint: null, amount: 0 });
  });

  it("leans a hovered region toward its teaching colour, and only that one", () => {
    const { parts } = brainLooks(false, "temporal", null);
    expect(parts.temporal).toEqual({ tint: BRAIN_COLOURS.temporal, amount: HOVER_AMOUNT });
    expect(parts.frontal.amount).toBe(0);
  });

  it("takes a selected region all the way, and a selection wins over a hover on the same region", () => {
    expect(brainLooks(false, null, "frontal").parts.frontal.amount).toBe(1);
    expect(brainLooks(false, "frontal", "frontal").parts.frontal.amount).toBe(1);
    const both = brainLooks(false, "temporal", "frontal").parts;
    expect([both.frontal.amount, both.temporal.amount]).toEqual([1, HOVER_AMOUNT]);
  });

  it("shows every teaching colour when all regions are on", () => {
    const { parts } = brainLooks(true, null, null);
    for (const [id, colour] of Object.entries(BRAIN_COLOURS)) expect(parts[id]).toEqual({ tint: colour, amount: 1 });
  });

  it("sets no root scale, so the brain stays at its modelled size", () => {
    expect(brainLooks(true, "frontal", null).root).toBeUndefined();
  });
});
