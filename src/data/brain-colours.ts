/**
 * Each brain region's teaching colour: the colour the model was built with (the sRGB of each material's
 * base colour in public/models/brain.<hash>.glb). The 3D view draws the brain a wet pinkish grey and leans
 * a region toward its teaching colour when it is hovered or selected, or all of them with "Colour regions".
 */
export const BRAIN_COLOURS: Readonly<Record<string, string>> = {
  frontal: "#c9959a",
  parietal: "#b8a3b8",
  temporal: "#a8b0c4",
  occipital: "#c2ad98",
  insula: "#d4a28c",
  cerebellum: "#9fb3a8",
  brainstem: "#b9aa9c",
  corpus_callosum: "#e2dcd2",
  thalamus: "#c78f9f",
  hypothalamus: "#d98f86",
  hippocampus: "#a896c4",
  amygdala: "#cf8a8a",
  basal_ganglia: "#9aa7c9",
  ventricles: "#7fb6bf",
  other: "#b3a7a0",
};
