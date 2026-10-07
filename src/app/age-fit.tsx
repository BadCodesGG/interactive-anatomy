"use client";

/**
 * A scene child for the body: when an age look changes the drawn size of the whole body, the camera
 * follows it in (see lib/age-fit). The stage itself only recentres on a look, at the same distance.
 * Loaded only in the stage's lazy chunk.
 */
import { useEffect } from "react";
import * as THREE from "three";
import type { ExplodeStore } from "@/engine/explode";
import { useStageScene } from "@/engine/explode/stage";
import { ageFitRadius } from "@/lib/age-fit";
import { visibleSphere } from "./visible-sphere";

export function AgeFit({ store, frame, reduced }: { store: ExplodeStore; /** The stage's framing factor (the sidecar's `assembly.frame`, else 1). */ frame: number; reduced: boolean }) {
  const { root, getControls } = useStageScene();
  useEffect(() => {
    const sphere = new THREE.Sphere();
    let last = 1;
    return store.subscribe(() => {
      const st = store.getState();
      const scale = st.applied?.root;
      if (scale === undefined || scale === last) return;
      const controls = getControls();
      // A selected part has its own camera (the stage recentres on it); the body is framed only when none is.
      if (!controls || st.selected) return;
      last = scale;
      if (!visibleSphere(root, sphere)) return;
      sphere.radius = ageFitRadius(sphere.radius * frame, scale);
      void controls.fitToSphere(sphere, !reduced);
    });
  }, [store, root, getControls, frame, reduced]);
  return null;
}
