/**
 * Builds the two anatomy models from the Z-Anatomy source GLBs in assets/anatomy/:
 *
 *   public/models/brain.<hash>.glb  one node per brain-map.json region, from nerves.glb
 *   public/models/body.<hash>.glb   one node per body-map.json group, from skeleton.glb, organs.glb
 *                                   and lymphoid.glb (spleen, thymus, tonsils)
 *
 * Per region, every source node named in the map's `nodesRaw` has its world transform baked into
 * its vertices, and the lot is joined into one primitive with one material. A source node's
 * children count only if the map names them too. Nodes the map leaves out (spinal cord, nerves,
 * the white-matter meshes, the kidneys, the renal pelvis) never reach the output; the licence-
 * restricted ones are also stripped from the committed sources by scripts/strip-sources.mjs. Each
 * model is then normalised (brain centred on the origin, body standing on y = 0), welded, simplified to a triangle budget
 * with borders locked, and Meshopt-compressed.
 *
 * The output name carries a content hash, older copies are deleted, and the matching sidecar's
 * `model` field is rewritten. The map hash goes into the GLB's root extras, so a test can tell
 * when a map changed and the model was not rebuilt.
 *
 * Sources default to assets/anatomy/; set ANATOMY_SRC to read them from elsewhere.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { dequantize, meshopt, simplify, weld } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { mapHash, mapRegions, readMap } from "./lib/anatomy-map.mjs";
import { ROOT } from "./lib/dev-server.mjs";

const SRC = process.env.ANATOMY_SRC ?? path.join(ROOT, "assets", "anatomy");
const MODELS = path.join(ROOT, "public", "models");
const DATA = path.join(ROOT, "src", "data");

// sRGB colours, one per region. Brain: desaturated tissue pinks, greys and cool accents that read
// on the dark page. Body: bone whites for the skeleton, muted anatomical colours for organs.
const BRAIN_COLOURS = {
  frontal: 0xc9959a,
  parietal: 0xb8a3b8,
  temporal: 0xa8b0c4,
  occipital: 0xc2ad98,
  insula: 0xd4a28c,
  cerebellum: 0x9fb3a8,
  brainstem: 0xb9aa9c,
  corpus_callosum: 0xe2dcd2,
  thalamus: 0xc78f9f,
  hypothalamus: 0xd98f86,
  hippocampus: 0xa896c4,
  amygdala: 0xcf8a8a,
  basal_ganglia: 0x9aa7c9,
  ventricles: 0x7fb6bf,
  other: 0xb3a7a0,
};

const BODY_COLOURS = {
  skull: 0xe6dfd0,
  spine: 0xddd5c4,
  ribcage: 0xe2dacb,
  pelvis: 0xd8cfbd,
  shoulder_girdle: 0xe0d8c8,
  arm_left: 0xe4ddcf,
  arm_right: 0xe4ddcf,
  hand_left: 0xdcd4c3,
  hand_right: 0xdcd4c3,
  leg_left: 0xe2dbcc,
  leg_right: 0xe2dbcc,
  foot_left: 0xd9d1c0,
  foot_right: 0xd9d1c0,
  larynx: 0xcfd6d2,
  heart: 0xa4474c,
  lungs: 0xcf979a,
  airway: 0xcdb9a8,
  liver: 0x7e3f36,
  gallbladder: 0x6f8a4f,
  pancreas: 0xd4ab7e,
  stomach: 0xc98b7d,
  small_intestine: 0xd9a08f,
  large_intestine: 0xb9806c,
  bladder: 0xc8ad72,
  thyroid: 0xa95a62,
  oesophagus: 0xb97b70,
  reproductive: 0xb98f8c,
  endocrine: 0xc9a15f,
  mouth_throat: 0xc47f7f,
  other: 0x9c8f84,
  spleen: 0x7a4052,
  thymus: 0xd0b690,
  tonsils: 0xc98590,
  // The split spine and ribcage: a region id `vertebra_c3` takes the colour of its first word (see colourOf).
  vertebra: 0xddd5c4,
  disc: 0xd6dde4,
  rib: 0xe2dacb,
};

/** Sheets that wrap other organs (pleura, omenta) stay see-through so they never hide them. */
const TRANSLUCENT = { body: { other: 0.35 } };

const LAYER_FILES = { skeleton: "skeleton.glb", organs: "organs.glb", lymphoid: "lymphoid.glb" };

const MODELS_SPEC = [
  {
    name: "brain",
    colours: BRAIN_COLOURS,
    sourceOf: () => "nerves.glb",
    targetTris: 180_000,
    // Longest side, model units. The camera's zoom limits are sized for a model a few units across.
    size: 2.2,
    stand: false,
  },
  {
    name: "body",
    colours: BODY_COLOURS,
    sourceOf: (region) => {
      const file = LAYER_FILES[region.layer];
      if (!file) throw new Error(`body group ${region.id} has unknown layer ${region.layer}`);
      return file;
    },
    targetTris: 260_000,
    size: 5,
    stand: true,
  },
];

/** A region's colour: its own id's, else its id's first word (`disc_c2_c3` is a `disc`). */
const colourOf = (colours, id) => colours[id] ?? colours[id.split("_")[0]];

const linear = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255].map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));

async function makeIO() {
  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
    "draco3d.decoder": await draco3d.createDecoderModule(),
  });
}

/** Reads a source GLB, dequantized, with a name -> nodes index. */
async function readSource(io, file) {
  const doc = await io.read(path.join(SRC, file));
  await doc.transform(dequantize());
  const byName = new Map();
  for (const n of doc.getRoot().listNodes()) {
    const list = byName.get(n.getName()) ?? [];
    list.push(n);
    byName.set(n.getName(), list);
  }
  return { file, doc, byName };
}

/** The 3x3 cofactor matrix of a column-major mat4's upper-left block, and its determinant. */
function normalMatrix(m) {
  const [a, b, c, d, e, f, g, h, i] = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
  // Columns of the inverse-transpose: cofactors divided by the determinant.
  const det = a * (e * i - f * h) - d * (b * i - c * h) + g * (b * f - c * e);
  const cof = [e * i - f * h, -(d * i - f * g), d * h - e * g, -(b * i - c * h), a * i - c * g, -(a * h - b * g), b * f - c * e, -(a * f - c * d), a * e - b * d];
  return { n: cof.map((v) => v / det), det };
}

/** Face-weighted vertex normals, for a source primitive that has none. */
function computeNormals(pos, idx) {
  const nor = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
    const u = [pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]];
    const v = [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (const k of [a, b, c]) for (let j = 0; j < 3; j++) nor[k + j] += n[j];
  }
  return nor;
}

/** Every triangle primitive of the named source nodes, in world space, joined into flat arrays. */
function collectRegion(region, source) {
  const pos = [];
  const nor = [];
  const idx = [];
  let base = 0;
  let skipped = 0;
  for (const raw of region.nodesRaw) {
    // Z-Anatomy often wraps a mesh in an empty group node of the same name: the mesh node counts.
    const hits = source.byName.get(raw) ?? [];
    if (!hits.length) throw new Error(`${region.id}: no node "${raw}" in ${source.file}`);
    const withMesh = hits.filter((n) => n.getMesh());
    if (withMesh.length > 1) throw new Error(`${region.id}: "${raw}" names ${withMesh.length} meshes in ${source.file}`);
    if (!withMesh.length) {
      console.warn(`warn ${region.id}: "${raw}" has no mesh of its own`);
      continue;
    }
    const node = withMesh[0];
    const mesh = node.getMesh();
    const m = node.getWorldMatrix();
    const { n: nm, det } = normalMatrix(m);
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMode() !== 4) {
        skipped++;
        continue;
      }
      const p = prim.getAttribute("POSITION").getArray();
      const count = p.length / 3;
      const indices = prim.getIndices()?.getArray() ?? Uint32Array.from({ length: count }, (_, i) => i);
      const n = prim.getAttribute("NORMAL")?.getArray() ?? computeNormals(p, indices);
      for (let i = 0; i < count; i++) {
        const [x, y, z] = [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]];
        pos.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]);
        const [u, v, w] = [n[i * 3], n[i * 3 + 1], n[i * 3 + 2]];
        const nx = nm[0] * u + nm[3] * v + nm[6] * w;
        const ny = nm[1] * u + nm[4] * v + nm[7] * w;
        const nz = nm[2] * u + nm[5] * v + nm[8] * w;
        const l = Math.hypot(nx, ny, nz) || 1;
        nor.push(nx / l, ny / l, nz / l);
      }
      // A mirroring transform (the Z-Anatomy exports mirror left from right) flips the winding.
      for (let t = 0; t < indices.length; t += 3) {
        if (det < 0) idx.push(base + indices[t], base + indices[t + 2], base + indices[t + 1]);
        else idx.push(base + indices[t], base + indices[t + 1], base + indices[t + 2]);
      }
      base += count;
    }
  }
  if (skipped) console.warn(`warn ${region.id}: skipped ${skipped} non-triangle primitive(s)`);
  if (!idx.length) throw new Error(`${region.id}: no triangles`);
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), idx: new Uint32Array(idx) };
}

function bounds(arrays) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const pos of arrays) {
    for (let i = 0; i < pos.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        if (pos[i + j] < min[j]) min[j] = pos[i + j];
        if (pos[i + j] > max[j]) max[j] = pos[i + j];
      }
    }
  }
  return { min, max };
}

const meshTriangles = (mesh) => mesh.listPrimitives().reduce((k, p) => k + (p.getIndices()?.getCount() ?? 0) / 3, 0);
const triangles = (doc) => doc.getRoot().listMeshes().reduce((n, m) => n + meshTriangles(m), 0);

async function build(io, spec, sources) {
  const map = readMap(spec.name);
  const regions = mapRegions(map);
  const geo = regions.map((r) => {
    if (colourOf(spec.colours, r.id) === undefined) throw new Error(`${spec.name}: no colour for region ${r.id}`);
    return collectRegion(r, sources.get(spec.sourceOf(r)));
  });

  // Normalise: uniform scale to `size`, then centre (the body stands on y = 0 instead).
  const { min, max } = bounds(geo.map((g) => g.pos));
  const extent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
  const s = spec.size / extent;
  const shift = [-(min[0] + max[0]) / 2, spec.stand ? -min[1] : -(min[1] + max[1]) / 2, -(min[2] + max[2]) / 2];
  for (const g of geo) for (let i = 0; i < g.pos.length; i++) g.pos[i] = (g.pos[i] + shift[i % 3]) * s;

  // A region's node origin is its own centre, or the centre of its pivot family's joint bounds.
  const pivots = new Map();
  for (const key of new Set(regions.map((r) => r.pivot).filter(Boolean))) {
    const { min: a, max: b } = bounds(regions.flatMap((r, i) => (r.pivot === key ? [geo[i].pos] : [])));
    pivots.set(key, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
  }

  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(spec.name);
  const root = doc.createNode(`${spec.name}_model`);
  scene.addChild(root);
  regions.forEach((r, i) => {
    const g = geo[i];
    // Node origin at the region's own centre, so scaling a part (the age view) scales it in place;
    // or at its pivot family's centre, so the family scales as one.
    const { min: a, max: b } = bounds([g.pos]);
    const c = r.pivot ? pivots.get(r.pivot) : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (let k = 0; k < g.pos.length; k++) g.pos[k] -= c[k % 3];
    const alpha = TRANSLUCENT[spec.name]?.[r.id];
    const mat = doc
      .createMaterial(`${r.id}_mat`)
      .setBaseColorFactor([...linear(colourOf(spec.colours, r.id)), alpha ?? 1])
      .setRoughnessFactor(0.62)
      .setMetallicFactor(0);
    if (alpha !== undefined) mat.setAlphaMode("BLEND").setDoubleSided(true);
    const prim = doc
      .createPrimitive()
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(g.pos).setBuffer(buffer))
      .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(g.nor).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(g.idx).setBuffer(buffer))
      .setMaterial(mat);
    // Mesh names end in _mesh: three gives nodes and meshes one pool of unique names.
    const mesh = doc.createMesh(`${r.id}_mesh`).addPrimitive(prim);
    const part = doc.createNode(r.id).setTranslation(c);
    if (r.pivot) {
      // The mesh goes on a child node: quantization folds each mesh's offset into the node that holds
      // it, which would pull the part's origin back to its own centre. A parent node keeps the pivot.
      part.addChild(doc.createNode("").setMesh(mesh));
    } else part.setMesh(mesh);
    root.addChild(part);
  });

  const source = triangles(doc);
  await doc.transform(weld());
  // Simplify toward the budget; meshopt stops early where the error cap would be exceeded, so a
  // second pass nudges the ratio if the first lands wide.
  let ratio = Math.min(1, spec.targetTris / source);
  for (let pass = 0; pass < 3 && triangles(doc) > spec.targetTris * 1.08; pass++) {
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.004 * (pass + 1), lockBorder: true }));
    ratio = Math.min(1, spec.targetTris / triangles(doc));
  }
  const perNode = root.listChildren().map((n) => [n.getName(), meshTriangles(n.getMesh() ?? n.listChildren()[0].getMesh())]);
  const total = triangles(doc);

  doc.getRoot().setExtras({ sourceMap: mapHash(map), generator: "scripts/build-models.mjs" });
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  const out = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
  const glb = await out.writeBinary(doc);

  const hash = createHash("sha256").update(glb).digest("hex").slice(0, 8);
  const file = `${spec.name}.${hash}.glb`;
  const stale = new RegExp(`^${spec.name}\\.[0-9a-f]{8}\\.glb$`);
  for (const old of readdirSync(MODELS).filter((f) => stale.test(f) && f !== file)) rmSync(path.join(MODELS, old));
  writeFileSync(path.join(MODELS, file), glb);

  const sidecarPath = path.join(DATA, `${spec.name}.sidecar.json`);
  let sidecarNote = "no sidecar yet";
  try {
    const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
    sidecar.model = `/models/${file}`;
    writeFileSync(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`);
    sidecarNote = `src/data/${spec.name}.sidecar.json model -> /models/${file}`;
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }

  console.log(`\nwrote public/models/${file} (${(glb.byteLength / 1024).toFixed(1)} KB, meshopt)`);
  console.log(`  ${regions.length} nodes, ${total.toLocaleString("en")} triangles (from ${source.toLocaleString("en")}, budget ${spec.targetTris.toLocaleString("en")})`);
  for (const [name, tris] of perNode) console.log(`  ${name.padEnd(18)} ${tris.toLocaleString("en").padStart(8)}`);
  console.log(`  ${sidecarNote}`);
}

async function main() {
  const io = await makeIO();
  const files = new Set(["nerves.glb", ...Object.values(LAYER_FILES)]);
  const sources = new Map();
  for (const f of files) sources.set(f, await readSource(io, f));
  for (const spec of MODELS_SPEC) await build(io, spec, sources);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
