"use client";

/**
 * The bolus of the sandwich tour, drawn inside the stage as one of ExplodeStage's scene children. It
 * is the tour's whole scene code, so `tour-gate.tsx` loads it with `import()` only once a visitor
 * starts the tour, and it stays out of the stage chunk.
 *
 * The bolus eases along the curve from `@/lib/sandwich-tour` to the stop of the current step (or
 * jumps there under reduced motion), rides the same breathing as the organ it is inside (`./motion`),
 * follows the body's root scale, and hides while the model is exploded, because the curve runs through
 * the assembled body.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ExplodeStore, Sidecar } from "@/engine/explode";
import { useStageScene } from "@/engine/explode/stage";
import { advance, BOLUS_RADIUS, buildRoute, lumpFactor, pointAt, segmentAt, stepBlend, STEPS, stopsFor, TOUR_HIDDEN, WAYPOINTS } from "@/lib/sandwich-tour";
import { tour } from "@/lib/tour-store";
import { breathPhase, heartPulse, movement } from "./motion";

/** The explode amount above which the bolus hides: the curve is the assembled body's. */
const HIDE_ABOVE_K = 0.02;

const show = (obj: THREE.Object3D, visible: boolean) => {
  obj.visible = visible;
};

const LIGHT = new THREE.Color("#fff1cf");

/** A soft irregular lump of food: a sphere pushed in and out by `lumpFactor`, a little flattened. */
function lumpGeometry(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 40, 28);
  const pos = g.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const f = lumpFactor(v.x, v.y, v.z);
    pos.setXYZ(i, v.x * f, v.y * f * 0.86, v.z * f);
  }
  g.computeVertexNormals();
  return g;
}

export default function TourScene({ store, sidecar, reduced }: { store: ExplodeStore; sidecar: Pick<Sidecar, "parts">; reduced: boolean }) {
  const { root, parts, invalidate } = useStageScene();
  const route = useMemo(() => buildRoute(), []);
  const stops = useMemo(() => stopsFor(route), [route]);
  const tones = useMemo(() => STEPS.map((s) => new THREE.Color(s.tone)), []);
  const geometry = useMemo(() => lumpGeometry(), []);
  // Solid where the lump is in the open; a faint see-through copy on top, so it still reads while it is inside an organ.
  const solid = useMemo(() => new THREE.MeshPhysicalMaterial({ roughness: 0.78, clearcoat: 0.3, clearcoatRoughness: 0.45 }), []);
  const ghost = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.8, transparent: true, opacity: 0.7, emissiveIntensity: 0.45, depthTest: false, depthWrite: false }), []);
  const group = useRef<THREE.Group>(null);
  const at = useRef(stops[Math.min(tour.getState().step, stops.length - 1)]);
  const shiftA = useMemo(() => ({ scale: new THREE.Vector3(), shift: new THREE.Vector3() }), []);
  const shiftB = useMemo(() => ({ scale: new THREE.Vector3(), shift: new THREE.Vector3() }), []);
  const colour = useMemo(() => new THREE.Color(), []);

  useEffect(() => tour.subscribe(() => invalidate()), [invalidate]);

  // The parts in front of the digestive tract step aside. The stage shows and hides whole groups (the system filter) and
  // would show these again, so they are put away every frame; when the tour ends, each returns unless its group is filtered out.
  const aside = useMemo(() => TOUR_HIDDEN.flatMap((id) => (parts.has(id) ? [{ obj: parts.get(id)!, group: sidecar.parts[id]?.group }] : [])), [parts, sidecar]);
  useEffect(
    () => () => {
      const { hidden } = store.getState();
      for (const { obj, group } of aside) show(obj, !(group && hidden.has(group)));
      invalidate();
    },
    [aside, store, invalidate],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      solid.dispose();
      ghost.dispose();
      invalidate();
    },
    [geometry, solid, ghost, invalidate],
  );

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    for (const { obj } of aside) show(obj, false);
    const target = stops[Math.min(tour.getState().step, stops.length - 1)];
    at.current = advance(at.current, target, dt, reduced);

    const p = pointAt(route, at.current);
    g.position.set(p[0], p[1], p[2]);
    if (!reduced) {
      // The organ the bolus is inside breathes (the stomach drops by about a centimetre and a half), so it does too.
      const t = performance.now() / 1000;
      const seg = segmentAt(route, at.current);
      movement(WAYPOINTS[seg.index].part, heartPulse(t), breathPhase(t), shiftA);
      movement(WAYPOINTS[seg.index + 1].part, heartPulse(t), breathPhase(t), shiftB);
      g.position.add(shiftA.shift.lerp(shiftB.shift, seg.fraction));
    }
    const k = root.scale.x;
    g.position.multiplyScalar(k);
    g.scale.setScalar(BOLUS_RADIUS * k);
    g.visible = store.frameK() < HIDE_ABOVE_K;

    const blend = stepBlend(stops, at.current);
    colour.copy(tones[blend.from]).lerp(tones[blend.to], blend.fraction);
    solid.color.copy(colour);
    // The see-through copy is lighter and glows a little, so it keeps its contrast against dark tissue.
    ghost.color.copy(colour).lerp(LIGHT, 0.3);
    ghost.emissive.copy(ghost.color);

    if (!reduced || at.current !== target) invalidate();
  });

  return (
    <group ref={group} raycast={() => null}>
      <mesh geometry={geometry} material={solid} raycast={() => null} />
      <mesh geometry={geometry} material={ghost} renderOrder={10} raycast={() => null} />
    </group>
  );
}
