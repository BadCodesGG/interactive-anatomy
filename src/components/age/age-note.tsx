"use client";

import { ageStages } from "@/data/ages";
import { useExplodeState, useExplodeStore } from "@/engine/explode";
import { ageNoteFor, AGE_TINTS, isSmallBody } from "@/lib/age-looks";
import { useAge } from "./age-context";

const LABEL = "text-xs font-semibold uppercase tracking-[0.08em] text-ink-tertiary";
const TINT_WORD = { growth: "Growing", peak: "At its peak", decline: "Slowly declining" } as const;
const RISK_WORD = { low: "low risk", medium: "moderate risk", high: "higher risk" } as const;

/** The info panel's "At this age" block: the selected part's note for the stage, or the stage summary. */
export function AgeNote() {
  const { stage } = useAge();
  const store = useExplodeStore();
  const { selected } = useExplodeState(store);
  const info = ageStages[stage];
  const note = selected ? ageNoteFor(stage, selected) : null;

  return (
    <div data-age-note className="mt-4 rounded-md border border-border bg-bg/40 p-3 text-sm">
      <h3 className={LABEL}>
        At this age: {info.label} ({info.years})
      </h3>
      {note ? (
        <>
          <p className="mt-1 text-ink">{note.note}</p>
          {note.tint && (
            <p className="mt-2 flex items-center gap-2 text-xs text-ink-secondary">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-full" style={{ background: AGE_TINTS[note.tint] }} />
              {TINT_WORD[note.tint]}
              {note.risk && `, ${RISK_WORD[note.risk]}`}
            </p>
          )}
        </>
      ) : (
        <p className="mt-1 text-ink">
          {info.note}
          {selected && <span className="mt-1 block text-xs text-ink-tertiary">No stage-specific note for this part: it keeps its adult size here.</span>}
          {!selected && isSmallBody(stage) && <span className="mt-1 block text-xs text-ink-tertiary">The labels are hidden at this size so the figure stays clear. Hover or pick a part to see its name.</span>}
        </p>
      )}
    </div>
  );
}
