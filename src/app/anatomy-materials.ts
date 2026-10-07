/**
 * The atlas's surfaces: what each part is made of, as far as light is concerned.
 *
 *  - bone: ivory, satin, porous (pits and mottling in a shader patch, see ./tissue-shader)
 *  - fibrocartilage (the intervertebral discs): paler than bone, bluish white, soft and slightly translucent
 *  - muscle (heart, mouth and throat): deep red with fibre grain, a wet clear coat
 *  - organ: moist, subsurface-looking (light wraps past the terminator in the tissue's own colour)
 *  - lung: pink, spongy, soft
 *  - brain: pinkish grey, wet, damp rather than dripping; the lobes keep a trace of their teaching colour
 *  - membrane: membranes and fluid spaces, the glossiest thing on the plate
 *
 * Each part keeps the colour it was built with (the brain, only partly, see BRAIN_BASE); the surface
 * changes. Imports three through the material presets, so like the stage it belongs to the lazy stage chunk.
 */
import { Color, type Material, type Mesh, type MeshPhysicalMaterial } from "three";
import type { MaterialHook } from "@/engine/explode/materials";
import { setMaterial, tissue } from "@/engine/explode/materials";
import { readQualityEnv, resolveQuality } from "@/engine/explode/render";
import type { Sidecar } from "@/engine/explode";
import { CM_PER_UNIT } from "@/lib/model-scale";
import { applyTissue, PLAIN, type Tier, type TissueSpec } from "./tissue-shader";

export type Surface = "bone" | "fibrocartilage" | "muscle" | "organ" | "lung" | "brain" | "membrane";

/** Part ids that are membranes or fluid spaces, per model. */
const MEMBRANES: Record<"body" | "brain", ReadonlySet<string>> = {
  body: new Set(["other"]),
  brain: new Set(["ventricles"]),
};

/** Body parts whose tissue is muscle: the myocardium, and the tongue and pharynx. */
const MUSCLE: ReadonlySet<string> = new Set(["heart", "mouth_throat"]);

/** An intervertebral disc's part id (`disc_c2_c3`): fibrocartilage, not bone. */
const isDisc = (partId: string) => partId.startsWith("disc_");

/** The surface for one part, or null for a part this module leaves as built. */
export function surfaceFor(model: "body" | "brain", partId: string, group: string | undefined): Surface | null {
  if (MEMBRANES[model].has(partId)) return "membrane";
  if (model === "brain") return "brain";
  if (isDisc(partId)) return "fibrocartilage";
  if (group === "skeleton") return "bone";
  if (partId === "lungs") return "lung";
  return MUSCLE.has(partId) ? "muscle" : "organ";
}

/** Which anatomy model a sidecar is, from its glb URL (`/models/body.<hash>.glb`); null for the fixture. */
export function modelKind(sidecar: Pick<Sidecar, "model">): "body" | "brain" | null {
  const name = sidecar.model.split("/").pop() ?? "";
  if (name.startsWith("body.")) return "body";
  if (name.startsWith("brain.")) return "brain";
  return null;
}

/** A phone or a reduced-data visitor gets the lite shader tier. */
export function tissueTier(env = readQualityEnv()): Tier {
  return resolveQuality("auto", env) === "high" ? "full" : "lite";
}

/** The procedural detail of each surface. Lengths are cm of the real organ. */
export const SPECS: Record<Surface, TissueSpec> = {
  // Clean ivory from a distance: the mottling is faint and the pits fade with screen size, so only a close view sees the pores.
  bone: { ...PLAIN, colVar: 0.07, colFreq: 0.7, tone: [0.94, 0.88, 0.76], toneAmt: 0.12, bump: 0.25, bumpFreq: 4, rough: 0.12, pit: 0.14, sssWrap: 0.25, sssTint: [0.5, 0.32, 0.16], sssRim: 0.03 },
  // Smooth, cool and faintly glowing: a pale, even tissue with a little light passing through it.
  fibrocartilage: { ...PLAIN, colVar: 0.05, colFreq: 0.8, bump: 0.08, bumpFreq: 3, rough: 0.1, sssWrap: 0.5, sssTint: [0.7, 0.82, 1], sssRim: 0.16 },
  muscle: { ...PLAIN, colVar: 0.36, colFreq: 0.9, tone: [1.25, 0.8, 0.72], toneAmt: 0.4, bump: 0.35, bumpFreq: 3, rough: 0.25, sssWrap: 0.5, sssTint: [1, 0.25, 0.16], sssRim: 0.12, fibre: 2, stretch: 5, streak: 0.55 },
  // Soft organs: a deep colour with lobules (the liver's, a fine polygon mosaic) under a wet capsule.
  organ: { ...PLAIN, colVar: 0.26, colFreq: 0.5, tone: [1.12, 0.92, 0.84], toneAmt: 0.35, bump: 0.22, bumpFreq: 2.5, rough: 0.2, cell: 0.06, cellFreq: 1.6, sssWrap: 0.6, sssTint: [1, 0.34, 0.2], sssRim: 0.1 },
  // Alveolar: faint, warped, uneven lobule borders (mottling, not a line pattern) and a fine grey-pink speckle, on a spongy, barely coated surface.
  lung: { ...PLAIN, colVar: 0.3, colFreq: 0.9, tone: [0.82, 0.78, 0.84], toneAmt: 0.5, bump: 0.3, bumpFreq: 5, rough: 0.15, cell: 0.1, cellFreq: 0.9, speck: 0.55, sssWrap: 0.7, sssTint: [1, 0.45, 0.4], sssRim: 0.14 },
  brain: { ...PLAIN, colVar: 0.22, colFreq: 0.7, tone: [1.05, 0.93, 0.92], toneAmt: 0.4, bump: 0.45, bumpFreq: 3.5, rough: 0.25, sssWrap: 0.55, sssTint: [1, 0.5, 0.45], sssRim: 0.08 },
  // Thin and see-through: little of its own colour, and a glow at grazing angles where the light passes through the edge.
  membrane: { ...PLAIN, colVar: 0.12, colFreq: 0.8, bump: 0.12, bumpFreq: 3, rough: 0.3, sssWrap: 0.4, sssTint: [1, 0.58, 0.46], sssRim: 0.4 },
};

/** A part's own look where the model's colour, opacity or gloss is not its tissue's: a deep, glossy liver, and a membrane that is a thin pink-tan film. */
interface Own {
  color?: string;
  opacity?: number;
  roughness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  sheen?: number;
}
const OVERRIDES: Record<"body" | "brain", Record<string, Own>> = {
  body: {
    // Deep reddish brown under a glossy capsule: a high, tight coat. The albedo is darker than the brown it should look, since the key lights it hard.
    liver: { color: "#5a2019", roughness: 0.4, clearcoat: 0.85, clearcoatRoughness: 0.07, sheen: 0.12 },
    other: { color: "#d6ad98", opacity: 0.2 },
  },
  brain: {},
};

/** A brain is pinkish grey; each region keeps this much of the colour it was built with (its teaching colour comes back on hover, see src/data/brain-colours.ts). */
const BRAIN_BASE = "#c2a69e";
const BRAIN_KEEPS = 0.15;

/** The model's bone is a near white; most of the way to this, it is a clean ivory. */
const IVORY = "#cdbd96";

/** A disc is paler than the ivory bone around it and leans blue: fibrocartilage is a bluish white. */
const BLUISH_WHITE = "#dde6f0";
/** How much of a disc's light gets through, and how far the model's own colour survives. */
const DISC_OPACITY = 0.86;
const DISC_KEEPS = 0.2;

function build(surface: Surface, color: MeshPhysicalMaterial["color"]): MeshPhysicalMaterial {
  const m = tissue(color);
  switch (surface) {
    case "bone":
      // Satin: a whisper of fibre sheen would frost pale bone, so none; a soft coat gives the crisp studio stripes.
      m.sheen = 0;
      m.roughness = 0.52;
      m.clearcoat = 0.22;
      m.clearcoatRoughness = 0.36;
      m.color.lerp(new Color(IVORY), 0.55);
      break;
    case "fibrocartilage":
      // Softer than bone: a rougher, barely coated surface with a little sheen, like damp cartilage.
      m.sheen = 0.25;
      m.sheenRoughness = 0.6;
      m.roughness = 0.62;
      m.clearcoat = 0.12;
      m.clearcoatRoughness = 0.5;
      m.color.lerp(new Color(BLUISH_WHITE), 1 - DISC_KEEPS);
      break;
    case "muscle":
      m.roughness = 0.5;
      m.clearcoat = 0.6;
      m.clearcoatRoughness = 0.16;
      m.sheen = 0.6;
      m.sheenRoughness = 0.45;
      break;
    case "organ":
      m.roughness = 0.5;
      m.clearcoat = 0.5;
      m.clearcoatRoughness = 0.15;
      m.sheen = 0.35;
      break;
    case "lung":
      m.roughness = 0.64;
      m.clearcoat = 0.12;
      m.clearcoatRoughness = 0.4;
      m.sheen = 1;
      m.sheenRoughness = 0.6;
      break;
    case "brain":
      m.roughness = 0.5;
      m.clearcoat = 0.55;
      m.clearcoatRoughness = 0.18;
      m.sheen = 0.6;
      m.color.lerp(new Color(BRAIN_BASE), 1 - BRAIN_KEEPS);
      break;
    case "membrane":
      m.sheen = 0.3;
      m.roughness = 0.28;
      m.clearcoat = 0.9;
      m.clearcoatRoughness = 0.08;
      break;
  }
  return m;
}

/** Carries over what the model's own material decided and the stage relies on: colour, and translucency. */
function surface(mesh: Mesh, id: string, kind: Surface, model: "body" | "brain", tier: Tier): void {
  const src = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as Material & Partial<MeshPhysicalMaterial>;
  if (!src?.color) return;
  const own = OVERRIDES[model][id];
  const next = build(kind, own?.color ? new Color(own.color) : src.color);
  if (own?.roughness !== undefined) next.roughness = own.roughness;
  if (own?.clearcoat !== undefined) next.clearcoat = own.clearcoat;
  if (own?.clearcoatRoughness !== undefined) next.clearcoatRoughness = own.clearcoatRoughness;
  if (own?.sheen !== undefined) next.sheen = own.sheen;
  next.opacity = own?.opacity ?? src.opacity;
  next.transparent = src.transparent;
  next.side = src.side;
  next.depthWrite = src.depthWrite;
  if (kind === "fibrocartilage") {
    // Slightly see-through, so the nucleus inside and the bone beside it show faintly; it still writes depth so AO and picking treat it as a solid.
    next.opacity = DISC_OPACITY;
    next.transparent = true;
  }
  // The meshes are quantised: `position` is -1 to 1 across the part and the node's scale is its size, so
  // the scale over the model's unit is how many cm one unit of `position` is.
  if (SPECS[kind] !== PLAIN) applyTissue(next, SPECS[kind], tier, mesh.scale.x * CM_PER_UNIT[model]);
  setMaterial(mesh, next);
}

const forModel = (sidecar: Sidecar, model: "body" | "brain", tier: Tier): MaterialHook => (mesh, id) => {
  const kind = surfaceFor(model, id, sidecar.parts[id]?.group);
  if (kind) surface(mesh, id, kind, model, tier);
};

const hooks = new WeakMap<Sidecar, Map<Tier, MaterialHook | undefined>>();

/**
 * The `materials` hook for a sidecar at a shader tier; the same function every call with the same
 * arguments, since the stage reloads if it changes. The tier is the caller's to decide once (a stage
 * reads the device once per mount): the hook runs for every mesh of a model, and must not ask the
 * browser each time.
 */
export function anatomyMaterials(sidecar: Sidecar, tier: Tier = tissueTier()): MaterialHook | undefined {
  let byTier = hooks.get(sidecar);
  if (!byTier) hooks.set(sidecar, (byTier = new Map()));
  if (!byTier.has(tier)) {
    const kind = modelKind(sidecar);
    byTier.set(tier, kind ? forModel(sidecar, kind, tier) : undefined);
  }
  return byTier.get(tier);
}
