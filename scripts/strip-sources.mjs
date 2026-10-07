/**
 * Removes the meshes whose upstream licence is not CC BY-SA from the committed source GLBs in
 * assets/anatomy/, so the repository never ships them.
 *
 * What counts is the `dropped` table in src/data/brain-map.json and body-map.json: every source
 * node named there (kidneys, renal pelvis, inner ear, white matter) is deleted, its children moving
 * up to its parent with their world transform kept. Meshes, accessors and materials nothing uses any
 * more are then pruned. Nothing else is touched: no flatten, join, instance, palette or simplify, no
 * dequantizing, node names and transforms unchanged. A file with nothing to remove is left alone, so the script is safe to rerun.
 *
 *   node scripts/strip-sources.mjs          strip in place and report node counts
 *   node scripts/strip-sources.mjs --check  report only, exit 1 if any dropped node is still present
 *
 * Sources default to assets/anatomy/; set ANATOMY_SRC to use another folder.
 */

import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { prune } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { readMap } from "./lib/anatomy-map.mjs";
import { ROOT } from "./lib/dev-server.mjs";

const SRC = process.env.ANATOMY_SRC ?? path.join(ROOT, "assets", "anatomy");
const CHECK = process.argv.includes("--check");

/** Source node names listed under `dropped` in either map. */
function droppedNames() {
  const names = new Set();
  for (const feature of ["brain", "body"]) {
    for (const entry of Object.values(readMap(feature).dropped ?? {})) {
      // The body map wraps the list as { nodes, reason }; the brain map lists the nodes directly.
      for (const n of Array.isArray(entry) ? entry : entry.nodes) names.add(n.name);
    }
  }
  return names;
}

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const dracoDecoder = await draco3d.createDecoderModule();
const readIO = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.decoder": MeshoptDecoder,
  "draco3d.decoder": dracoDecoder,
});
// Sources are written back the way they are read: Meshopt over quantized attributes.
const writeIO = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });

/** Column-major 4x4 product a * b: the child's matrix under its removed parent. */
function mul(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}

const dropped = droppedNames();
let leftover = 0;

for (const file of readdirSync(SRC).filter((f) => f.endsWith(".glb")).sort()) {
  const doc = await readIO.read(path.join(SRC, file));
  const root = doc.getRoot();
  const before = { nodes: root.listNodes().length, meshes: root.listMeshes().length };
  const hits = root.listNodes().filter((n) => dropped.has(n.getName()));
  if (hits.length === 0) {
    console.log(`${file}: nothing to remove (${before.nodes} nodes, ${before.meshes} meshes)`);
    continue;
  }

  // Delete each hit and its own mesh only. A hit's children are other source meshes (the white
  // matter node parents the fornix and corpus callosum), so they move up to the hit's parent with
  // their world transform unchanged.
  const removed = [];
  for (const node of hits) {
    const parent = node.getParentNode() ?? node.listParents().find((p) => p.propertyType === "Scene");
    for (const child of node.listChildren()) {
      const world = mul(node.getMatrix(), child.getMatrix());
      node.removeChild(child);
      parent.addChild(child);
      child.setMatrix(world);
    }
    removed.push(node.getName());
    node.dispose();
  }
  await doc.transform(prune({ keepLeaves: true, keepAttributes: true }));

  const after = { nodes: root.listNodes().length, meshes: root.listMeshes().length };
  console.log(`${file}: nodes ${before.nodes} -> ${after.nodes}, meshes ${before.meshes} -> ${after.meshes}`);
  console.log(`  removed: ${removed.join(", ")}`);
  if (CHECK) {
    leftover += hits.length;
  } else {
    doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
    writeFileSync(path.join(SRC, file), await writeIO.writeBinary(doc));
  }
}

if (CHECK && leftover > 0) {
  console.error(`${leftover} dropped node(s) still present in the source GLBs. Run: node scripts/strip-sources.mjs`);
  process.exit(1);
}
