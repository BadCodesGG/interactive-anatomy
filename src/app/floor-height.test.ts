import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D } from "three";
import { describe, expect, it } from "vitest";
import { FloorHeight } from "./floor-height";

/** A model of two boxes, one unit tall each, standing on y = 0 and y = 3. */
function model() {
  const root = new Object3D();
  const parts = new Map<string, Object3D>();
  for (const [id, y] of [["a", 0], ["b", 3]] as const) {
    const part = new Object3D();
    part.position.y = y + 0.5;
    part.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial()));
    root.add(part);
    parts.set(id, part);
  }
  return { root, parts };
}

describe("FloorHeight", () => {
  it("measures the lowest point of the visible parts", () => {
    const { root, parts } = model();
    expect(new FloorHeight().lowest(root, parts.values(), [0])).toBeCloseTo(0, 9);
  });

  it("does not measure again while the layout key is unchanged", () => {
    const { root, parts } = model();
    const floor = new FloorHeight();
    floor.lowest(root, parts.values(), [0, "x"]);
    // Something moves without the key saying so: the cached answer stands.
    parts.get("a")!.position.y = 10;
    expect(floor.lowest(root, parts.values(), [0, "x"])).toBeCloseTo(0, 9);
  });

  it("measures again when any value of the key changes", () => {
    const { root, parts } = model();
    const floor = new FloorHeight();
    const hidden = new Set<string>();
    floor.lowest(root, parts.values(), [0, hidden]);
    parts.get("a")!.position.y = 10;
    expect(floor.lowest(root, parts.values(), [0.5, hidden])).toBeCloseTo(3, 9);
    parts.get("a")!.visible = false;
    expect(floor.lowest(root, parts.values(), [0.5, new Set(["a"])])).toBeCloseTo(3, 9);
    expect(floor.lowest(root, parts.values(), [0.5, new Set(["a"]), "more"])).toBeCloseTo(3, 9);
  });

  it("measures every call while volatile, and brings the world matrices up to date first", () => {
    const { root, parts } = model();
    const floor = new FloorHeight();
    floor.lowest(root, parts.values(), [0], true);
    parts.get("a")!.position.y = 10;
    // No updateMatrixWorld by the caller: the measure does it, since the key changes in the frame the parts move.
    expect(floor.lowest(root, parts.values(), [0], true)).toBeCloseTo(3, 9);
  });

  it("answers null when nothing is visible", () => {
    const { root, parts } = model();
    for (const p of parts.values()) p.visible = false;
    expect(new FloorHeight().lowest(root, parts.values(), [0])).toBeNull();
  });
});
