/**
 * The footer's credits. Every model, texture or dataset this site uses that it did not make goes
 * here, with its licence. The anatomy models are CC BY-SA, so the footer also carries the change
 * notice the licence asks for, and every page carries the educational disclaimer.
 */
export interface Credit {
  label: string;
  href?: string;
}

export interface CreditLine {
  id: string;
  /** The exact attribution string the licence asks for. */
  text: string;
  licence: string;
  url: string;
  covers: string;
}

export const modelCredits: CreditLine[] = [
  {
    id: "z-anatomy",
    text: "Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0",
    licence: "CC BY-SA 4.0",
    url: "https://github.com/Z-Anatomy/Models-of-human-anatomy",
    covers:
      "The 3D meshes for the skeleton, organs, lymphoid organs and brain structures, and their Terminologia Anatomica part names.",
  },
  {
    id: "bodyparts3d",
    text: "BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan",
    licence: "CC BY-SA 2.1 JP",
    url: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html",
    covers: "Geometry in the Z-Anatomy set that derives from BodyParts3D (most organs and bones).",
  },
  {
    id: "brainder",
    text: "Cortical parcellation meshes from Brainder (Anderson M. Winkler), CC BY-SA 3.0",
    licence: "CC BY-SA 3.0",
    url: "https://brainder.org/research/brain-for-blender/",
    covers: "The gyrus and sulcus surfaces of the cerebral cortex.",
  },
];

/** What changed, as CC BY-SA asks for a change notice. */
export const changeNotice =
  "These models were adapted for this page: parts were regrouped into named regions, the mesh data was compressed and decimated, and the parts were moved apart for the exploded view. Adapted models are shared under the same CC BY-SA licence as their sources. Left out on purpose: the inner ear, the kidneys, the renal pelvis and the white-matter meshes, because their upstream licences are non-commercial, unstated or unverified.";

/** Text written for this page (region descriptions, age notes) is original wording, not copied from Wikipedia or Z-Anatomy. */
export const textNotice =
  "Descriptions and age notes on this page were written for this site from public health and anatomy references, not copied from the model sources.";

export const educationalDisclaimer =
  "For education only. This is a simplified adult male model with population-typical values, it has not had specialist anatomical review, and it is not medical advice or a tool for diagnosis.";

export const creditsText: string[] = [
  ...modelCredits.map((c) => c.text),
  changeNotice,
  textNotice,
  educationalDisclaimer,
];

/** The footer's credit links: the anatomy sources. */
export const credits: Credit[] = [
  ...modelCredits.map((c) => ({ label: c.text, href: c.url })),
];
