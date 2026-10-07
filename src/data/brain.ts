import { parseSidecar } from "@/engine/explode/sidecar";
import json from "./brain.sidecar.json";

/** The brain's sidecar, validated at build time: a malformed sidecar fails `next build`. */
export const brainSidecar = parseSidecar(json, "brain.sidecar.json");
export { brainCopy } from "./brain.copy";
