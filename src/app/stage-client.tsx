"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { StageGate, useExplodeState, useExplodeStore, type Sidecar } from "@/engine/explode";

// three, R3F and camera-controls live only in these lazy chunks. `ssr: false` is allowed only in a
// Client Component, which is why this wrapper exists. They are requested after idle, only with
// WebGL 2, and under reduced motion only when the visitor presses Load 3D. The sibling
// `import("three")` gives three its own chunk (shared and cached across every feature route) that
// downloads in parallel with the stage's own code, instead of being bundled into it.
const Stage = dynamic(() => Promise.all([import("./stage"), import("three")]).then(([stage]) => stage), { ssr: false });

/** The fixture's poster: a drawn placeholder. Feature routes pass a captured image instead. */
function Poster() {
  return (
    <div
      role="img"
      aria-label="The fixture machine: a frame of two columns and a head, with two gears inside"
      className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_45%,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_60%)]"
    >
      <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ink-tertiary">Exploded view</span>
    </div>
  );
}

export function StageClient({ sidecar, poster = <Poster />, opening }: { sidecar: Sidecar; poster?: ReactNode; opening?: boolean }) {
  const store = useExplodeStore();
  const { ready, k, opening: flying } = useExplodeState(store);
  // data-stage-k is the explode amount at the last settle: npm run test:stage waits on it. The
  // opening fly-in holds data-stage-ready for its ~2 s, so a check or a screenshot sees the fitted pose.
  return (
    <div data-stage-ready={ready && !flying ? "true" : "false"} data-stage-k={k}>
      {/* The gate's own size is a fixed one; this one is a portrait box on a phone and scales with the window on a desktop, so the explode row under it stays near the fold. In a short landscape window (a phone on its side) neither fits, so it takes the window's height less everything above the stage (the 52px header bar, the title and one line of intro, and the page's padding: 128px, measured, with 8px to spare), so the stage ends at the fold. */}
      <StageGate poster={poster} className="border-0 bg-transparent max-md:aspect-[4/5] max-md:h-auto max-md:max-h-none max-md:min-h-0 md:h-[clamp(460px,58vh,640px)] short:aspect-auto short:h-[min(420px,calc(100svh-8rem))] short:max-h-none short:min-h-0">{(gate) => <Stage sidecar={sidecar} opening={opening} {...gate} />}</StageGate>
    </div>
  );
}
