import type { CopyBook } from "@/engine/explode/copy";

/**
 * One entry per region id in brain-map.json. Numbers are adult, population-typical
 * figures; where the literature gives a range the range is quoted.
 */
export const brainCopy: CopyBook = {
  frontal: {
    id: "frontal",
    label: "Frontal lobe",
    group: "cerebral cortex",
    summary: "The largest lobe, sitting behind your forehead, where you plan, decide and start every voluntary movement.",
    function:
      "The precentral gyrus at its back edge is the primary motor cortex, which sends the commands that move your muscles. The prefrontal cortex in front handles planning, self-control, working memory and judging consequences. In most people the left inferior frontal gyrus (Broca's area) is needed to produce fluent speech.",
    whyItMatters:
      "Damage here can leave movement intact but change personality, motivation and impulse control. It is also the last part of the brain to finish maturing, which is part of why teenage decision-making differs from adult decision-making.",
    funFact:
      "In 1848 a roughly 6 kg iron rod passed through the frontal lobes of railway foreman Phineas Gage; he survived, and his changed behaviour helped make the case that frontal regions shape personality.",
    stats: [
      { label: "Share of cortex", value: "roughly one third to two fifths" },
      { label: "Prefrontal maturation", value: "continues to about age 25" },
      { label: "Cortex thickness (whole brain)", value: "roughly 2 to 4 mm" },
    ],
    sources: [
      "https://www.britannica.com/science/frontal-lobe",
      "https://www.nimh.nih.gov/health/publications/the-teen-brain-7-things-to-know",
    ],
  },

  parietal: {
    id: "parietal",
    label: "Parietal lobe",
    group: "cerebral cortex",
    summary: "The lobe on top and toward the back of the brain that turns touch and body position into a felt sense of where you are.",
    function:
      "The postcentral gyrus at its front edge is the primary somatosensory cortex, receiving touch, pressure, temperature and pain from the opposite side of the body. Further back, the parietal cortex combines vision, touch and balance to build a map of the space around you and to guide your hand towards what you see. Regions such as the angular and supramarginal gyri also take part in reading, calculation and language.",
    whyItMatters:
      "It is why you can find your phone in a dark pocket and know where your limbs are with your eyes shut. Damage, especially on the right, can cause neglect, where a person ignores one side of the world or even of their own body.",
    funFact:
      "The body map along the postcentral gyrus is out of proportion: the lips, tongue and fingertips take up far more cortex than the whole back.",
    stats: [
      { label: "Neurons in the whole cerebral cortex", value: "about 16 billion" },
      { label: "Cortex thickness", value: "roughly 2 to 4 mm" },
      { label: "Side of body sensed", value: "the opposite side (crossed wiring)" },
    ],
    sources: [
      "https://www.britannica.com/science/parietal-lobe",
      "https://pubmed.ncbi.nlm.nih.gov/19226510/",
    ],
  },

  temporal: {
    id: "temporal",
    label: "Temporal lobe",
    group: "cerebral cortex",
    summary: "The lobe above your ears that decodes sound and speech, recognises faces and files away memories.",
    function:
      "The transverse temporal gyri (Heschl's gyri) are the first cortical stop for sound coming up from the ears. The superior temporal gyrus and neighbouring areas make sense of speech, and the lower surface, including the fusiform gyrus, helps you recognise faces and objects. Its inner edge is packed with memory structures, including the hippocampus and amygdala, which are shown as separate parts.",
    whyItMatters:
      "Seizures that begin here often start with a strange smell, a rising feeling or a sense of deja vu, because the same tissue handles sensation and memory. Strokes and tumours in the dominant temporal lobe can leave someone able to speak fluently but unable to understand what is said to them.",
    funFact:
      "The fusiform gyrus on the underside of the temporal lobe is so tuned to faces that damage to it can leave a person unable to recognise their own family by sight.",
    stats: [
      { label: "Hearing range it processes", value: "about 20 to 20,000 Hz" },
      { label: "Neurons in the whole cerebral cortex", value: "about 16 billion" },
      { label: "Lobes per hemisphere", value: "1 (2 in total)" },
    ],
    sources: [
      "https://www.britannica.com/science/temporal-lobe",
      "https://pubmed.ncbi.nlm.nih.gov/30137797/",
    ],
  },

  occipital: {
    id: "occipital",
    label: "Occipital lobe",
    group: "cerebral cortex",
    summary: "The smallest lobe, at the very back of the head, and almost entirely devoted to seeing.",
    function:
      "Signals from the retina travel to the thalamus and then to the primary visual cortex, which lines the calcarine sulcus on the inner surface of this lobe. From there, nearby areas pull out edges, motion, colour and depth. The result is shipped forward along two routes, one towards the temporal lobe for what things are and one towards the parietal lobe for where they are.",
    whyItMatters:
      "A stroke here can blind half the visual field in both eyes even though the eyes themselves are perfectly healthy. It shows that we see with the brain, not with the eyes.",
    funFact:
      "The primary visual cortex holds an upside-down, distorted map of the visual world, and the small central patch you use to read gets a disproportionately huge share of it.",
    stats: [
      { label: "Nerve fibres from each eye", value: "about 1 million" },
      { label: "Position", value: "beneath the occipital bone, above the cerebellum" },
      { label: "Rank among the four lobes by size", value: "smallest" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK544320/"],
  },

  insula: {
    id: "insula",
    label: "Insula",
    group: "cerebral cortex",
    summary: "A hidden fold of cortex tucked deep inside the side of the brain, where body signals become feelings.",
    function:
      "The insula sits under the frontal, parietal and temporal lobes and receives taste, pain, temperature and signals from the gut, heart and lungs. It uses them to give you a running sense of the state of your body, such as hunger, breathlessness or a racing heart. It also links that bodily state to emotion, including disgust and empathy.",
    whyItMatters:
      "It is a main reason emotions are felt physically, as a knot in the stomach or a pounding chest. Changes in insula activity are studied in addiction, chronic pain and anxiety.",
    funFact:
      "Its name is Latin for island, because the folds of the brain grow over it and hide it from the surface.",
    stats: [
      { label: "Share of cortical surface", value: "about 2%" },
      { label: "Gyri", value: "5 (3 short, 2 long)" },
      { label: "Number of insulae", value: "2 (one per hemisphere)" },
    ],
    sources: [
      "https://pubmed.ncbi.nlm.nih.gov/34033368/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6032992/",
    ],
  },

  cerebellum: {
    id: "cerebellum",
    label: "Cerebellum",
    group: "hindbrain",
    summary: "The tightly folded 'little brain' at the back that smooths and times your movements.",
    function:
      "The cerebellum compares the movement your cortex commanded with what the body actually did, then corrects the difference within milliseconds. It keeps you balanced, times sequences such as speech and typing, and helps you learn skills until they become automatic. Two hemispheres are joined by the midline vermis, and the surface is folded into fine parallel ridges called folia.",
    whyItMatters:
      "When it is damaged, movement stays possible but becomes clumsy, wobbly and badly aimed, and speech can slur. It also contributes to attention and language, so its role is wider than movement alone.",
    funFact:
      "It takes up only about a tenth of the brain's volume yet holds most of its neurons.",
    stats: [
      { label: "Neurons", value: "about 69 billion (roughly 80% of the brain's neurons)" },
      { label: "Share of brain volume", value: "about 10%" },
      { label: "Mass", value: "about 150 g" },
      { label: "Lobes", value: "3 (anterior, posterior, flocculonodular)" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK538167/",
      "https://pubmed.ncbi.nlm.nih.gov/19226510/",
    ],
  },

  brainstem: {
    id: "brainstem",
    label: "Brainstem",
    group: "hindbrain",
    summary: "The stalk joining brain to spinal cord: midbrain, pons and medulla, running breathing, heartbeat and wakefulness.",
    function:
      "Every message between the brain and body passes through this thin column. The medulla runs the automatic rhythms of breathing, heart rate and swallowing, the pons relays signals to the cerebellum and helps control sleep and facial movement, and the midbrain handles eye movements and reflex responses to sights and sounds. Ten of the twelve cranial nerves leave from it.",
    whyItMatters:
      "A tiny injury here can be more dangerous than a large one anywhere else, because so many essential pathways are packed into a few centimetres. Clinical brain death is defined by loss of all brainstem function.",
    funFact:
      "The reticular formation running through it acts as the brain's wake-up switch, and anaesthetics work partly by turning that switch down.",
    stats: [
      { label: "Length", value: "about 7 to 8 cm" },
      { label: "Cranial nerves emerging", value: "10 of 12" },
      { label: "Resting breathing rate it sets", value: "12 to 20 breaths per minute" },
    ],
    sources: [
      "https://www.britannica.com/science/human-nervous-system/Brainstem",
      "https://www.ncbi.nlm.nih.gov/books/NBK551509/",
    ],
  },

  corpus_callosum: {
    id: "corpus_callosum",
    label: "Corpus callosum and commissures",
    group: "white matter",
    summary: "The great bridge of nerve fibres that lets the left and right halves of the brain talk to each other.",
    function:
      "The corpus callosum carries signals in both directions between matching regions of the two hemispheres, so that what one side sees, feels or plans is shared with the other. Smaller bundles nearby, including the anterior and hippocampal commissures, link the temporal lobes and the memory system. It arches over the ventricles like a thick ribbon.",
    whyItMatters:
      "Cutting it, once done to stop severe epilepsy from spreading, leaves the two hemispheres working more independently. Those patients showed that each half of the brain can hold information the other half cannot report.",
    funFact:
      "Studies of these split-brain patients earned Roger Sperry a share of the 1981 Nobel Prize in Physiology or Medicine.",
    stats: [
      { label: "Nerve fibres", value: "about 200 million" },
      { label: "Length front to back", value: "about 10 cm" },
      { label: "Other commissures shown", value: "3 (anterior, posterior, hippocampal)" },
    ],
    sources: ["https://www.britannica.com/science/corpus-callosum"],
  },

  thalamus: {
    id: "thalamus",
    label: "Thalamus and epithalamus",
    group: "diencephalon",
    summary: "Two egg-shaped relay stations in the centre of the brain that route almost every sense to the right part of the cortex.",
    function:
      "Sight, hearing, touch and taste all stop at the thalamus, in dedicated nuclei such as the lateral and medial geniculate bodies for vision and hearing, before being passed on to the cortex. It also helps regulate sleep, wakefulness and attention, and it passes motor loops between the cortex, basal ganglia and cerebellum. The small habenula beside it helps steer responses to disappointment and reward.",
    whyItMatters:
      "A stroke in the thalamus can wipe out feeling on one side of the body or cause severe, hard-to-treat pain. Damage on both sides can disturb consciousness itself.",
    funFact:
      "Smell is the odd one out: it reaches the cortex without the usual thalamic relay.",
    stats: [
      { label: "Senses relayed", value: "4 of 5 (all but smell)" },
      { label: "Nuclei", value: "about 50" },
      { label: "Halves", value: "2, one in each hemisphere" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK542184/"],
  },

  hypothalamus: {
    id: "hypothalamus",
    label: "Hypothalamus",
    group: "diencephalon",
    summary: "An almond-sized control centre that keeps the body's internal conditions steady.",
    function:
      "The hypothalamus watches blood temperature, salt balance, hunger and hormone levels and adjusts them, through the autonomic nerves and through hormones released by the pituitary gland below it. It holds the body's temperature set point near 37 degrees Celsius, drives thirst and appetite, and keeps the body clock in step with daylight. The mamillary bodies at its rear feed memory circuits.",
    whyItMatters:
      "It is the link between the brain and the hormone system, so problems here can disturb growth, sleep, weight, temperature and reproduction all at once.",
    funFact:
      "Despite weighing only a few grams, it runs the pituitary, which is often called the body's master gland.",
    stats: [
      { label: "Mass", value: "about 4 g" },
      { label: "Body temperature set point", value: "about 37 degrees C" },
      { label: "Pituitary it controls", value: "pea-sized, about 0.5 g" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK525993/"],
  },

  hippocampus: {
    id: "hippocampus",
    label: "Hippocampus and fornix",
    group: "limbic system",
    summary: "A seahorse-shaped structure in each temporal lobe that turns experiences into lasting memories.",
    function:
      "The hippocampus binds together the where, when and what of an experience and helps move it into long-term storage, and it also helps you navigate. It sends its output along the fornix, a curved cable that arcs up and forward towards the hypothalamus. Memories are not kept in the hippocampus forever; over time they are consolidated in the cortex.",
    whyItMatters:
      "It is one of the first regions affected in Alzheimer's disease, which is why new memories fail before old ones. Surgical removal of both hippocampi in the patient known as H.M. left him unable to form new lasting memories for the rest of his life.",
    funFact:
      "London taxi drivers who had memorised the city's streets were found to have a larger posterior hippocampus than other people.",
    stats: [
      { label: "Length", value: "about 4 to 5 cm" },
      { label: "Volume per side", value: "about 3 to 4 mL" },
      { label: "Number", value: "2 (one in each temporal lobe)" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK482171/",
      "https://pubmed.ncbi.nlm.nih.gov/10716738/",
    ],
  },

  amygdala: {
    id: "amygdala",
    label: "Amygdala",
    group: "limbic system",
    summary: "An almond-shaped cluster of nuclei that flags what matters emotionally, especially threat.",
    function:
      "The amygdala tags sights, sounds and memories with emotional weight and can trigger a fast fear response through the hypothalamus and brainstem before you have consciously worked out what you saw. It also helps you read other people's expressions and strengthens memories of emotional events. The stria terminalis is its main outgoing pathway.",
    whyItMatters:
      "Over-reactive amygdala circuits are implicated in anxiety and post-traumatic stress, and its wiring to the frontal lobe is why reasoning can calm a fright. Understanding it guides treatments that retrain fear responses.",
    funFact:
      "A woman known as S.M., whose amygdalae were destroyed by a rare genetic condition, could not feel fear in situations that terrify most people.",
    stats: [
      { label: "Volume per side", value: "about 1.5 mL" },
      { label: "Nucleus groups", value: "5 major groups" },
      { label: "Number", value: "2 (one in each temporal lobe)" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK537102/"],
  },

  basal_ganglia: {
    id: "basal_ganglia",
    label: "Basal ganglia",
    group: "deep nuclei",
    summary: "A set of deep nuclei, the caudate, putamen and globus pallidus, that decide which movements to start and which to hold back.",
    function:
      "The caudate and putamen (together the striatum) take in signals from almost the whole cortex, and the globus pallidus sends the filtered result back via the thalamus. The net effect is to release wanted movements and suppress unwanted ones, and to help turn repeated actions into habits. Dopamine arriving from a nearby nucleus called the substantia nigra tunes the whole circuit.",
    whyItMatters:
      "Parkinson's disease appears when dopamine cells that feed this circuit die, leaving tremor, stiffness and slow movement. Huntington's disease and some tic disorders also involve it.",
    funFact:
      "The substantia nigra means 'black substance', named for the dark pigment in its dopamine cells.",
    stats: [
      { label: "Main nuclei in this model", value: "3 (caudate, putamen, globus pallidus)" },
      { label: "Dopamine neurons in the substantia nigra", value: "roughly half a million" },
      { label: "Circuit output", value: "goes back to the cortex via the thalamus" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK537141/",
      "https://www.ninds.nih.gov/health-information/disorders/parkinsons-disease",
    ],
  },

  ventricles: {
    id: "ventricles",
    label: "Ventricles and choroid plexus",
    group: "fluid spaces",
    summary: "Four connected chambers inside the brain that make and carry the cerebrospinal fluid.",
    function:
      "Two lateral ventricles, the third ventricle and the fourth ventricle are linked by narrow channels, including the aqueduct through the midbrain. Tufts of tissue called the choroid plexus line them and filter fluid out of the blood to make cerebrospinal fluid. The fluid flows through the chambers, out around the brain and spinal cord, and is absorbed back into the blood.",
    whyItMatters:
      "The fluid cushions the brain and carries away waste. If a channel blocks, fluid builds up and causes hydrocephalus, which raises pressure inside the skull and needs draining.",
    funFact:
      "Floating in fluid cuts the brain's effective weight from over a kilogram to only a few tens of grams.",
    stats: [
      { label: "Fluid volume", value: "about 150 mL" },
      { label: "Fluid made per day", value: "about 500 mL (turned over about 3 times)" },
      { label: "Ventricles", value: "4 (2 lateral, third, fourth)" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK532932/",
      "https://www.ncbi.nlm.nih.gov/books/NBK470578/",
    ],
  },

  other: {
    id: "other",
    label: "Limbic cortex and other structures",
    group: "limbic system",
    summary: "The cingulate gyrus, septal nuclei and optic pathway: pieces that link emotion, attention and vision but fit no single lobe.",
    function:
      "The cingulate gyrus arches over the corpus callosum and links emotion, pain, attention and decision-making, helping you notice errors and register that something hurts. The septal nuclei sit near the front of the midline and are tied to reward circuits. The optic chiasm and optic tracts carry vision on its way to the thalamus, with half of each eye's fibres crossing to the other side.",
    whyItMatters:
      "These are the connecting tissues of the emotional brain, and abnormal activity in the cingulate is studied in depression, chronic pain and obsessive-compulsive disorder. A tumour pressing on the optic chiasm classically causes loss of the outer visual fields.",
    funFact:
      "The word limbic comes from the Latin for border, because these structures form a rim around the brainstem.",
    stats: [
      { label: "Cortical surface area (whole cortex)", value: "about 2,000 cm2" },
      { label: "Cortex thickness", value: "roughly 2 to 4 mm" },
      { label: "Optic nerve fibres crossing at the chiasm", value: "about half of each eye's" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK538491/",
      "https://www.ncbi.nlm.nih.gov/books/NBK537077/",
    ],
  },
};

/** check:sidecar reads every feature's book under this name. */
export { brainCopy as copyBook };
