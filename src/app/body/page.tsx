import type { Metadata } from "next";
import { AgeProvider } from "@/components/age/age-context";
import { AgeCaption } from "@/components/age/age-caption";
import { AgeNote } from "@/components/age/age-note";
import { AgeScrubber } from "@/components/age/age-scrubber";
import { FeatureLayout } from "@/components/feature-layout";
import { PosterImage } from "@/components/poster-image";
import { TourEntry, TourShortcut } from "@/components/tour/tour-entry";
import { ageSources } from "@/data/ages";
import { bodyCopy, bodyPartCount, bodySidecar } from "@/data/body";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "The body, taken apart",
  description: "Pull the human body apart in 3D, from skeleton to organs, and scrub through seven life stages to see how each part grows and ages.",
  path: "/body",
});

const groups = Object.keys(bodySidecar.parts);

export default function Page() {
  return (
    <FeatureLayout
      app="anatomy-body"
      sidecar={bodySidecar}
      copy={bodyCopy}
      eyebrow="Anatomy"
      title="The body, taken apart"
      plate="Plate II · The body"
      caption={<AgeCaption />}
      intro={`${bodyPartCount} parts in two stages, down to each vertebra, disc and rib.`}
      more="The skeleton opens first, then the organs lift forward out of the torso. Drag the Age slider to see how each part changes from infant to senior: sizes shift, and colours show growth, peak or decline."

      partsLabel="Parts of the body"
      poster={<PosterImage src="/posters/body.png" alt="The assembled body model: skeleton with organs inside" stage />}
      controls={
        <>
          <TourShortcut />
          <AgeScrubber />
        </>
      }
      tour={<TourEntry />}
      panel={<AgeNote />}
      wrap={(children) => <AgeProvider groups={groups}>{children}</AgeProvider>}
      notes={
        <footer aria-label="Age sources" className="border-t border-border pt-6 text-sm text-ink-tertiary">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">Sources for the age notes</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {ageSources.map((s) => (
              <li key={s.url}>
                <a href={s.url} className="underline-offset-4 hover:text-accent hover:underline" rel="noreferrer">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      }
    />
  );
}
