import type { Metadata } from "next";
import { ColourRegions } from "@/components/brain/colour-regions";
import { FeatureLayout } from "@/components/feature-layout";
import { PosterImage } from "@/components/poster-image";
import { brainCopy, brainSidecar } from "@/data/brain";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "The brain, taken apart",
  description: "Pull the human brain apart in 3D: fifteen regions from the frontal lobe to the brainstem, each with what it does and why it matters.",
  path: "/brain",
});

export default function Page() {
  return (
    <FeatureLayout
      app="anatomy-brain"
      sidecar={brainSidecar}
      copy={brainCopy}
      eyebrow="Anatomy"
      title="The brain, taken apart"
      plate="Plate I · The brain"
      caption="Adult brain. Drag to turn it; the slider lifts each region away."
      intro="Fifteen regions, built from about 250 named structures."
      more="The four lobes, the cerebellum and the brainstem come away first, then the deep parts inside: the thalamus, the hippocampus, the basal ganglia and the fluid-filled ventricles. Drag the Explode slider, then pick a region to read what it does."
      partsLabel="Regions of the brain"
      controls={<ColourRegions />}
      poster={<PosterImage src="/posters/brain.png" alt="The assembled brain model" stage />}
    />
  );
}
