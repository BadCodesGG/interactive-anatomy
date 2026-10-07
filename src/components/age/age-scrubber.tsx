"use client";

import { useId, type CSSProperties } from "react";
import { ageDisclaimer, ageStages } from "@/data/ages";
import { useExplodeState, useExplodeStore } from "@/engine/explode";
import { isSmallBody } from "@/lib/age-looks";
import { useAge } from "./age-context";

const LAST = ageStages.length - 1;

/**
 * The age control: a native, labelled range with one stop per stage, so arrow keys, Home, End and
 * Page Up and Down step through stages for free. A tick and a name mark each stop, the current stage
 * is named large above the track, and the disclaimer is always visible under it. Styled on the atlas
 * plate in globals.css (`[data-age-control]`): a 44 px tall band to grab, a hairline track filled to
 * the thumb, and a focus ring a keyboard user cannot miss.
 *
 * data-age-small is set while the body is drawn small, when globals.css hides the resting leader labels.
 * data-age-applied is the stage the 3D view has finished drawing, and data-selected-scale the
 * selected part's drawn size against the adult model (npm run test:stage reads both).
 */
export function AgeScrubber() {
  const { stage, setStage } = useAge();
  const store = useExplodeStore();
  const { looks, applied, selected } = useExplodeState(store);
  const id = useId();
  const info = ageStages[stage];
  const settled = applied !== null && applied.looks === looks && looks !== null;
  const scale = settled && selected ? applied.parts[selected] : undefined;
  // The thumb's centre travels between half a thumb from each end, so the ticks share that inset.
  const along = (i: number) => `calc(var(--age-thumb) / 2 + (100% - var(--age-thumb)) * ${i / LAST})`;

  return (
    <div
      data-age-control
      data-age-stage={stage}
      data-age-small={isSmallBody(stage) ? "" : undefined}
      data-age-applied={settled ? stage : ""}
      data-selected-scale={scale === undefined ? "" : scale.toFixed(3)}
      className="@container border border-border bg-surface px-5 pt-4 pb-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary">
          Age
        </label>
        <p className="font-display text-ink" aria-hidden="true">
          <span className="text-[26px] leading-none font-semibold">{info.label}</span>{" "}
          <span className="text-base italic text-ink-secondary">{info.years}</span>
        </p>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={LAST}
        step={1}
        value={stage}
        aria-valuetext={`${info.label}, ${info.years}`}
        data-age-range
        style={{ "--p": stage / LAST } as CSSProperties}
        onChange={(e) => setStage(Number(e.currentTarget.value))}
        className="mt-1"
      />
      <div aria-hidden="true" className="relative -mt-2 h-10">
        {ageStages.map((s, i) => {
          // Every name fits once the track is wide enough (a container query: the column is narrower at 768px than on a phone
          // held sideways); below that only the two ends are named, and the current stage is named above.
          const named = i === 0 || i === LAST;
          // The end names hang inward from their ticks, so neither reaches past the track.
          const place = i === 0 ? "items-start" : i === LAST ? "-translate-x-full items-end" : "-translate-x-1/2 items-center";
          return (
            <div key={s.id} className={`absolute top-0 flex flex-col ${place}`} style={{ left: along(i) }}>
              <span className={`h-2 w-px ${i <= stage ? "bg-accent" : "bg-plate-rule"}`} />
              <span
                className={`mt-1 whitespace-nowrap font-display text-[15px] leading-none italic ${i === stage ? "font-semibold text-accent" : "text-ink-secondary"} ${named ? "" : "hidden @min-[24rem]:block"}`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <p data-age-disclaimer className="mt-2 border-t border-border pt-3 text-sm italic text-ink-tertiary">
        {ageDisclaimer}
      </p>
    </div>
  );
}
