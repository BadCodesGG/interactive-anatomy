"use client";

import { lazy, Suspense, useSyncExternalStore } from "react";
import type { ExplodeStore, Sidecar } from "@/engine/explode";
import { tour } from "@/lib/tour-store";

// The tour's scene code (the bolus, its curve and its captions' data) is fetched by import() only
// when a visitor starts the tour, so it adds nothing to the stage chunk.
const TourScene = lazy(() => import("./tour-scene"));

const active = () => tour.getState().active;

/** A stage child that mounts the bolus while the sandwich tour runs. Holds no tour code of its own. */
export function TourGate({ store, sidecar, reduced }: { store: ExplodeStore; sidecar: Pick<Sidecar, "parts">; reduced: boolean }) {
  const running = useSyncExternalStore(tour.subscribe, active, () => false);
  return running ? (
    <Suspense fallback={null}>
      <TourScene store={store} sidecar={sidecar} reduced={reduced} />
    </Suspense>
  ) : null;
}
