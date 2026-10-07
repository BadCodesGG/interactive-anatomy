import { describe, expect, it } from "vitest";
import { MeshPhysicalMaterial, ShaderChunk, ShaderLib } from "three";
import { applyTissue, patchLights, patchTissueShader, PLAIN, tissueUniforms, type TissueSpec } from "./tissue-shader";

const { vertexShader, fragmentShader } = ShaderLib.physical;

/** Every custom uniform (`uSomething`) a shader declares. */
const declared = (source: string) => [...source.matchAll(/uniform\s+\w+\s+(u[A-Z]\w*)\s*;/g)].map((m) => m[1]);

describe("patchLights", () => {
  it("wraps the direct diffuse term of three's physical lights", () => {
    const patched = patchLights(ShaderChunk.lights_physical_pars_fragment);
    expect(patched).not.toBeNull();
    expect(patched).toContain("uniform float uSssWrap;");
    expect(patched).toContain("aSss");
    expect(patched).not.toContain("reflectedLight.directDiffuse += irradiance * BRDF_Lambert");
  });

  it("answers null when three's chunk no longer has the line, so a three upgrade fails loudly", () => {
    expect(patchLights("void RE_Direct_Physical() {}")).toBeNull();
  });
});

describe("patchTissueShader", () => {
  it("patches three's real physical shader in both tiers", () => {
    for (const tier of ["full", "lite"] as const) {
      const { vertex, fragment } = patchTissueShader(vertexShader, fragmentShader, tier);
      expect(vertex).toContain("vAnatP = position * uCmPerLocal;");
      expect(fragment).toContain("aFibreSpace( aP )");
      expect(fragment).toContain("aCv * uRough");
      expect(fragment).toContain("aQ = aPc");
      // The lights chunk is spliced in whole, so its include is gone.
      expect(fragment).not.toContain("#include <lights_physical_pars_fragment>");
      expect(fragment).toContain(tier === "full" ? "#define ANAT_BUMP 1" : "#define ANAT_BUMP 0");
    }
  });

  it("defines every ANAT_ macro the shader tests or uses, in both tiers", () => {
    for (const tier of ["full", "lite"] as const) {
      const { fragment } = patchTissueShader(vertexShader, fragmentShader, tier);
      const used = new Set([...fragment.matchAll(/#if\s+(ANAT_\w+)/g)].map((m) => m[1]).concat([...fragment.matchAll(/,\s*(ANAT_OCT_\w+)\s*\)/g)].map((m) => m[1])));
      expect(used.size).toBeGreaterThan(2);
      for (const name of used) expect(fragment, `${name} in ${tier}`).toMatch(new RegExp(`#define ${name} [0-9]`));
    }
  });

  it("keeps every include it did not replace", () => {
    const { fragment } = patchTissueShader(vertexShader, fragmentShader, "full");
    for (const marker of ["color_fragment", "roughnessmap_fragment", "normal_fragment_maps", "aomap_fragment"]) expect(fragment).toContain(`#include <${marker}>`);
  });

  it("throws when a marker it patches after is missing from three's shader", () => {
    expect(() => patchTissueShader(vertexShader, fragmentShader.replace("#include <normal_fragment_maps>", ""), "full")).toThrow(/aQ/);
  });

  it("declares exactly the uniforms it hands out", () => {
    const { vertex, fragment } = patchTissueShader(vertexShader, fragmentShader, "full");
    const names = new Set([...declared(vertex), ...declared(fragment)]);
    expect([...names].sort()).toEqual(Object.keys(tissueUniforms(PLAIN, 1)).sort());
  });
});

describe("applyTissue", () => {
  const spec: TissueSpec = { ...PLAIN, colVar: 0.3, bump: 0.4, fibre: 2, stretch: 5, sssWrap: 0.5, sssTint: [1, 0.3, 0.2] };

  it("keys the program by tier, since the tier changes the shader's text", () => {
    const a = new MeshPhysicalMaterial();
    const b = new MeshPhysicalMaterial();
    applyTissue(a, spec, "full", 5);
    applyTissue(b, spec, "lite", 5);
    expect(a.customProgramCacheKey()).not.toBe(b.customProgramCacheKey());
  });

  it("patches a shader on compile and sets this mesh's uniforms on it", () => {
    const m = new MeshPhysicalMaterial();
    applyTissue(m, spec, "full", 5.6);
    const shader = { vertexShader, fragmentShader, uniforms: {} as Record<string, { value: unknown }> };
    m.onBeforeCompile(shader as never, null as never);
    expect(shader.vertexShader).toContain("vAnatP");
    expect(shader.uniforms.uCmPerLocal.value).toBe(5.6);
    expect(shader.uniforms.uColVar.value).toBe(0.3);
    expect(shader.uniforms.uFibre.value).toBe(2);
    expect(shader.uniforms.uSssTint.value).toEqual([1, 0.3, 0.2]);
  });
});
