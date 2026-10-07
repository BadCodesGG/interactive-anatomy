import type { ReactNode } from "react";
import { StageClient } from "@/app/stage-client";
import { DeepLinkSync, ExplodeControls, ExplodeProvider, InfoPanel, PartList, StageTools, type CopyBook, type Sidecar } from "@/engine/explode";

export interface FeatureLayoutProps {
  sidecar: Sidecar;
  copy: CopyBook;
  eyebrow: string;
  title: string;
  /** The plate's number and caption, set on the stage's frame. */
  plate: string;
  caption: ReactNode;
  /** The first sentence: on a phone it is all the header carries, so the stage starts higher. */
  intro: ReactNode;
  /** The rest of the intro: in the header from md up, below the stage on a phone (and in a short landscape window, where the header stays one line). */
  more?: ReactNode;
  /** Accessible name of the part list's nav. */
  partsLabel: string;
  poster?: ReactNode;
  /** More controls under the explode slider. */
  controls?: ReactNode;
  /** The guided tour's card: the first thing in the side column, so its panel shows beside the stage. */
  tour?: ReactNode;
  /** Shown in the info panel under the copy. */
  panel?: ReactNode;
  /** Notes at the end of the page. */
  notes?: ReactNode;
  /** Wraps everything inside the explode store, for feature state that needs it. */
  wrap?: (children: ReactNode) => ReactNode;
  /**
   * Names the page for its saved state (found parts, the sound choice) and its screenshots, and turns
   * on the shared features: deep links, part search, system filter, share and screenshot, the found
   * counter, sound, X-ray, fact cards, View in AR on phones and the opening fly-in. Unset, the page is the plain view.
   */
  app?: string;
}

/**
 * A feature route's page. Server-rendered: the headline, the text and the full part list are in the
 * HTML, so the page reads and indexes with JavaScript off. Only the canvas is client-only and lazy.
 */
export function FeatureLayout({ sidecar, copy, eyebrow, title, plate, caption, intro, more, partsLabel, poster, controls, tour, panel, notes, wrap = (c) => c, app }: FeatureLayoutProps) {
  return (
    <ExplodeProvider>
      {app && <DeepLinkSync sidecar={sidecar} />}
      {wrap(
        <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-6 md:py-8 short:gap-3 short:py-3">
          <header className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary short:hidden">{eyebrow}</p>
            <h1 className="mt-2 font-display text-4xl leading-none font-semibold tracking-[-0.01em] text-ink md:mt-3 md:text-[56px] short:mt-0 short:text-3xl">{title}</h1>
            <p className="mt-3 text-base leading-relaxed text-ink-secondary short:mt-1">
              {intro}
              {more && <span className="max-md:hidden short:hidden"> {more}</span>}
            </p>
          </header>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_340px]">
            {/* On a desktop window tall enough for it, the stage column stays in view while the longer side column scrolls past. */}
            <div className="flex min-w-0 flex-col gap-4 roomy:sticky roomy:top-4 roomy:self-start">
              {/* The plate's hairline frame sits 12px inside the stage, so the figure reaches out 12px to put the frame on the column's edges. */}
              <figure data-plate className="group/plate relative -m-3 scroll-mt-4">
                <StageClient sidecar={sidecar} poster={poster} opening={!!app} />
                <p className="pointer-events-none absolute top-6 left-7 z-[2] bg-bg pr-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-secondary">
                  {plate}
                </p>
                {/* Only over the live view: over the poster or the gate's Load 3D button it would sit on top of them. */}
                <figcaption className="pointer-events-none absolute bottom-5 left-7 z-[2] hidden bg-bg pr-2 text-sm italic text-ink-secondary group-has-[[data-stage-gate=live]]/plate:block">
                  {caption}
                </figcaption>
              </figure>
              <ExplodeControls>{app && <StageTools app={app} sidecar={sidecar} ar />}</ExplodeControls>
              {controls}
            </div>
            <aside className="flex flex-col gap-6">
              {tour}
              <InfoPanel sidecar={sidecar} copy={copy} facts={!!app}>
                {panel}
              </InfoPanel>
              <nav aria-label={partsLabel}>
                <h2 className="mb-3 font-display text-2xl font-semibold text-ink">Parts</h2>
                <PartList sidecar={sidecar} copy={copy} search={!!app} filter={!!app} xray={!!app} discover={app} panel={app ? 440 : undefined} />
              </nav>
            </aside>
          </div>
          {more && <p className="text-base leading-relaxed text-ink-secondary md:hidden short:block">{more}</p>}
          {notes}
        </main>,
      )}
    </ExplodeProvider>
  );
}
