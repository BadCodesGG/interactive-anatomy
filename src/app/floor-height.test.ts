import { BoxGeometry, type Camera, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { ContactShadow } from "@/engine/explode/contact-shadow";
import { FLOOR_LAYER, FloorHeight, showFloorLayer } from "./floor-height";

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

describe("the floor's layer", () => {
  it("is drawn by the stage camera and left out of the contact shadow's depth pass", () => {
    const floor = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
    floor.layers.set(FLOOR_LAYER);
    const camera = new PerspectiveCamera();
    const contact = new ContactShadow(1, new Vector3(), { opacity: 0.5, blur: 2, far: 0.5 });
    try {
      // The depth pass renders through the shadow's own camera.
      const depthCamera = (contact as unknown as { camera: Camera }).camera;
      const undo = showFloorLayer(camera);
      expect(floor.layers.test(camera.layers)).toBe(true);
      expect(floor.layers.test(depthCamera.layers)).toBe(false);
      undo();
      expect(floor.layers.test(camera.layers)).toBe(false);
    } finally {
      contact.dispose();
    }
  });

  it("leaves the camera's layer on when something else had already enabled it", () => {
    const camera = new PerspectiveCamera();
    camera.layers.enable(FLOOR_LAYER);
    showFloorLayer(camera)();
    expect(camera.layers.isEnabled(FLOOR_LAYER)).toBe(true);
  });

  it("is not the default layer", () => {
    expect(FLOOR_LAYER).not.toBe(0);
  });
});
