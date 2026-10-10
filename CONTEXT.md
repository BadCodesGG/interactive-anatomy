# Context

Glossary of the project's domain terms. Keep each entry to one or two sentences; add terms as the domain model grows.

## Terms

- **Feature**: One explorable model (`brain`, `body`). Made of a GLB, a sidecar JSON and a copy book.
- **Part**: One named node in a feature's GLB, such as a rib group or a brain region. Parts are the unit that is exploded, picked and described.
- **Region map**: `src/data/*-map.json`. Lists which source atlas meshes join into each part.
- **Sidecar**: `src/data/<feature>.sidecar.json`. Describes a feature's parts (explode vectors, groups, stages) and points at its GLB.
- **Copy book**: `src/data/<feature>.copy.ts`. The typed text shown for each part.
- **Exploded view**: The state where parts move apart along their explode vectors, driven by the slider.
- **Explode plan**: The maths in `src/engine/explode/plan.ts` that turns the slider value into per-part offsets.
- **Stage**: A group stage in the explode plan. Stages split the slider evenly so structure can separate before mechanism.
- **Age slider**: Body-only control from infant to senior that rescales and tints parts.
- **Tour**: The guided walk through the body that follows a bite of food through the digestive system.
- **Living motion**: The heartbeat, breathing and camera sway applied on child nodes so a part's own transform is untouched.
- **Poster**: Pre-rendered image of a model shown while the 3D canvas loads.
- **Z-Anatomy**: The open anatomy atlas the source GLBs come from.
