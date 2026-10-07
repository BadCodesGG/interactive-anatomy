import { parseSidecar } from "@/engine/explode/sidecar";
import json from "./body.sidecar.json";

/** The body's sidecar, validated at build time: a malformed sidecar fails `next build`. */
export const bodySidecar = parseSidecar(json, "body.sidecar.json");
/** How many parts the body view has: what its pages say, so the wording never drifts from the sidecar. */
export const bodyPartCount = Object.keys(bodySidecar.parts).length;
export { bodyCopy } from "./body.copy";
