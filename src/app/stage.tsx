"use client";

import { useState, useSyncExternalStore } from "react";
import { useExplodeStore, type GateRenderProps, type RenderOptions, type Sidecar } from "@/engine/explode";
import ExplodeStage from "@/engine/explode/stage";
import { readQualityEnv } from "@/engine/explode/render";
import { anatomyMaterials, modelKind, tissueTier } from "./anatomy-materials";
import { AgeFit } from "./age-fit";
import { ExplodedFit } from "./exploded-fit";
import { Living, StudioFloor } from "./living";
import { tour } from "@/lib/tour-store";
import { TourGate } from "./tour-gate";

/**
 * Studio lighting for the anatomy models, on the atlas's own grounds. Light: a warm key from above left,
 * two rims behind that draw each part's edge, and the studio's softboxes in the environment, whose long
 * stripes are what a wet coat reflects. Dark: the same rig, the key dimmed so tissue keeps its hue on the
 * night plate. Shadows are warm ink on paper and near black at night.
 */
const PALETTE = {
  light: {
    sky: "#fbf0dd", ground: "#6b5540", hemisphere: 0.12,
    key: "#fff3e0", keyIntensity: 3.0, keyFrom: [-0.9, 1.9, 1.3] as [number, number, number],
    rim: "#f0eeff", rimIntensity: 2.4,
    shadow: "#3a2a1a", shadowOpacity: 0.2,
  },
  dark: {
    sky: "#c9b393", ground: "#2a231b", hemisphere: 0.4,
    key: "#ffe6c4", keyIntensity: 2.2, keyFrom: [-0.9, 1.9, 1.3] as [number, number, number],
    rim: "#e6e2ff", rimIntensity: 2.2,
    shadow: "#0a0704", shadowOpacity: 0.34,
  },
};

/**
 * Tone mapping stays neutral (it keeps hues; ACES and AgX both shift them). The environment is the
 * studio's softboxes: overhead, and two strips behind, so clear coats carry crisp stripes. Ambient
 * occlusion settles the creases (the brain's sulci, organs pressed into the ribcage), the contact
 * shadow grounds the figure on the floor.
 */
const RENDER: Record<"body" | "brain", { light: RenderOptions; dark: RenderOptions }> = {
  body: {
    light: {
      env: "studio",
      studio: { key: 1.1, strips: 1.4, surround: "#7b756b" },
      envIntensity: 0.6,
      toneMapping: "neutral",
      exposure: 0.88,
      ao: { radius: 0.07, intensity: 3, distanceFalloff: 1 },
      shadowMapSize: 2048,
      shadowRadius: 5,
      contact: { opacity: 0.55, blur: 3.5, far: 0.5 },
    },
    dark: {
      env: "studio",
      studio: { key: 1, strips: 1.2, surround: "#2a2620" },
      envIntensity: 1,
      toneMapping: "neutral",
      exposure: 1,
      ao: { radius: 0.05, intensity: 2.4, distanceFalloff: 1 },
      shadowMapSize: 2048,
      shadowRadius: 5,
      contact: { opacity: 0.5, blur: 3, far: 0.5 },
    },
  },
  // A brain is one soft mass of folds: a tighter, stronger occlusion is what makes the sulci read.
  brain: {
    light: {
      env: "studio",
      studio: { key: 1.1, strips: 1.4, surround: "#7b756b" },
      envIntensity: 0.6,
      toneMapping: "neutral",
      exposure: 0.88,
      ao: { radius: 0.035, intensity: 3, distanceFalloff: 1 },
      shadowMapSize: 2048,
      shadowRadius: 5,
      contact: { opacity: 0.55, blur: 3.5, far: 0.5 },
    },
    dark: {
      env: "studio",
      studio: { key: 1, strips: 1.2, surround: "#2a2620" },
      envIntensity: 1,
      toneMapping: "neutral",
      exposure: 1,
      ao: { radius: 0.035, intensity: 3.2, distanceFalloff: 1 },
      shadowMapSize: 2048,
      shadowRadius: 5,
      contact: { opacity: 0.5, blur: 3, far: 0.5 },
    },
  },
};

/**
 * The tour's close-ups on the light plate. The faded skeleton is layers of translucent ivory, and up close the key and the two
 * rims saturate them: the bones go flat cream against the cream ground. While the tour runs, the key and rims are halved and the
 * exposure lowered, so the bones keep their shading; the dark plate has no such problem and the plain view never changes.
 */
const TOUR_LIGHT = { exposure: 0.6, lights: 0.5 };
const TOUR_PALETTE = { ...PALETTE, light: { ...PALETTE.light, keyIntensity: PALETTE.light.keyIntensity * TOUR_LIGHT.lights, rimIntensity: PALETTE.light.rimIntensity * TOUR_LIGHT.lights } };
const TOUR_RENDER = { ...RENDER.body, light: { ...RENDER.body.light, exposure: TOUR_LIGHT.exposure } };
const touring = () => tour.getState().active;

/**
 * View in AR sizes. Both models are in arbitrary units, so each is scaled by its longest side to a real
 * length: the skeleton stands 1.7 m tall (an adult, arms spread); the brain is 0.167 m front to back
 * (the average adult brain is about 16.7 cm long).
 */
const AR = { body: { longestSide: 1.7 }, brain: { longestSide: 0.167 } } as const;

/**
 * The brain's framing as a fraction of the fitted sphere, assembled and exploded, and how far up it sits (of its
 * radius). The assembled brain is one compact mass that the sidecar's 1.35 leaves small; the scatter of its regions needs it.
 */
const BRAIN_FRAME: [number, number] = [1.05, 1.05];
const BRAIN_LIFT = 0.1;

/** The lazy chunk's entry: the canvas, bound to the page's store. Loaded only by stage-client.tsx. */
export default function Stage({ sidecar, opening, active, mobile, reduced, onReady, onFail }: GateRenderProps & { sidecar: Sidecar; opening?: boolean }) {
  const store = useExplodeStore();
  const kind = modelKind(sidecar);
  // What the device says about itself is read once per mount, as the engine's own stage does: the shader tier,
  // and whether the camera sways, both follow from it. A phone or a reduced-data visitor gets the lite tier and no sway.
  const [device] = useState(readQualityEnv);
  const tier = tissueTier(device);
  const closeUp = useSyncExternalStore(tour.subscribe, touring, () => false) && kind === "body";
  return (
    <ExplodeStage sidecar={sidecar} store={store} active={active} mobile={mobile} reduced={reduced} onReady={onReady} onFail={onFail}
        background={{ light: "#efe6d1", dark: "#1f1a14" }}
        accent={{ light: "#8e2b22", dark: "#e0806f" }}
        palette={closeUp ? TOUR_PALETTE : PALETTE}
        render={closeUp ? TOUR_RENDER : RENDER[kind ?? "body"]}
        materials={anatomyMaterials(sidecar, tier)}
        leaders
        frame={kind === "brain" ? BRAIN_FRAME : undefined}
        lift={kind === "brain" ? BRAIN_LIFT : undefined}
        ar={AR[kind ?? "body"]}
        opening={opening}
      >
      {kind && <StudioFloor store={store} />}
      {kind && <Living store={store} reduced={reduced} sway={tier === "full"} />}
      {kind === "body" && <TourGate store={store} sidecar={sidecar} reduced={reduced} />}
      {kind === "brain" && <ExplodedFit store={store} frame={BRAIN_FRAME[1]} lift={BRAIN_LIFT} reduced={reduced} />}
      {kind === "body" && <AgeFit store={store} frame={sidecar.assembly.frame ?? 1} reduced={reduced} />}
    </ExplodeStage>
  );
}
