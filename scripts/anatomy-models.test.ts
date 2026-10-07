import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { mapHash, mapRegions, readMap } from "./lib/anatomy-map.mjs";
import { ROOT } from "./lib/dev-server.mjs";

/** The JSON chunk of a GLB: enough to read root extras without decoding any geometry. */
function glbJson(file: string) {
  const buf = readFileSync(file);
  const len = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + len).toString("utf8"));
}

describe.each(["brain", "body"] as const)("%s model", (feature) => {
  const map = readMap(feature);
  const sidecar = JSON.parse(readFileSync(path.join(ROOT, "src", "data", `${feature}.sidecar.json`), "utf8"));

  it("has one sidecar part per map region, in map order", () => {
    expect(Object.keys(sidecar.parts)).toEqual(mapRegions(map).map((r) => r.id));
  });

  it("was built from the current map (run npm run models if this fails)", () => {
    const json = glbJson(path.join(ROOT, "public", sidecar.model));
    expect(json.extras?.sourceMap).toBe(mapHash(map));
  });
});

describe("pivot families", () => {
  const plain = { groups: { a: { label: "A", nodesRaw: ["x"] }, b: { label: "B", nodesRaw: ["y"] } } };
  const pivoted = { groups: { a: { label: "A", nodesRaw: ["x"], pivot: "p" }, b: { label: "B", nodesRaw: ["y"], pivot: "p" } } };

  it("reads a region's pivot, or null", () => {
    expect(mapRegions(plain).map((r) => r.pivot)).toEqual([null, null]);
    expect(mapRegions(pivoted).map((r) => r.pivot)).toEqual(["p", "p"]);
  });

  it("changes the map hash when a pivot is added, and leaves a map with no pivot as it was", () => {
    expect(mapHash(pivoted)).not.toBe(mapHash(plain));
    // The hash of a map with no pivots is over [id, nodesRaw] only, as before pivots existed.
    expect(mapHash(plain)).toBe(createHash("sha256").update(JSON.stringify([["a", ["x"]], ["b", ["y"]]])).digest("hex").slice(0, 16));
  });

  it("builds the body's spine and ribcage families on one node origin each, unmoved by quantization", () => {
    const map = readMap("body");
    const sidecar = JSON.parse(readFileSync(path.join(ROOT, "src", "data", "body.sidecar.json"), "utf8"));
    const json = glbJson(path.join(ROOT, "public", sidecar.model));
    const origin = new Map<string, string>();
    for (const r of mapRegions(map)) {
      if (!r.pivot) continue;
      const node = json.nodes.find((n: { name?: string }) => n.name === r.id);
      expect(node, r.id).toBeDefined();
      // The mesh hangs on a child, so the part node keeps the pivot and a scale of 1.
      expect(node.mesh, r.id).toBeUndefined();
      expect(node.children, r.id).toHaveLength(1);
      expect(node.scale, r.id).toBeUndefined();
      const t = JSON.stringify(node.translation);
      expect(origin.get(r.pivot) ?? t, r.id).toBe(t);
      origin.set(r.pivot, t);
    }
    expect([...origin.keys()].sort()).toEqual(["ribcage", "spine"]);
    expect(origin.get("spine")).not.toBe(origin.get("ribcage"));
  });
});
