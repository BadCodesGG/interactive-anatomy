import { describe, expect, it, vi } from "vitest";
import { DoubleSide, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, BoxGeometry } from "three";
import { bodySidecar } from "@/data/body";
import { brainSidecar } from "@/data/brain";
import { fixtureSidecar } from "@/data/fixture";
import { anatomyMaterials, modelKind, SPECS, surfaceFor, tissueTier } from "./anatomy-materials";

const meshOf = (color: number, extra: Partial<MeshStandardMaterial> = {}) =>
  new Mesh(new BoxGeometry(), Object.assign(new MeshStandardMaterial({ color }), extra));

describe("modelKind", () => {
  it("reads the anatomy model from the glb name, and leaves the fixture alone", () => {
    expect(modelKind(bodySidecar)).toBe("body");
    expect(modelKind(brainSidecar)).toBe("brain");
    expect(modelKind(fixtureSidecar)).toBeNull();
  });
});

describe("surfaceFor", () => {
  it("gives every skeleton part bone but the discs, which are fibrocartilage, the heart and the mouth muscle, the lungs their own, and every other body part a wet organ", () => {
    for (const [id, part] of Object.entries(bodySidecar.parts)) {
      const expected =
        id === "other"
          ? "membrane"
          : id.startsWith("disc_")
            ? "fibrocartilage"
            : part.group === "skeleton"
              ? "bone"
              : id === "lungs"
                ? "lung"
                : id === "heart" || id === "mouth_throat"
                  ? "muscle"
                  : "organ";
      expect(surfaceFor("body", id, part.group), id).toBe(expected);
    }
  });

  it("makes the brain damp and its fluid spaces glossy", () => {
    expect(surfaceFor("brain", "frontal", undefined)).toBe("brain");
    expect(surfaceFor("brain", "ventricles", undefined)).toBe("membrane");
  });
});

describe("anatomyMaterials", () => {
  it("returns the same function every call (the stage reloads the model if it changes) and none for the fixture", () => {
    expect(anatomyMaterials(bodySidecar)).toBe(anatomyMaterials(bodySidecar));
    expect(anatomyMaterials(brainSidecar)).toBe(anatomyMaterials(brainSidecar));
    expect(anatomyMaterials(fixtureSidecar)).toBeUndefined();
  });

  it("keeps an organ's colour and lays a physical surface over it: bone matte, organs wet", () => {
    const hook = anatomyMaterials(bodySidecar)!;
    const bone = meshOf(0xd8c8b0);
    const organ = meshOf(0xc9803a);
    hook(bone, "skull");
    hook(organ, "stomach");
    const b = bone.material as MeshPhysicalMaterial;
    const l = organ.material as MeshPhysicalMaterial;
    expect(b.isMeshPhysicalMaterial && l.isMeshPhysicalMaterial).toBe(true);
    expect(l.color.getHex()).toBe(new MeshStandardMaterial({ color: 0xc9803a }).color.getHex());
    expect(b.sheen).toBe(0);
    expect(l.sheen).toBeGreaterThan(0.2);
    expect(l.clearcoat).toBeGreaterThan(b.clearcoat);
    expect(l.roughness).toBeLessThan(b.roughness);
  });

  it("makes a disc paler, bluer, softer and a little see-through next to the bone around it", () => {
    const hook = anatomyMaterials(bodySidecar)!;
    const bone = meshOf(0xddd5c4);
    const disc = meshOf(0xd6dde4);
    hook(bone, "vertebra_t6");
    hook(disc, "disc_t6_t7");
    const b = bone.material as MeshPhysicalMaterial;
    const d = disc.material as MeshPhysicalMaterial;
    expect(d.isMeshPhysicalMaterial).toBe(true);
    // Paler: more light overall. Bluish: blue leads red, where the ivory bone leads the other way.
    const light = (m: MeshPhysicalMaterial) => m.color.r + m.color.g + m.color.b;
    expect(light(d)).toBeGreaterThan(light(b));
    expect(d.color.b).toBeGreaterThan(d.color.r);
    expect(b.color.b).toBeLessThan(b.color.r);
    // Softer: rougher and less coated. Translucent, but only slightly.
    expect(d.roughness).toBeGreaterThan(b.roughness);
    expect(d.clearcoat).toBeLessThan(b.clearcoat);
    expect(d.transparent).toBe(true);
    expect(d.opacity).toBeGreaterThan(0.7);
    expect(d.opacity).toBeLessThan(1);
    expect(b.transparent).toBe(false);
    expect(SPECS.fibrocartilage.sssTint[2]).toBeGreaterThan(SPECS.fibrocartilage.sssTint[0]);
  });

  it("makes the body's membranes a thinner, pink-tan film, and keeps their blending and sidedness", () => {
    const hook = anatomyMaterials(bodySidecar)!;
    const membrane = meshOf(0xb0a0a0, { opacity: 0.35, transparent: true, side: DoubleSide });
    hook(membrane, "other");
    const m = membrane.material as MeshPhysicalMaterial;
    expect([m.transparent, m.side]).toEqual([true, DoubleSide]);
    expect(m.opacity).toBeLessThan(0.35);
    expect(m.color.r).toBeGreaterThan(m.color.b);
    expect(m.clearcoat).toBeGreaterThan(0.5);
  });

  it("leaves a brain's fluid spaces their own opacity", () => {
    const vent = meshOf(0x7fb6bf, { opacity: 0.5, transparent: true });
    anatomyMaterials(brainSidecar)!(vent, "ventricles");
    expect((vent.material as MeshPhysicalMaterial).opacity).toBe(0.5);
  });

  it("gives the liver a deep reddish brown and a tighter, higher coat than the other organs", () => {
    const hook = anatomyMaterials(bodySidecar)!;
    const liver = meshOf(0xf0c060);
    const stomach = meshOf(0xf0c060);
    hook(liver, "liver");
    hook(stomach, "stomach");
    const l = liver.material as MeshPhysicalMaterial;
    const s = stomach.material as MeshPhysicalMaterial;
    expect(l.color.r).toBeGreaterThan(l.color.g * 2);
    expect(l.color.r).toBeLessThan(0.3);
    expect(l.clearcoat).toBeGreaterThan(s.clearcoat);
    expect(l.clearcoatRoughness).toBeLessThan(s.clearcoatRoughness);
  });

  it("takes bone from near white to ivory, and leaves the colour of every soft organ as built", () => {
    const hook = anatomyMaterials(bodySidecar)!;
    const bone = meshOf(0xf2f0ea);
    hook(bone, "skull");
    const white = new MeshStandardMaterial({ color: 0xf2f0ea }).color;
    const b = (bone.material as MeshPhysicalMaterial).color;
    expect(b.b).toBeLessThan(white.b);
    expect(b.r).toBeGreaterThan(b.b);
    for (const id of ["heart", "lungs", "stomach", "mouth_throat"]) {
      const organ = meshOf(0xc9803a);
      hook(organ, id);
      expect((organ.material as MeshPhysicalMaterial).color.getHex(), id).toBe(new MeshStandardMaterial({ color: 0xc9803a }).color.getHex());
    }
  });

  it("makes the brain pinkish grey but keeps a trace of each lobe's colour", () => {
    const hook = anatomyMaterials(brainSidecar)!;
    const blue = meshOf(0x4a6fd0);
    const green = meshOf(0x4fae6a);
    hook(blue, "temporal");
    hook(green, "cerebellum");
    const [b, g] = [blue, green].map((m) => (m.material as MeshPhysicalMaterial).color);
    // Pinkish: red leads. Not the same: the lobes stay tellable apart.
    expect(b.r).toBeGreaterThan(b.b * 0.8);
    expect(b.getHex()).not.toBe(g.getHex());
    expect(b.getHex()).not.toBe(new MeshStandardMaterial({ color: 0x4a6fd0 }).color.getHex());
  });

  it("patches every surface, membranes included, with its procedural detail", () => {
    const hook = anatomyMaterials(bodySidecar)!;
    const keyOf = (id: string) => {
      const m = meshOf(0xc9803a);
      hook(m, id);
      return (m.material as MeshPhysicalMaterial).customProgramCacheKey();
    };
    for (const id of ["skull", "heart", "lungs", "liver", "other"]) expect(keyOf(id), id).toMatch(/^anatomy-tissue:(full|lite)$/);
  });

  it("gives muscle its fibres, bone its pits, and no surface anything it has no use for", () => {
    expect(SPECS.muscle.fibre).toBe(2);
    expect(SPECS.muscle.stretch).toBeGreaterThan(1);
    expect(SPECS.bone.pit).toBeGreaterThan(0);
    // Clean at body scale: bone's mottling is fainter than any soft tissue's.
    for (const kind of ["muscle", "organ", "lung", "brain"] as const) expect(SPECS.bone.colVar, kind).toBeLessThan(SPECS[kind].colVar);
    // The lung has the lobular pattern and the speckle; the liver a finer mosaic of lobules.
    expect(SPECS.lung.cell).toBeGreaterThan(SPECS.organ.cell);
    expect(SPECS.lung.speck).toBeGreaterThan(0);
    expect(SPECS.membrane.sssRim).toBeGreaterThan(SPECS.organ.sssRim);
    for (const kind of ["organ", "lung", "brain", "muscle", "membrane"] as const) {
      expect(SPECS[kind].pit, kind).toBe(0);
      expect(SPECS[kind].sssWrap, kind).toBeGreaterThan(0);
    }
  });

  it("uses the lite shader tier on a phone or with reduced data, and the full one otherwise", () => {
    expect(tissueTier({ coarse: false, reducedData: false })).toBe("full");
    expect(tissueTier({ coarse: true, reducedData: false })).toBe("lite");
    expect(tissueTier({ coarse: false, reducedData: true })).toBe("lite");
  });

  it("never asks the browser about the device while a model's meshes pass through: the tier is the caller's", () => {
    const matchMedia = vi.fn(() => ({ matches: true }));
    vi.stubGlobal("window", { matchMedia });
    try {
      const hook = anatomyMaterials(bodySidecar, "lite")!;
      const keys = new Set<string>();
      for (let i = 0; i < 25; i++) {
        const m = meshOf(0xc9803a);
        hook(m, "stomach");
        keys.add((m.material as MeshPhysicalMaterial).customProgramCacheKey());
      }
      expect(matchMedia).not.toHaveBeenCalled();
      expect([...keys]).toEqual(["anatomy-tissue:lite"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("keeps one hook per sidecar and tier, so a stage that reads its tier once never reloads its model", () => {
    expect(anatomyMaterials(bodySidecar, "lite")).toBe(anatomyMaterials(bodySidecar, "lite"));
    expect(anatomyMaterials(bodySidecar, "full")).toBe(anatomyMaterials(bodySidecar, "full"));
    expect(anatomyMaterials(bodySidecar, "lite")).not.toBe(anatomyMaterials(bodySidecar, "full"));
    expect(anatomyMaterials(fixtureSidecar, "lite")).toBeUndefined();
  });

  it("skips a mesh whose material carries no colour to keep", () => {
    const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    (mesh.material as { color?: unknown }).color = undefined;
    const before = mesh.material;
    anatomyMaterials(bodySidecar)!(mesh, "skull");
    expect(mesh.material).toBe(before);
  });
});
