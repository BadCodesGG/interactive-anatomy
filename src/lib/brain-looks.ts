/**
 * The brain's colouring as engine looks: pure data, no React, no three. The engine tweens a part's
 * tint per frame, so a region eases toward its teaching colour and back without any per-frame work here.
 */
import { BRAIN_COLOURS } from "@/data/brain-colours";
import type { Looks } from "@/engine/explode";

/** How far a hovered region leans toward its colour; a selected one, or one under "Colour regions", goes all the way. */
export const HOVER_AMOUNT = 0.85;

export function brainLooks(all: boolean, hovered: string | null, selected: string | null): Looks {
  const parts: Looks["parts"] = {};
  for (const [id, colour] of Object.entries(BRAIN_COLOURS)) {
    const amount = all || id === selected ? 1 : id === hovered ? HOVER_AMOUNT : 0;
    // A part with no tint target keeps the colour it last leaned toward while its amount fades out.
    parts[id] = amount > 0 ? { tint: colour, amount } : { tint: null, amount: 0 };
  }
  return { parts };
}
