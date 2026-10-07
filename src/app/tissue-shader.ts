/**
 * What three's physical material cannot do for tissue on its own, added as a shader patch: the anatomy
 * meshes carry no UVs (and no maps), so every detail is procedural, in the mesh's own object space.
 *
 *  - colour mottling: fractal noise on the albedo, plus a second, warmer or paler tone patched in
 *  - micro normal detail: the gradient of the same noise tilts the shading normal, and only that one:
 *    the clear coat keeps the smooth surface normal, so a wet coat lies over a textured tissue
 *  - roughness variation: wet and dry patches, so a highlight breaks up instead of being one smooth blob
 *  - fibre streaks: the noise is stretched along a fibre direction (one axis, or a swirl around the
 *    vertical axis for a heart), so muscle reads as grain rather than as cloud
 *  - pits: porous cavities (bone), which fade out with distance so a skeleton reads clean and only a close view sees them
 *  - cells: a polygonal lobular pattern (lung, liver) and a fine speckle, also faded with distance
 *  - fake subsurface scattering: the direct light wraps past the terminator and the wrapped part is
 *    tinted with the tissue's own saturated colour, and a faint coloured glow rises at grazing angles
 *
 * All of it is a patch through `onBeforeCompile`. The stage clones each material once per mesh and
 * carries `onBeforeCompile` and `customProgramCacheKey` across, so the patch survives; `color`,
 * `emissive` and `opacity` stay the stage's (tint, hover glow, X-ray), and the patch only multiplies
 * what they produce.
 *
 * A phone gets the "lite" tier: two octaves of mottling and no normal detail (which costs the most),
 * the same wrap and tint, so it is the same look family.
 */
import { ShaderChunk, type IUniform, type MeshPhysicalMaterial, type WebGLProgramParametersWithUniforms } from "three";

export type Tier = "full" | "lite";
export type Rgb = [number, number, number];

/** One tissue's procedural surface. Lengths are in centimetres of the real organ (see `CM_PER_UNIT`). */
export interface TissueSpec {
  /** Luminance mottling amplitude, 0 to 1. */
  colVar: number;
  /** Mottling features per cm. */
  colFreq: number;
  /** A second tone patched over the first (multiplies the albedo), and how much of the surface it covers. */
  tone: Rgb;
  toneAmt: number;
  /** Normal tilt from the noise gradient, and the noise's features per cm. 0 for none. */
  bump: number;
  bumpFreq: number;
  /** How far the noise moves roughness either way. */
  rough: number;
  /** Porous pits, 0 to 1 (bone). */
  pit: number;
  /** Polygonal lobules: how dark their borders are (0 for none), and their size as features per cm. Full tier only. */
  cell: number;
  cellFreq: number;
  /** A fine darker speckle, 0 to 1, at a finer scale than the lobules. */
  speck: number;
  /** Wrap of the direct light past the terminator (0 is plain Lambert), the tint that wrapped light takes, and the grazing glow. */
  sssWrap: number;
  sssTint: Rgb;
  sssRim: number;
  /** 0: no fibres; 1: fibres along the object's y axis; 2: fibres swirling round it. */
  fibre: 0 | 1 | 2;
  /** How much longer than wide a fibre streak is. */
  stretch: number;
  /** How much of the mottling is fibre streaks rather than cloud, 0 to 1. */
  streak: number;
}

export const PLAIN: TissueSpec = {
  colVar: 0,
  colFreq: 1,
  tone: [1, 1, 1],
  toneAmt: 0,
  bump: 0,
  bumpFreq: 1,
  rough: 0,
  pit: 0,
  cell: 0,
  cellFreq: 1,
  speck: 0,
  sssWrap: 0,
  sssTint: [0, 0, 0],
  sssRim: 0,
  fibre: 0,
  stretch: 1,
  streak: 0,
};

const DEFINES: Record<Tier, string> = {
  full: "#define ANAT_BUMP 1\n#define ANAT_CELLS 1\n#define ANAT_OCT_COL 3\n#define ANAT_OCT_BUMP 2\n",
  lite: "#define ANAT_BUMP 0\n#define ANAT_CELLS 0\n#define ANAT_OCT_COL 2\n#define ANAT_OCT_BUMP 1\n",
};

const VERTEX_PARS = /* glsl */ `
uniform float uCmPerLocal;
varying vec3 vAnatP;
varying vec3 vAnatN;
`;

const VERTEX_MAIN = /* glsl */ `
vAnatP = position * uCmPerLocal;
vAnatN = normal;
`;

const FRAGMENT_PARS = /* glsl */ `
varying vec3 vAnatP;
varying vec3 vAnatN;
uniform mat4 modelViewMatrix;
uniform float uColVar;
uniform float uColFreq;
uniform vec3 uTone;
uniform float uToneAmt;
uniform float uBump;
uniform float uBumpFreq;
uniform float uRough;
uniform float uPit;
uniform float uCell;
uniform float uCellFreq;
uniform float uSpeck;
uniform float uSssRim;
uniform float uFibre;
uniform float uStretch;
uniform float uStreak;

float aHash( vec3 p ) {
	p = fract( p * 0.1031 );
	p += dot( p, p.zyx + 31.32 );
	return fract( ( p.x + p.y ) * p.z );
}

float aNoise( vec3 x ) {
	vec3 i = floor( x );
	vec3 f = fract( x );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix(
		mix( mix( aHash( i ), aHash( i + vec3( 1.0, 0.0, 0.0 ) ), f.x ), mix( aHash( i + vec3( 0.0, 1.0, 0.0 ) ), aHash( i + vec3( 1.0, 1.0, 0.0 ) ), f.x ), f.y ),
		mix( mix( aHash( i + vec3( 0.0, 0.0, 1.0 ) ), aHash( i + vec3( 1.0, 0.0, 1.0 ) ), f.x ), mix( aHash( i + vec3( 0.0, 1.0, 1.0 ) ), aHash( i + vec3( 1.0, 1.0, 1.0 ) ), f.x ), f.y ),
		f.z );
}

float aFbm( vec3 p, int octaves ) {
	float a = 0.5;
	float s = 0.0;
	float n = 0.0;
	for ( int i = 0; i < octaves; i ++ ) {
		s += a * aNoise( p );
		n += a;
		p = p * 2.03 + vec3( 17.1, 3.7, 9.2 );
		a *= 0.5;
	}
	return s / n;
}

#if ANAT_CELLS
// Distance between the nearest two feature points: near zero on the border between two cells.
float aCellEdge( vec3 p ) {
	vec3 i = floor( p );
	vec3 f = fract( p );
	float d1 = 8.0;
	float d2 = 8.0;
	for ( int x = -1; x <= 1; x ++ ) {
		for ( int y = -1; y <= 1; y ++ ) {
			for ( int z = -1; z <= 1; z ++ ) {
				vec3 g = vec3( float( x ), float( y ), float( z ) );
				vec3 c = i + g;
				vec3 o = vec3( aHash( c ), aHash( c + 17.3 ), aHash( c + 41.7 ) );
				float d = length( g + o - f );
				if ( d < d1 ) { d2 = d1; d1 = d; } else if ( d < d2 ) { d2 = d; }
			}
		}
	}
	return d2 - d1;
}
#endif

// The direction a fibre runs at object-space point p.
vec3 aFibreDir( vec3 p ) {
	if ( uFibre > 1.5 ) {
		vec3 c = cross( vec3( 0.0, 1.0, 0.0 ), p );
		float l = length( c );
		vec3 d = l > 1e-4 ? c / l : vec3( 1.0, 0.0, 0.0 );
		return normalize( d + vec3( 0.0, 0.55, 0.0 ) );
	}
	return vec3( 0.0, 1.0, 0.0 );
}

// Squeezes space along the fibre so a feature of the noise becomes a streak along it.
vec3 aFibreSpace( vec3 p ) {
	if ( uFibre < 0.5 ) return p;
	vec3 d = aFibreDir( p );
	return p - d * dot( p, d ) * ( 1.0 - 1.0 / uStretch );
}
`;

const COLOUR = /* glsl */ `
vec3 aP = vAnatP;
vec3 aPc = aFibreSpace( aP );
float aCv = aFbm( aPc * uColFreq, ANAT_OCT_COL ) - 0.5;
aCv = mix( aCv, aNoise( aPc * uColFreq * vec3( 3.0, 3.0, 3.0 ) ) - 0.5, uStreak );
float aCt = aNoise( aP * uColFreq * 0.37 + 5.3 );
diffuseColor.rgb *= 1.0 + uColVar * aCv * 2.0;
diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * uTone, smoothstep( 0.35, 0.75, aCt ) * uToneAmt );
// Fine detail is a fraction of a pixel from far away, where it would only read as dirt: fade it out.
float aFadePit = 1.0 - smoothstep( 0.2, 0.55, length( fwidth( aP * uBumpFreq * 0.6 ) ) );
diffuseColor.rgb *= 1.0 - uPit * aFadePit * smoothstep( 0.55, 0.9, aNoise( aP * uBumpFreq * 0.6 ) );
#if ANAT_CELLS
if ( uCell > 0.0 ) {
	float aFadeCell = 1.0 - smoothstep( 0.25, 0.7, length( fwidth( aP * uCellFreq ) ) );
	// Warped, wide and uneven, so the lobules read as faint mottling rather than a regular crackle of lines.
	vec3 aCp = aP * uCellFreq;
	aCp += 0.5 * ( vec3( aNoise( aCp * 0.7 ), aNoise( aCp * 0.7 + 7.1 ), aNoise( aCp * 0.7 + 13.3 ) ) - 0.5 );
	float aBorder = 1.0 - smoothstep( 0.0, 0.42, aCellEdge( aCp ) );
	float aPatchy = 0.25 + 1.5 * aNoise( aP * uCellFreq * 0.45 + 3.0 );
	diffuseColor.rgb *= 1.0 - uCell * aFadeCell * aBorder * aPatchy;
}
#endif
if ( uSpeck > 0.0 ) {
	float aFadeSp = 1.0 - smoothstep( 0.25, 0.7, length( fwidth( aP * uCellFreq * 6.0 ) ) );
	diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * vec3( 0.62, 0.56, 0.62 ), uSpeck * aFadeSp * smoothstep( 0.66, 0.84, aNoise( aP * uCellFreq * 6.0 ) ) );
}
`;

const ROUGHNESS = /* glsl */ `
roughnessFactor = clamp( roughnessFactor + aCv * uRough * 2.0, 0.04, 1.0 );
`;

const BUMP = /* glsl */ `
#if ANAT_BUMP
{
	vec3 aQ = aPc * uBumpFreq;
	float aH = aFbm( aQ, ANAT_OCT_BUMP );
	const float aE = 0.06;
	vec3 aG = ( vec3( aFbm( aQ + vec3( aE, 0.0, 0.0 ), ANAT_OCT_BUMP ), aFbm( aQ + vec3( 0.0, aE, 0.0 ), ANAT_OCT_BUMP ), aFbm( aQ + vec3( 0.0, 0.0, aE ), ANAT_OCT_BUMP ) ) - aH ) / aE;
	vec3 aN = normalize( vAnatN );
	vec3 aT = aG - aN * dot( aG, aN );
	// The noise is finer than a pixel from far away, where a tilt would only shimmer.
	float aFade = 1.0 - smoothstep( 0.3, 0.8, length( fwidth( aQ ) ) );
	vec3 aTv = mat3( modelViewMatrix ) * aT;
	aTv *= length( aT ) / max( length( aTv ), 1e-5 );
	normal = normalize( normal - uBump * aFade * faceDirection * aTv );
}
#endif
`;

const RIM = /* glsl */ `
{
	float aRim = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 2.2 );
	reflectedLight.indirectDiffuse += diffuseColor.rgb * uSssTint * uSssRim * aRim;
}
`;

/** The diffuse term of three's direct light, replaced by a wrapped and tinted one. Null if three's chunk no longer has the line. */
export function patchLights(chunk: string): string | null {
  const diffuse = "reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );";
  if (!chunk.includes(diffuse)) return null;
  const wrapped = `
	vec3 aSss = directLight.color * ( saturate( ( dot( geometryNormal, directLight.direction ) + uSssWrap ) / ( 1.0 + uSssWrap ) ) - dotNL ) * uSssTint;
	reflectedLight.directDiffuse += ( irradiance + aSss ) * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );`;
  return `uniform float uSssWrap;\nuniform vec3 uSssTint;\n${chunk.replace(diffuse, wrapped)}`;
}

/** Each marker is an include of three's shader, replaced by itself and then our lines. */
const after = (source: string, marker: string, add: string) => source.replace(`#include <${marker}>`, `#include <${marker}>\n${add}`);

/** The patched vertex and fragment source. Throws if three's shader has changed so a marker no longer exists. */
export function patchTissueShader(vertex: string, fragment: string, tier: Tier): { vertex: string; fragment: string } {
  const lights = patchLights(ShaderChunk.lights_physical_pars_fragment);
  if (!lights) throw new Error("tissue shader: three's lights_physical_pars_fragment no longer matches the patch");
  let v = after(vertex, "common", VERTEX_PARS);
  v = after(v, "begin_vertex", VERTEX_MAIN);
  let f = DEFINES[tier] + after(fragment, "common", FRAGMENT_PARS);
  f = f.replace("#include <lights_physical_pars_fragment>", lights);
  f = after(f, "color_fragment", COLOUR);
  f = after(f, "roughnessmap_fragment", ROUGHNESS);
  f = after(f, "normal_fragment_maps", BUMP);
  f = after(f, "aomap_fragment", RIM);
  for (const marker of ["vAnatP = position", "uSssWrap", "aFibreSpace( aP )", "aCv * uRough", "aQ = aPc", "aRim"]) {
    if (!(v + f).includes(marker)) throw new Error(`tissue shader: three's shader no longer has the place for "${marker}"`);
  }
  return { vertex: v, fragment: f };
}

const uniform = <T>(value: T): IUniform<T> => ({ value });

/** The uniforms one spec sets, on a shader being compiled. `cmPerLocal` turns the mesh's own coordinates into cm. */
export function tissueUniforms(spec: TissueSpec, cmPerLocal: number): Record<string, IUniform> {
  return {
    uCmPerLocal: uniform(cmPerLocal),
    uColVar: uniform(spec.colVar),
    uColFreq: uniform(spec.colFreq),
    uTone: uniform(spec.tone),
    uToneAmt: uniform(spec.toneAmt),
    uBump: uniform(spec.bump),
    uBumpFreq: uniform(spec.bumpFreq),
    uRough: uniform(spec.rough),
    uPit: uniform(spec.pit),
    uCell: uniform(spec.cell),
    uCellFreq: uniform(spec.cellFreq),
    uSpeck: uniform(spec.speck),
    uSssWrap: uniform(spec.sssWrap),
    uSssTint: uniform(spec.sssTint),
    uSssRim: uniform(spec.sssRim),
    uFibre: uniform(spec.fibre),
    uStretch: uniform(spec.stretch),
    uStreak: uniform(spec.streak),
  };
}

/** Patches a material in place. The tier picks the shader text, so it is part of the program's cache key. */
export function applyTissue(material: MeshPhysicalMaterial, spec: TissueSpec, tier: Tier, cmPerLocal: number): void {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    const patched = patchTissueShader(shader.vertexShader, shader.fragmentShader, tier);
    shader.vertexShader = patched.vertex;
    shader.fragmentShader = patched.fragment;
    Object.assign(shader.uniforms, tissueUniforms(spec, cmPerLocal));
  };
  material.customProgramCacheKey = () => `anatomy-tissue:${tier}`;
}
