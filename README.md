# Exploded Anatomy

**The human brain and body, pulled apart.**
Interactive 3D exploded views of the brain (15 regions) and the body (104 parts), with an age slider from infant to senior, built from the open Z-Anatomy atlas.

https://github.com/user-attachments/assets/6d433ea9-7218-4e51-8983-b0ea13a68c7b

**Live: [anatomy.badcodes.dev](https://anatomy.badcodes.dev)**

Pull a model apart with a slider, pick any part in 3D or from the list, and read about it. The page text, the part list and the credits are rendered on the server, so the content is there with JavaScript off; only the 3D canvas loads lazily.

## What you can do

| | |
|---|---|
| **Brain** | `/brain` comes apart into 15 regions. |
| **Body** | `/body` comes apart into 104 parts: skeleton, organs and lymphoid organs. |
| **Pick a part** | Click it in 3D or choose it from the list, then read its description. |
| **Change the age** | On the body, an age slider runs from infant to senior and rescales and tints the parts to match. |
| **Follow a sandwich** | A guided tour of the body that follows a bite of food through the digestive system. |
| **Watch it live** | The heart beats, the lungs and ribcage breathe, and the camera sways gently while you look. |

This is a simplified adult male model for education. It has not had specialist anatomical review and it is not medical advice.

## How it works

Each feature is a GLB with one named node per part, a sidecar JSON describing those parts, and a typed copy book with the text for each one. A shared exploded-view engine in `src/engine/explode/` reads the three and does everything else: the explode maths, camera focus, picking, the part list and the sheet of copy.

```
assets/anatomy/       Source GLBs from Z-Anatomy (skeleton, organs, lymphoid, nerves).
public/models/        The served models: brain.<hash>.glb and body.<hash>.glb, built from the above.
public/posters/       Pre-rendered images of each model, shown while the 3D canvas loads.
scripts/              Model build, sidecar check, poster capture, browser check of every route.
src/engine/explode/   The reusable three.js engine: plan (explode maths), camera, loader, store, stage.
src/data/             Per feature: <name>.sidecar.json, <name>.copy.ts. Plus the region maps.
src/app/              The routes: / (chooser), /brain, /body, the tour, living motion, materials.
src/components/       Part list, part sheet, tour panel, layout and the footer credits.
```

**Region maps.** The Z-Anatomy atlas has thousands of small meshes. `src/data/brain-map.json` and `src/data/body-map.json` say which source meshes join into each part (for example, every rib mesh into one rib node), by listing the source node names per region. `npm run models` reads them, bakes each source node's transform, joins the meshes into one node named by the region id, simplifies, and compresses the result with Meshopt.

**Explode maths.** Each part moves by its authored `explode` vector if it has one; otherwise radially from the assembly centre. Groups carry a stage, and stages split the slider evenly, so structure can come away before the mechanism. Both models here have authored vectors for every part. `src/engine/explode/plan.test.ts` holds worked examples.

**The age slider.** It drives a root scale plus a per-part scale and tint, tweened every frame inside the three.js stage, not through React state. The store publishes the slider position only when a tween settles, and the canvas reads the live value directly. The heartbeat, breathing and camera sway move each part's content on a child node, so they never disturb the part's own transform.

## Running it

Node 22 or 24.

```bash
git clone https://github.com/BadCodesGG/interactive-anatomy.git
cd interactive-anatomy
npm install
npm run dev            # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run build` | Production build. |
| `npm run lint` | ESLint (Next core-web-vitals and TypeScript). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Vitest: engine maths, sidecar schema, store, loader, and the check that sidecars, region maps and models agree. |
| `npm run fixture` | Rebuilds the small synthetic test model in `public/models/fixture.<hash>.glb` and points its sidecar at it. |
| `npm run check:sidecar` | Checks every `src/data/*.sidecar.json` against its GLB and copy book. |
| `npm run models` | Rebuilds the brain and body GLBs (see below). |
| `npm run posters` | After a build, captures `public/posters/*.png` from the running production site. |
| `npm run test:stage` | After a build, boots `next start` and drives each route in Chromium, checking payload size, console output, WebGL and the credit line. |

`test:stage` needs a production build first and Playwright's Chromium (`npx playwright install chromium`). Run it with `npm run test:stage`. Screenshots go to `.stage-shots/` (`STAGE_SHOTS_DIR` changes that), and `STAGE_URL` points it at a server that is already running.

## Rebuilding the models

The served GLBs are committed, so you only need this when you change a region map or a source file.

```bash
npm run models
```

If you replace a file in `assets/anatomy/` with a fresh upstream copy, run `npm run strip:sources` first. It removes the meshes listed under `dropped` in the region maps, whose licences are not compatible (see Credits and licence); `npm test` fails while any of them is still in a source file.

This reads `assets/anatomy/*.glb` (set `ANATOMY_SRC` to read them from another folder), applies `src/data/brain-map.json` and `body-map.json`, writes `public/models/{brain,body}.<hash>.glb`, deletes the old copies and updates each sidecar's `model` field. The map's hash is stored in the GLB, so `npm test` fails if you change a map and forget to rebuild.

If you compress a model by hand instead, never run `gltf-transform optimize` with its defaults: its flatten, join, instance and palette steps merge named parts into one node. Use:

```bash
gltf-transform optimize in.glb out.glb --flatten false --join false --instance false --palette false --simplify false --compress meshopt
npm run check:sidecar
```

[CONTRIBUTING.md](CONTRIBUTING.md) covers adding a feature and the gotchas.

## Credits and licence

The code is MIT, see [LICENSE](LICENSE). The anatomy models are not: they are derived from these CC BY-SA sources and shared under CC BY-SA 4.0.

- [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy), the open source atlas of anatomy, CC BY-SA 4.0: the meshes and their Terminologia Anatomica names.
- [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), The Database Center for Life Science, CC BY-SA 2.1 Japan: geometry in the Z-Anatomy set that derives from it (most organs and bones).
- [Brainder](https://brainder.org/research/brain-for-blender/) (Anderson M. Winkler), CC BY-SA 3.0: the cortical gyrus and sulcus surfaces.

**What was changed.** Parts were regrouped into named regions, the mesh data was simplified and compressed, and the parts were moved apart for the exploded view.

**Left out on purpose.** The kidneys, the renal pelvis, the inner ear and the white-matter meshes are not included, because their upstream licences are non-commercial, unstated or unverified. They are also stripped from the source files in `assets/anatomy/` (`node scripts/strip-sources.mjs`), so nothing in this repository carries them. Please do not add them back. The descriptions and age notes were written for this project from public health and anatomy references, not copied from the model sources.

Files that are not covered by the MIT licence, and the terms for the BadCodes name and logo, are listed in [NOTICE](NOTICE).

Built by [BadCodes](https://badcodes.dev).
