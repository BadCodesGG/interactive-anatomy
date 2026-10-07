import { readFileSync } from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dequantize } from "@gltf-transform/functions";
import { MeshoptDecoder } from "meshoptimizer";
import { beforeAll, describe, expect, it } from "vitest";
import bodySidecar from "@/data/body.sidecar.json";
import { buildRoute, pointAt, WAYPOINTS } from "./sandwich-tour";

type Box = { min: number[]; max: number[] };

/** Each part's world-space bounding box, read from the built body GLB the way the stage would place it. */
async function partBoxes(): Promise<Map<string, Box>> {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const doc = await io.readBinary(new Uint8Array(readFileSync(path.join(process.cwd(), "public", bodySidecar.model))));
  await doc.transform(dequantize());
  const boxes = new Map<string, Box>();
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const m = node.getWorldMatrix();
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const prim of mesh.listPrimitives()) {
      const a = prim.getAttribute("POSITION")!.getArray()!;
      for (let i = 0; i < a.length; i += 3) {
        for (let j = 0; j < 3; j++) {
          const v = m[j] * a[i] + m[4 + j] * a[i + 1] + m[8 + j] * a[i + 2] + m[12 + j];
          if (v < min[j]) min[j] = v;
          if (v > max[j]) max[j] = v;
        }
      }
    }
    boxes.set(node.getName(), { min, max });
  }
  return boxes;
}

describe("the tour's route against the built body model", () => {
  let boxes: Map<string, Box>;
  beforeAll(async () => {
    boxes = await partBoxes();
  }, 60_000);

  it("keeps every waypoint inside its own part's bounding box (run npm run models, then retune WAYPOINTS, if this fails)", () => {
    WAYPOINTS.forEach((w, i) => {
      const box = boxes.get(w.part);
      expect(box, `${w.part} is in the model`).toBeDefined();
      for (let j = 0; j < 3; j++) {
        expect(w.at[j], `waypoint ${i} (${w.part}) axis ${j} >= min`).toBeGreaterThanOrEqual(box!.min[j]);
        expect(w.at[j], `waypoint ${i} (${w.part}) axis ${j} <= max`).toBeLessThanOrEqual(box!.max[j]);
      }
    });
  });

  it("keeps the whole curve within a small margin of the digestive parts' boxes, so it never wanders out of the body", () => {
    const route = buildRoute();
    const parts = [...new Set(WAYPOINTS.map((w) => w.part))];
    const margin = 0.04;
    for (let s = 0; s <= route.total; s += route.total / 300) {
      const p = pointAt(route, s);
      const inside = parts.some((id) => {
        const b = boxes.get(id)!;
        return [0, 1, 2].every((j) => p[j] >= b.min[j] - margin && p[j] <= b.max[j] + margin);
      });
      expect(inside, `curve point at length ${s.toFixed(3)}`).toBe(true);
    }
  });
});
