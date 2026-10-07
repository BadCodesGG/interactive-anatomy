import { describe, expect, it } from "vitest";
import { ageStages } from "@/data/ages";
import { bodySidecar } from "@/data/body";
import { ageLooks, ageNoteFor, ageNoteKey, AGE_TINTS, DEFAULT_AGE_STAGE, isSmallBody } from "./age-looks";

const groups = ["skull", "arm_left", "spine", "other"];

describe("DEFAULT_AGE_STAGE", () => {
  it("starts the body view on Adult, drawn at full height", () => {
    expect(ageStages[DEFAULT_AGE_STAGE].id).toBe("adult");
    expect(ageLooks(DEFAULT_AGE_STAGE, []).root).toBe(1);
  });
});

describe("isSmallBody", () => {
  it("is true for the infant and the toddler only", () => {
    expect(ageStages.filter((_, i) => isSmallBody(i)).map((s) => s.id)).toEqual(["infant", "toddler"]);
  });

  it("is false for a stage that does not exist", () => {
    expect(isSmallBody(99)).toBe(false);
  });
});

describe("ageLooks", () => {
  it("shrinks the whole body to the stage height and scales a group by its own note on top", () => {
    const looks = ageLooks(0, groups); // infant
    expect(looks.root).toBe(0.4);
    // ages.ts: an infant skull is 2.05 times the adult one, after the body is scaled to infant height.
    expect(looks.parts.skull.scale).toBe(2.05);
  });

  it("leaves a group with no note for the stage at scale 1 and untinted", () => {
    const looks = ageLooks(0, groups);
    expect(looks.parts.other).toEqual({ scale: 1, tint: null, amount: 0 });
  });

  it("tints growth green, peak in the accent and decline in the caution colour, stronger with risk", () => {
    expect(AGE_TINTS).toEqual({ growth: "#5f8a57", peak: "#c9a13a", decline: "#6e4462" });
    const infant = ageLooks(0, groups).parts.skull;
    const youngAdult = ageLooks(4, groups).parts.skull;
    const senior = ageLooks(6, groups).parts.skull; // decline, medium risk
    expect(infant.tint).toBe("#5f8a57");
    expect(youngAdult.tint).toBe("#c9a13a");
    expect(senior.tint).toBe("#6e4462");
    expect(senior.amount).toBeGreaterThan(infant.amount!);
  });

  it("returns the selected group's note for the stage, or null when the group has none", () => {
    expect(ageNoteFor(1, "skull")?.note).toMatch(/soft spot closes/);
    expect(ageNoteFor(1, "other")).toBeNull();
  });

  it("scales every limb at every stage, so arms, hands and feet grow with the legs", () => {
    const limbs = ["arm_left", "arm_right", "hand_left", "hand_right", "leg_left", "leg_right", "foot_left", "foot_right"];
    for (let stage = 0; stage < ageStages.length; stage++) {
      for (const limb of limbs) expect(ageNoteFor(stage, limb)?.scale, `${limb} at stage ${stage}`).toBeTypeOf("number");
    }
    // Left and right match, and an infant's limbs are drawn smaller than an adult's.
    expect(ageLooks(0, limbs).parts.arm_left).toEqual(ageLooks(0, limbs).parts.arm_right);
    for (const limb of limbs) expect(ageLooks(0, limbs).parts[limb].scale).toBeLessThan(1);
  });

  it("ages each vertebra and disc as the spine, and each rib as the ribcage: same note, tint and scale", () => {
    const parts = Object.keys(bodySidecar.parts);
    const spine = parts.filter((id) => /^(vertebra|disc)_/.test(id));
    const ribs = parts.filter((id) => id.startsWith("rib_"));
    expect(spine).toHaveLength(24 + 23);
    expect(ribs).toHaveLength(24);
    expect(ageNoteKey("vertebra_c3")).toBe("spine");
    expect(ageNoteKey("disc_l5_s1")).toBe("spine");
    expect(ageNoteKey("rib_12_right")).toBe("ribcage");
    expect(ageNoteKey("spine")).toBe("spine");
    expect(ageNoteKey("skull")).toBe("skull");
    for (let stage = 0; stage < ageStages.length; stage++) {
      const looks = ageLooks(stage, ["spine", "ribcage", ...spine, ...ribs]);
      for (const id of spine) {
        expect(ageNoteFor(stage, id), `${id} at stage ${stage}`).toBe(ageNoteFor(stage, "spine"));
        expect(looks.parts[id], id).toEqual(looks.parts.spine);
      }
      for (const id of ribs) {
        expect(ageNoteFor(stage, id), `${id} at stage ${stage}`).toBe(ageNoteFor(stage, "ribcage"));
        expect(looks.parts[id], id).toEqual(looks.parts.ribcage);
      }
    }
    expect(ageNoteFor(0, "vertebra_t5")?.note).toMatch(/C-shaped curve/);
  });
});
