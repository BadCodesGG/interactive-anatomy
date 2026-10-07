"use client";

/**
 * A scene child for the brain: a region picked while the brain is exploded leaves the whole pose in
 * frame. The stage's own pick flies to the part, which is right for a body but, on a brain whose
 * pieces scatter across the plate, pushes the rest of them off its edge. Loaded only in the stage's lazy chunk.
 *
 * The refit runs in the next frame, not inside the store's notification: the stage's own pick
 * handler runs synchronously in that notification, so by the time a frame runs it has already
 * issued its fly-to and this is the last camera move, whatever order the two subscribed in. The stage
 * also recentres on the picked part when a look settles (`applied`), a moment after the pick, so that
 * settle is a trigger too (see `picksExploded`); without it the pose ends up centred on the part.
 */
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ExplodeStore } from "@/engine/explode";
import { useStageScene } from "@/engine/explode/stage";
import { fitPose, picksExploded } from "./fit-pose";
import { visibleSphere } from "./visible-sphere";

const sphere = new THREE.Sphere();

export function ExplodedFit({ store, frame, lift, reduced }: { store: ExplodeStore; /** The stage's framing factor (the sidecar's `assembly.frame`, else 1). */ frame: number; /** The stage's `lift` prop: how far up the framed pose sits, of its radius. */ lift: number; reduced: boolean }) {
  const { root, getControls, invalidate } = useStageScene();
  const pending = useRef(false);
  useEffect(() => {
    let prev = store.getState();
    return store.subscribe(() => {
      const st = store.getState();
      if (picksExploded(prev, st, store.frameK())) {
        pending.current = true;
        invalidate();
      }
      prev = st;
    });
  }, [store, invalidate]);
  useFrame(() => {
    if (!pending.current) return;
    pending.current = false;
    const controls = getControls();
    if (!controls || !visibleSphere(root, sphere)) return;
    sphere.radius *= frame;
    fitPose(controls, sphere, lift, !reduced);
  });
  return null;
}
