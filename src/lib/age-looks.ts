/**
 * The body view's age overlay as engine looks: per stage, the whole model scales to the stage's
 * height, each group scales by its own note on top, and groups lean toward a colour that says
 * growth, peak or decline, more strongly as the risk rises. Pure data, no React, no three.
 */
import { ageNotes, ageStages, type AgeNote, type AgeRisk, type AgeTint } from "@/data/ages";
import type { Looks, PartLook } from "@/engine/explode";

/** The atlas age tints (Anatomy Atlas age-growth, age-peak, age-decline): they differ by lightness, not only hue. */
export const AGE_TINTS: Record<AgeTint, string> = { growth: "#5f8a57", peak: "#c9a13a", decline: "#6e4462" };

/**
 * How far a group leans toward its tint, by risk. Kept light so the tissue colours still read: at the old
 * 0.22 to 0.6 a gold tint turned the liver to orange clay and a plum one stained the bone.
 */
const AMOUNT: Record<AgeRisk, number> = { low: 0.08, medium: 0.16, high: 0.3 };

/** The stage the scrubber starts on: Adult, the model's own size (heightScale 1). */
export const DEFAULT_AGE_STAGE = ageStages.findIndex((s) => s.id === "adult");

/** Drawn at or below this fraction of the adult's height, the body is too small for 50 leader labels to fan out of it cleanly. */
const SMALL_BODY = 0.6;

/** Whether the stage draws the body small enough that the page hides the resting leader labels (globals.css). */
export function isSmallBody(stage: number): boolean {
  return (ageStages[stage]?.heightScale ?? 1) <= SMALL_BODY;
}

/**
 * The key a part's age notes are filed under. The spine and ribcage are split into a part per vertebra,
 * disc and rib, and each ages as its family does: its note, its tint and its scale (the family shares
 * one node origin, so scaling every member about it is scaling the spine or ribcage as a whole).
 */
export function ageNoteKey(id: string): string {
  if (/^(vertebra|disc)_/.test(id)) return "spine";
  if (id.startsWith("rib_")) return "ribcage";
  return id;
}

export function ageNoteFor(stage: number, group: string): AgeNote | null {
  const id = ageStages[stage]?.id;
  return (id && ageNotes[ageNoteKey(group)]?.[id]) || null;
}

export function ageLooks(stage: number, groups: string[]): Looks {
  const info = ageStages[stage];
  if (!info) throw new Error(`no age stage ${stage}`);
  const parts: Record<string, PartLook> = {};
  for (const g of groups) {
    const note = ageNoteFor(stage, g);
    parts[g] = {
      scale: note?.scale ?? 1,
      tint: note?.tint ? AGE_TINTS[note.tint] : null,
      amount: note?.tint ? AMOUNT[note.risk ?? "low"] : 0,
    };
  }
  return { root: info.heightScale, parts };
}
