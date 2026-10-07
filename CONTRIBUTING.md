# Contributing

Before opening a pull request, run:

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run test:stage
```

## Adding a feature

A feature is three files plus a route.

| File | Holds |
|---|---|
| `public/models/<feature>.<hash>.glb` | Geometry. Meshopt-compressed, one named node per part, content hash in the name. |
| `src/data/<feature>.sidecar.json` | Schema 1: parts keyed by node name, labels, groups and stages, optional explode vectors and camera views, copy keys. |
| `src/data/<feature>.copy.ts` | `export const copyBook: CopyBook`, one `PartCopy` per sidecar `copy` key. |

1. Export a GLB with one uniquely named node per part (`[A-Za-z0-9_-]` only) and compress it with the safe flags in the README. Name it `<feature>.<content hash>.glb`. `npm run fixture` shows the pattern: hash the bytes, write the file, update the sidecar.
2. Copy `src/data/fixture.sidecar.json` and `fixture.copy.ts` and fill them in.
3. Copy `src/app/brain/page.tsx` into the feature's route and point it at the new sidecar and copy book. It renders through `FeatureLayout` (`src/components/feature-layout.tsx`), which mounts the shared `src/app/stage-client.tsx` and `stage.tsx`. The page is a Server Component: the headline, text and `<PartList>` render into the HTML, so the route works with JavaScript off. Only the canvas is lazy.
4. Add the route to `ROUTES` in `scripts/check-stage.mjs`.

The fixture model and its sidecar are not routed (`/fixture` answers 404), but they stay because the engine's `loader.test.ts` reads them.

## Anatomy specifics

- **The region maps are the source of truth.** `src/data/brain-map.json` (`lobes`) and `body-map.json` (`groups`) list, per region, the Z-Anatomy source nodes in `nodesRaw`. Their `nodes` keys use a stricter sanitiser than three's and match nothing: do not use them. `scripts/anatomy-models.test.ts` fails when a map changes and the model was not rebuilt, or when sidecar parts and map regions drift apart.
- **Licences.** Do not add the kidneys, the renal pelvis, the inner ear or the white-matter meshes: their upstream licences are non-commercial, unstated or unverified. Every node listed under `dropped` in the region maps is removed from the committed sources by `node scripts/strip-sources.mjs`; run it after replacing a source GLB, and `node scripts/strip-sources.mjs --check` exits 1 if one is still present. The credit line "Z-Anatomy" must stay in every page's server HTML; `test:stage` checks it.
- **Age looks.** Parts scale about their node origin, which the model build puts at each region's centre. The exception is a pivot family: regions that share a `pivot` key in `body-map.json` (`spine` for the vertebrae and discs, `ribcage` for the ribs and the ribcage) share one origin, the centre of the family's joint bounds, so the family scales as one. A pivot part's mesh sits on a child node (quantization would otherwise fold the mesh's offset into the part node and pull the origin back); a part with no `pivot` has its mesh on the part node itself.
- **Living motion goes on its own node.** The heartbeat, breathing and camera sway (`src/app/living.tsx`, `motion.ts`, `sway.ts`) never write a part node. `PartMotion` moves a part's content under a child group. The sway only rotates a settled camera, and the stage draws on demand, so `Living` asks for a frame only while something moves.
- **Model sizes** are in `src/lib/model-scale.ts`: the body is 5 units tall for 175 cm, the brain 2.2 long for 16.7 cm.
- **Authored layouts.** Both sidecars carry explode vectors for every part, and the brain sets `assembly.camera` to a lateral view. Check the exploded screenshots after changing either.

## Gotchas

- **Routes that set metadata go through `pageMetadata()` in `src/lib/site.ts`.** A route that declares its own `openGraph` or `twitter` replaces the layout's wholesale, so its card loses the picture; a route that sets only `title` inherits the home page's title and URL in the card. `SITE_URL` is the literal production domain, never a deployment URL or localhost, or Slack and Facebook drop the image. `src/lib/site.test.ts` checks every route.
- **Import the stage only through `next/dynamic` with `ssr: false`, from a Client Component** (`stage-client.tsx`). The barrel `@/engine/explode` deliberately omits `stage`, `plan` and `camera`: importing any of them statically puts three into the route's initial JS. `test:stage` fails if `WebGLRenderer` appears in an initial chunk.
- **The sibling `import("three")` in `stage-client.tsx` is load-bearing.** It gives three its own chunk, fetched in parallel. Without it the bundler folds the engine into three's chunk and the stage budget (120 KB gzipped, three excluded) cannot be measured.
- **Sidecar keys are node names after three's sanitiser.** three turns whitespace into `_` and drops `[ ] . : /`; the engine further requires `[A-Za-z0-9_-]`. A multi-primitive mesh's children take `<mesh>_1`-style names from the same pool as nodes, so a node named `gear_1` can collide. `npm run check:sidecar` loads each GLB through three's real GLTFLoader to catch this.
- **`<Canvas flat>`, never `<Canvas shadows>`.** Without `flat`, tone mapping recolours every material; `shadows` selects a shadow map type three 0.186 replaces with a warning. Shadows are switched on in `onCreated` with PCFShadowMap.
- **WebGL 2 only.** The probe in `gate.tsx` accepts only a `webgl2` context. Widening it makes WebGL-1-only browsers download three and fail.
- **One console warning is allowed, exactly:** R3F 9.8 constructs a `THREE.Clock`, which three 0.186 deprecates. `test:stage` fails on any other `THREE.` warning and on any console error, with one narrow exception: a `THREE.WebGLProgram` log made up only of the ANGLE D3D11 compiler notes X4122 and X3595. Those come from three's `PMREMGenerator` and from `n8ao`, appear only on a real Windows GPU, and change nothing on screen.
- **Camera focus uses `fitToSphere`, not `fitToBox`.** camera-controls' `fitToBox` snaps to the nearest axis-aligned angle, which shows flat parts edge-on.
- **An authored `view` is for the exploded pose.** Write its `position` and `target` against where the part sits at k = 1.
- **Models are cached as immutable** (`next.config.ts`), so a changed GLB must be a new filename.
- **Per-frame values never go through React.** The store publishes `k` only when a tween settles; the canvas reads the live value with `store.frameK()`.
