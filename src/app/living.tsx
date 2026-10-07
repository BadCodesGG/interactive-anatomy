"use client";

/**
 * Two scene children for the stage (see ExplodeStage's `children`): the studio floor, and the body's
 * own movement. Loaded only in the stage's lazy chunk.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme, type ExplodeStore } from "@/engine/explode";
import { groundHeight } from "@/engine/explode/ground";
import { useStageScene } from "@/engine/explode/stage";
import { FLOOR_LAYER, FloorHeight, showFloorLayer } from "./floor-height";
import { breathPhase, heartPulse, MOVING, movement, PartMotion } from "./motion";
import { Sway } from "./sway";

const FLOOR_VERTEX = /* glsl */ `
varying vec3 vWorld;
void main() {
	vec4 w = modelMatrix * vec4( position, 1.0 );
	vWorld = w.xyz;
	gl_Position = projectionMatrix * viewMatrix * w;
}
`;

/** A fine grid on the floor that fades into the distance: minor lines every `uCell`, a heavier one every fifth. */
const FLOOR_FRAGMENT = /* glsl */ `
varying vec3 vWorld;
uniform vec3 uCentre;
uniform float uCell;
uniform float uRadius;
uniform vec3 uMinor;
uniform vec3 uMajor;
uniform vec2 uAlpha;
uniform float uPremulFix;

float line( vec2 p, float cell ) {
	vec2 q = p / cell;
	vec2 g = abs( fract( q - 0.5 ) - 0.5 ) / max( fwidth( q ), vec2( 1e-4 ) );
	return 1.0 - min( min( g.x, g.y ), 1.0 );
}

void main() {
	vec2 p = vWorld.xz - uCentre.xz;
	float minor = line( p, uCell );
	float major = line( p, uCell * 5.0 );
	float fade = 1.0 - smoothstep( 0.1, 1.0, length( p ) / uRadius );
	fade *= fade;
	float a = max( minor * uAlpha.x, major * uAlpha.y ) * fade;
	vec3 c = mix( uMinor, uMajor, major );
	// With ambient occlusion on, the canvas is drawn through an output pass that encodes sRGB after the blend,
	// on a colour already multiplied by its alpha: a coloured, see-through line would come out far too light.
	// Hand it the linear value that encodes to the colour the page should get.
	if ( uPremulFix > 0.5 ) c = sRGBTransferEOTF( vec4( a * sRGBTransferOETF( vec4( c, 1.0 ) ).rgb, 1.0 ) ).rgb / max( a, 1e-4 );
	gl_FragColor = vec4( c, a );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

/** Line colours and strengths, per theme: warm brown-grey on the cream plate, pale amber on the night one. Low contrast: the grid sits under the figure. */
const FLOOR = {
  light: { minor: "#9c8a70", major: "#7a6750", alpha: [0.24, 0.4] as const },
  dark: { minor: "#a8957a", major: "#c2ad8d", alpha: [0.4, 0.66] as const },
};

/** Sets the floor's blending correction; returns whether it changed. A module function: the React compiler's lint forbids writing a hook's value in a component. */
function setPremulFix(material: THREE.ShaderMaterial, fix: number): boolean {
  if (material.uniforms.uPremulFix.value === fix) return false;
  material.uniforms.uPremulFix.value = fix;
  return true;
}

/**
 * The floor: a shader grid on the ground plane, following the model's lowest point as it is posed. It
 * corrects its blending for the ambient-occlusion output pass, and only while that pass is the one
 * drawing: the pass's frame callback has a positive priority, which R3F counts in `internal.priority`,
 * so the floor reads the pass's real state each frame rather than guessing it from the quality tier
 * (the pass loads lazily, and drops out if it fails).
 */
export function StudioFloor({ store }: { store: ExplodeStore }) {
  const { root, parts, sphere } = useStageScene();
  const theme = useTheme();
  const mesh = useRef<THREE.Mesh>(null);
  const height = useMemo(() => new FloorHeight(), []);
  const r = sphere.radius;
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLOOR_VERTEX,
        fragmentShader: FLOOR_FRAGMENT,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uCentre: { value: sphere.center },
          uCell: { value: r * 0.16 },
          uRadius: { value: r * 3.4 },
          uMinor: { value: new THREE.Color() },
          uMajor: { value: new THREE.Color() },
          uAlpha: { value: new THREE.Vector2() },
          uPremulFix: { value: 0 },
        },
      }),
    [sphere, r],
  );
  useEffect(() => {
    const look = FLOOR[theme];
    material.uniforms.uMinor.value.set(look.minor);
    material.uniforms.uMajor.value.set(look.major);
    material.uniforms.uAlpha.value.set(look.alpha[0], look.alpha[1]);
  }, [material, theme]);
  useEffect(() => () => material.dispose(), [material]);
  const camera = useThree((s) => s.camera);
  useEffect(() => showFloorLayer(camera), [camera]);
  useFrame(({ internal, invalidate }) => {
    if (setPremulFix(material, internal.priority > 0 ? 1 : 0)) invalidate();
    // Measured when the layout changes (the explode tween, the age looks, a filtered group), not every frame.
    const st = store.getState();
    const low = height.lowest(root, parts.values(), [store.frameK(), root.scale.x, st.hidden, st.looks, st.applied], st.applied?.looks !== st.looks);
    // A hair under the shadow catcher, which sits at `groundHeight`, so neither z-fights the other.
    if (mesh.current && low !== null) mesh.current.position.y = groundHeight(low, r) - r * 0.0006;
  });
  return (
    <mesh ref={mesh} layers={FLOOR_LAYER} rotation-x={-Math.PI / 2} position={[sphere.center.x, sphere.center.y - r, sphere.center.z]} renderOrder={-1} raycast={() => null} material={material}>
      <planeGeometry args={[r * 8, r * 8]} />
    </mesh>
  );
}

/**
 * The body's own movement (see ./motion): the heart beats, the lungs and ribcage breathe with the organs
 * below them riding the diaphragm, and the camera sways a few degrees while nobody is holding it.
 * Paused, and every part put back as the stage had it, under reduced motion. The stage draws on demand,
 * so this asks for a frame only while something is moving: the parts (the body), or the sway when it is
 * allowed (`sway`, which a low-quality device does not get, and which waits while a part is picked or the
 * opening fly-in runs). The stage's own `active` still stops it off screen.
 *
 * Each moving part's content sits on a node of its own (a `PartMotion`), so the part node keeps the
 * scale and position the stage gave it. The sway needs the stage's camera update to have run for the
 * frame: this subscribes after the stage's rig, and equal-priority frame callbacks run in the order
 * they subscribed.
 */
export function Living({ store, reduced, sway }: { store: ExplodeStore; reduced: boolean; sway: boolean }) {
  const { parts, invalidate, getControls } = useStageScene();
  const motions = useRef<ReadonlyMap<string, PartMotion>>(new Map());
  const move = useMemo(() => ({ scale: new THREE.Vector3(), shift: new THREE.Vector3() }), []);
  const swaying = useMemo(() => new Sway(), []);

  useEffect(() => {
    const own = new Set(parts.values());
    const made = new Map(MOVING.filter((id) => parts.has(id)).map((id) => [id, new PartMotion(parts.get(id)!, (o) => own.has(o))]));
    for (const m of made.values()) m.attach();
    motions.current = made;
    return () => {
      motions.current = new Map();
      for (const m of made.values()) m.detach();
      invalidate();
    };
  }, [parts, invalidate]);
  useEffect(() => {
    if (!reduced) return;
    for (const m of motions.current.values()) m.release();
    invalidate();
  }, [reduced, invalidate]);

  useFrame(() => {
    if (reduced) return;
    const t = performance.now() / 1000;
    let drawing = false;
    if (motions.current.size > 0) {
      const pulse = heartPulse(t);
      const breath = breathPhase(t);
      for (const [id, m] of motions.current) {
        movement(id, pulse, breath, move);
        m.apply(move.scale, move.shift);
      }
      drawing = true;
    }
    const controls = getControls();
    if (controls) {
      const s = store.getState();
      const allowed = sway && !s.opening && !s.selected;
      swaying.step(t, controls, allowed);
      // Held, the camera is the visitor's and the controls ask for their own frames.
      if (allowed && controls.currentAction === 0) drawing = true;
    }
    if (drawing) invalidate();
  });
  return null;
}
