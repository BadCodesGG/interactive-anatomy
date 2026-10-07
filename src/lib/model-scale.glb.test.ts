import { readFileSync } from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dequantize } from "@gltf-transform/functions";
import { MeshoptDecoder } from "meshoptimizer";
import { beforeAll, describe, expect, it } from "vitest";
import bodySidecar from "@/data/body.sidecar.json";
import brainSidecar from "@/data/brain.sidecar.json";
import { BODY_HEIGHT_CM, BODY_HEIGHT_UNITS, BRAIN_LENGTH_CM, BRAIN_LENGTH_UNITS, CM_PER_UNIT } from "./model-scale";

/** The world-space extent of everything a built GLB draws, per axis. */
async function extent(model: string): Promise<number[]> {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const doc = await io.readBinary(new Uint8Array(readFileSync(path.join(process.cwd(), "public", model))));
  await doc.transform(dequantize());
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const m = node.getWorldMatrix();
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
  }
  return max.map((v, j) => v - min[j]);
}

describe("model scale against the built models", () => {
  let body: number[];
  let brain: number[];
  beforeAll(async () => {
    [body, brain] = await Promise.all([extent(bodySidecar.model), extent(brainSidecar.model)]);
  }, 60_000);

  it("stands the body exactly BODY_HEIGHT_UNITS tall, its longest side", () => {
    expect(body[1]).toBeCloseTo(BODY_HEIGHT_UNITS, 2);
    expect(Math.max(...body)).toBeCloseTo(body[1], 6);
  });

  it("makes the brain's longest side, front to back, BRAIN_LENGTH_UNITS", () => {
    expect(brain[2]).toBeCloseTo(BRAIN_LENGTH_UNITS, 2);
    expect(Math.max(...brain)).toBeCloseTo(brain[2], 6);
  });

  it("derives centimetres per unit from them", () => {
    expect(CM_PER_UNIT.body).toBeCloseTo(BODY_HEIGHT_CM / body[1], 1);
    expect(CM_PER_UNIT.brain).toBeCloseTo(BRAIN_LENGTH_CM / brain[2], 1);
  });
});
