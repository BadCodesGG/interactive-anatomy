"use client";

import { ageStages } from "@/data/ages";
import { useAge } from "./age-context";

/** The plate's caption on the body view: the stage on show, so it never says "Adult" over an infant. */
export function AgeCaption() {
  const { stage } = useAge();
  return `${ageStages[stage].label}, three-quarter view. The skeleton opens first, then the organs lift forward.`;
}
