import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DISCS, LEVELS, discId, ribId, vertebraId } from "./body.copy";
import { bodyCopy, bodyPartCount, bodySidecar } from "./body";

const read = (rel: string) => readFileSync(path.join(process.cwd(), rel), "utf8");

describe("bodyPartCount", () => {
  it("is the number of parts in the sidecar: the 33 original regions plus a part per vertebra, disc and rib", () => {
    expect(bodyPartCount).toBe(Object.keys(bodySidecar.parts).length);
    expect(bodyPartCount).toBe(33 + 24 + 23 + 24);
  });

  it("is what the pages say, and no page hard-codes a number of parts", () => {
    const body = read("src/app/body/page.tsx");
    const home = read("src/app/page.tsx");
    for (const [name, src] of [["body page", body], ["chooser", home]] as const) {
      expect(src, name).toContain("bodyPartCount");
      expect(src, name).not.toMatch(/\b(\d+|thirty-three)\s+parts\b/i);
    }
  });
});

describe("the split spine and ribcage", () => {
  const ids = Object.keys(bodySidecar.parts);

  it("has 24 vertebrae, 23 discs (C2-C3 to L5-S1) and 24 ribs, each its own pickable part with a hover-only label", () => {
    expect(LEVELS).toHaveLength(24);
    expect(DISCS).toHaveLength(23);
    expect(DISCS[0]).toEqual(["C2", "C3"]);
    expect(DISCS[22]).toEqual(["L5", "S1"]);
    const split = [
      ...LEVELS.map(vertebraId),
      ...DISCS.map(discId),
      ...Array.from({ length: 12 }, (_, i) => (["left", "right"] as const).map((s) => ribId(i + 1, s))).flat(),
    ];
    expect(split).toHaveLength(71);
    for (const id of split) {
      const part = bodySidecar.parts[id];
      expect(part, id).toBeDefined();
      expect(part.leader, id).toBe("hover");
      expect(part.pickable, id).toBe(true);
      expect(part.group, id).toBe("skeleton");
    }
    expect(ids.filter((id) => bodySidecar.parts[id].leader === "hover").sort()).toEqual([...split].sort());
  });

  it("keeps the spine and ribcage ids as always-labelled parts, so deep links and the age notes keep working", () => {
    for (const id of ["spine", "ribcage"]) {
      expect(bodySidecar.parts[id].leader).toBeUndefined();
      expect(bodySidecar.parts[id].group).toBe("skeleton");
      // The leader label drops a parenthetical, so the plate still reads "Spine" and "Ribcage".
      expect(bodySidecar.parts[id].label.replace(/\s*\(.*\)\s*$/, "")).toBe(id === "spine" ? "Spine" : "Ribcage");
    }
  });

  it("has a copy entry for every part, under the same id and label as the sidecar", () => {
    for (const [id, part] of Object.entries(bodySidecar.parts)) {
      const copy = bodyCopy[part.copy];
      expect(copy, id).toBeDefined();
      expect(copy.id, id).toBe(part.copy);
      expect(copy.label, id).toBe(part.label);
      // The older entries file their organs under a body system; the skeleton's own say "skeleton".
      if (part.group === "skeleton") expect(copy.group, id).toBe("skeleton");
    }
  });

  it("names the true, false and floating ribs, and the atlas and axis", () => {
    expect(bodyCopy.rib_3_left.stats).toContainEqual({ label: "Type", value: "True rib" });
    expect(bodyCopy.rib_7_right.stats).toContainEqual({ label: "Type", value: "True rib" });
    expect(bodyCopy.rib_8_left.stats).toContainEqual({ label: "Type", value: "False rib" });
    expect(bodyCopy.rib_10_right.stats).toContainEqual({ label: "Type", value: "False rib" });
    expect(bodyCopy.rib_11_left.stats).toContainEqual({ label: "Type", value: "Floating rib" });
    expect(bodyCopy.rib_12_right.stats).toContainEqual({ label: "Type", value: "Floating rib" });
    expect(bodyCopy.vertebra_c1.label).toBe("Vertebra C1 (atlas)");
    expect(bodyCopy.vertebra_c2.label).toBe("Vertebra C2 (axis)");
    expect(bodyCopy.vertebra_t1.function).toMatch(/first rib/);
  });

  it("writes no em dash in any copy", () => {
    for (const [id, c] of Object.entries(bodyCopy)) expect(JSON.stringify(c), id).not.toContain("\u2014");
  });
});
