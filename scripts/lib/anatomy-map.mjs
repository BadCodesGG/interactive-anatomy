/**
 * The region maps in src/data (brain-map.json, body-map.json), read the same way by
 * scripts/build-models.mjs and by the test that checks a built model is not stale.
 *
 * A map lists, per region, the source node names that make it up. Only `nodesRaw` is used: the
 * maps' `nodes` keys come from a stricter sanitiser than three's and do not match the GLBs.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./dev-server.mjs";

export const MAPS = {
  brain: path.join(ROOT, "src", "data", "brain-map.json"),
  body: path.join(ROOT, "src", "data", "body-map.json"),
};

/**
 * `[{ id, label, layer, nodesRaw, pivot }]` in map order. The brain map calls its regions `lobes`.
 * `pivot` (optional, a shared key) puts every region that names it on one node origin, the centre of
 * their joint bounds, so a part scaled or moved for its family (the age view, breathing) does it about
 * the family's centre and the parts stay together. Without it a region's origin is its own centre.
 */
export function mapRegions(map) {
  const table = map.lobes ?? map.groups;
  if (!table || typeof table !== "object") throw new Error("map has neither `lobes` nor `groups`");
  return Object.entries(table).map(([id, r]) => ({ id, label: r.label, layer: r.layer ?? null, nodesRaw: r.nodesRaw, pivot: r.pivot ?? null }));
}

/**
 * A short hash of what a model is built from: region ids, their source node names and pivots, in
 * order. A region with no pivot hashes as it did before pivots existed, so a map that uses none
 * keeps its hash (and its built model stays current).
 */
export function mapHash(map) {
  const basis = mapRegions(map).map((r) => (r.pivot ? [r.id, r.nodesRaw, r.pivot] : [r.id, r.nodesRaw]));
  return createHash("sha256").update(JSON.stringify(basis)).digest("hex").slice(0, 16);
}

export function readMap(feature) {
  return JSON.parse(readFileSync(MAPS[feature], "utf8"));
}
