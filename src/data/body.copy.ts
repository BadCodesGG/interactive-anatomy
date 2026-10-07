import type { CopyBook, PartCopy } from "@/engine/explode/copy";

/**
 * Copy for the spine and ribcage's individual parts: each vertebra, each intervertebral disc and each
 * rib, keyed by the sidecar's part id (`vertebra_c3`, `disc_l4_l5`, `rib_7_left`). Merged into the body's
 * copy book below. The wording is shared within a region and adds a level's own landmark only
 * where it is standard anatomy. `npm run check:sidecar` and body.test.ts hold these ids and labels to
 * the sidecar's.
 */

const SPINE_SOURCE = "https://www.ncbi.nlm.nih.gov/books/NBK525969/";
const RIB_SOURCE = "https://www.ncbi.nlm.nih.gov/books/NBK538328/";

type Region = "cervical" | "thoracic" | "lumbar";

/** C1 to C7, T1 to T12, L1 to L5, top to bottom. */
export const LEVELS: readonly string[] = [
  ...Array.from({ length: 7 }, (_, i) => `C${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `L${i + 1}`),
];

const regionOf = (level: string): Region => (level[0] === "C" ? "cervical" : level[0] === "T" ? "thoracic" : "lumbar");
const numberOf = (level: string) => Number(level.slice(1));
const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
const COUNT: Record<Region, number> = { cervical: 7, thoracic: 12, lumbar: 5 };
const REGION_NAME: Record<Region, string> = { cervical: "Cervical (neck)", thoracic: "Thoracic (chest)", lumbar: "Lumbar (lower back)" };

/** Every intervertebral disc as a pair of levels: C2-C3 down to L5-S1, 23 of them (there is no disc between C1 and C2). */
export const DISCS: readonly (readonly [string, string])[] = LEVELS.slice(1).map((level, i) => [level, LEVELS[i + 2] ?? "S1"] as const);

export const vertebraId = (level: string) => `vertebra_${level.toLowerCase()}`;
export const discId = ([a, b]: readonly [string, string]) => `disc_${a.toLowerCase()}_${b.toLowerCase()}`;
export const ribId = (n: number, side: "left" | "right") => `rib_${n}_${side}`;

interface Text {
  summary: string;
  function: string;
  whyItMatters: string;
  funFact?: string;
}

const VERTEBRA: Record<Region, Text> = {
  cervical: {
    summary: "One of the seven small, mobile vertebrae of the neck.",
    function:
      "A cervical vertebra has a small body and a hole in each side process, the transverse foramen, through which the vertebral artery runs up to the brain. Its facet joints are angled so the neck can bend, tilt and turn further than any other part of the spine.",
    whyItMatters:
      "These seven vertebrae carry a head of around 4 to 5 kg and protect the top of the spinal cord. The neck's freedom of movement is bought at the cost of stability, so it is the region most exposed to whiplash injuries.",
  },
  thoracic: {
    summary: "One of the twelve vertebrae of the chest, each carrying a pair of ribs.",
    function:
      "A thoracic vertebra has small smooth facets on its body and side processes where the ribs attach, and a long spinous process that points downward. Together with the ribs these joints make the mid-back the stiffest stretch of the spine.",
    whyItMatters:
      "The attached ribs limit bending here, which helps the ribcage guard the heart and lungs, but it means the thoracic spine moves far less than the neck or lower back.",
  },
  lumbar: {
    summary: "One of the five large vertebrae of the lower back, built to carry load.",
    function:
      "A lumbar vertebra has the largest body in the column, thick bony processes for the big back muscles, and no rib facets. Its facet joints are set to allow bending forward and back much more than twisting.",
    whyItMatters:
      "The lumbar spine carries most of the body's weight and every lift, so the lower back is where strain, disc wear and pain are most common.",
  },
};

/** Standard landmarks for single vertebrae; anything not listed uses its region's wording alone. */
const VERTEBRA_OWN: Record<string, Partial<Text>> = {
  C1: {
    summary: "The atlas: a ring-shaped vertebra that carries the skull.",
    function:
      "The atlas has no vertebral body and no spinous process, just a ring with two cup-shaped surfaces that receive the knobs at the base of the skull. That joint is what lets you nod. The axis below it sends a peg up through the ring, and the atlas turns around that peg.",
    whyItMatters: "It lets the head nod and, with the axis, turn. The spinal cord passes through the ring just below the skull, so an injury here is serious.",
    funFact: "It is named after Atlas, the Titan of Greek myth who held up the sky, because it holds up the head.",
  },
  C2: {
    summary: "The axis: the vertebra with a peg (the dens) that the atlas turns on.",
    function:
      "The axis has a tooth-like peg, the dens, rising from its body through the ring of the atlas. The skull and atlas turn together around that peg, and about half of all the turning in the neck happens at this joint.",
    whyItMatters: "It is the pivot for turning your head from side to side. Ligaments hold the peg against the atlas, which keeps it away from the spinal cord.",
  },
  C7: {
    summary: "The last cervical vertebra, with a long spinous process you can feel at the base of the neck.",
    function:
      "C7 is a transition between the neck and the chest. Its spinous process is longer than those above it and is not forked, so it forms the bump at the base of the back of the neck that is easy to feel through the skin.",
    whyItMatters: "Because it can be felt, C7 is a landmark for counting vertebrae down the back.",
    funFact: "It is also called the vertebra prominens, Latin for the prominent vertebra.",
  },
  T1: {
    summary: "The first thoracic vertebra, where the first pair of ribs attaches.",
    function:
      "T1 carries a whole facet for the first rib and half a facet for the second. It is the first vertebra of the rib-bearing spine and sits just below the neck's curve.",
    whyItMatters: "It marks the change from the flexible neck to the stiffer chest.",
  },
  T12: {
    summary: "The last thoracic vertebra, where the ribbed spine meets the lower back.",
    function:
      "T12 carries the twelfth rib, a floating rib with no front attachment. Below it the spine has no ribs, and its joints change from the thoracic pattern to the lumbar one, so this level is called the thoracolumbar junction.",
    whyItMatters: "The stiff chest spine meets the more mobile lower back here, so the junction takes extra stress and is a common place for spinal fractures.",
  },
  L1: {
    summary: "The first lumbar vertebra, near where the spinal cord ends.",
    function:
      "L1 is the top of the lumbar spine and has no rib facets. In adults the spinal cord itself ends at about the level of L1 to L2; below that a bundle of nerve roots, the cauda equina, carries on down the canal.",
    whyItMatters: "Because the cord ends near here, a lumbar puncture is made lower down, where the needle meets loose nerve roots rather than the cord.",
  },
  L5: {
    summary: "The last lumbar vertebra, resting on the sacrum.",
    function:
      "L5 is the largest and lowest of the movable vertebrae. Its lower surface meets the top of the sacrum at the lumbosacral joint, where the spine's curve meets the pelvis and the whole weight of the upper body passes into it.",
    whyItMatters: "It is a common place for a vertebra to slip forward over the one below, a condition called spondylolisthesis.",
  },
};

function vertebraCopy(level: string): PartCopy {
  const region = regionOf(level);
  const n = numberOf(level);
  const title = level === "C1" ? "Vertebra C1 (atlas)" : level === "C2" ? "Vertebra C2 (axis)" : `Vertebra ${level}`;
  const text = { ...VERTEBRA[region], ...VERTEBRA_OWN[level] };
  const id = vertebraId(level);
  return {
    id,
    label: title,
    group: "skeleton",
    ...text,
    stats: [
      { label: "Region", value: REGION_NAME[region] },
      { label: "Position", value: `${ordinal(n)} of ${COUNT[region]} ${region}` },
    ],
    sources: [SPINE_SOURCE],
  };
}

const DISC: Text = {
  summary: "A cushion of fibrocartilage between two vertebrae.",
  function:
    "The disc has a tough outer ring of fibrous tissue, the annulus fibrosus, around a soft, gel-like core, the nucleus pulposus. The model joins each disc with its core. The disc spreads load between the vertebrae and lets one tilt a little on the next.",
  whyItMatters:
    "Discs take years of load and slowly lose water and height. A tear in the outer ring can let the core bulge out, called a herniation, and press on a nearby nerve.",
  funFact: "Together the discs make up roughly a quarter of the length of the movable spine.",
};

const DISC_OWN: Record<string, Partial<Text>> = {
  "C2-C3": { summary: "The first disc of the spine, between the axis and C3.", funFact: "There is no disc between the atlas and the axis, so the first disc is C2-C3." },
  "C5-C6": { whyItMatters: "Discs in the lower neck, including this one, are among the cervical discs most often affected by herniation." },
  "C6-C7": { whyItMatters: "Discs in the lower neck, including this one, are among the cervical discs most often affected by herniation." },
  "L4-L5": { whyItMatters: "L4-L5 and L5-S1 are the levels where lumbar discs most often herniate." },
  "L5-S1": {
    summary: "The lowest disc, between L5 and the sacrum.",
    whyItMatters: "L4-L5 and L5-S1 are the levels where lumbar discs most often herniate.",
  },
};

function discCopy(pair: readonly [string, string]): PartCopy {
  const tag = `${pair[0]}-${pair[1]}`;
  const region = regionOf(pair[0]);
  const id = discId(pair);
  const own = DISC_OWN[tag] ?? {};
  const summary = own.summary ?? `The disc between ${pair[0]} and ${pair[1]}.`;
  const lumbar = region === "lumbar" && !own.function ? { function: `${DISC.function} Lumbar discs are the thickest in the spine.` } : {};
  return {
    id,
    label: `Disc ${tag}`,
    group: "skeleton",
    ...DISC,
    ...lumbar,
    ...own,
    summary,
    stats: [
      { label: "Between", value: `${pair[0]} and ${pair[1]}` },
      { label: "Tissue", value: "Fibrocartilage" },
    ],
    sources: [SPINE_SOURCE],
  };
}

const ORDINAL_WORDS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];

type RibKind = "true" | "false" | "floating";
const ribKind = (n: number): RibKind => (n <= 7 ? "true" : n <= 10 ? "false" : "floating");

const RIB_KIND: Record<RibKind, { name: string; how: string }> = {
  true: { name: "True rib", how: "It reaches the sternum through a costal cartilage of its own." },
  false: { name: "False rib", how: "Its costal cartilage joins the cartilage of the rib above rather than the sternum." },
  floating: { name: "Floating rib", how: "It has no front attachment: its tip ends free in the muscle of the side wall." },
};

/** What the rib joins at the back: ribs 1 and 10 to 12 meet one vertebra, ribs 2 to 9 meet two. */
function ribSpine(n: number): string {
  return n === 1 || n >= 10 ? `T${n}` : `T${n - 1} and T${n}`;
}

const RIB_OWN: Record<number, Partial<Text>> = {
  1: {
    summary: "The first rib: the shortest, broadest and most curved of the true ribs, tucked behind the collarbone.",
    function:
      "The first rib is broad, flat and sharply curved. Nerves and blood vessels heading for the arm pass over it on their way out of the chest.",
    funFact: "A small minority of people have an extra rib above the first, called a cervical rib.",
  },
  2: {
    summary: "The second rib, whose cartilage meets the sternum at the landmark used to count ribs.",
    function:
      "The second rib's cartilage joins the sternum at the sternal angle, the slight ridge you can feel on the breastbone. Clinicians use it as the starting point for counting ribs down the chest wall.",
  },
  7: { summary: "The seventh rib: the last of the true ribs." },
  10: { summary: "The tenth rib: the lowest of the false ribs." },
  11: { summary: "The eleventh rib: a short floating rib." },
  12: { summary: "The twelfth rib: the lowest floating rib." },
};

function ribCopy(n: number, side: "left" | "right"): PartCopy {
  const kind = ribKind(n);
  const word = ORDINAL_WORDS[n - 1];
  const Side = side === "left" ? "Left" : "Right";
  const own = RIB_OWN[n] ?? {};
  const cartilage = n <= 10 ? "The model joins the rib with its costal cartilage." : "Ribs 11 and 12 have no costal cartilage to join.";
  return {
    id: ribId(n, side),
    label: `${Side} rib ${n}`,
    group: "skeleton",
    summary: own.summary ?? `The ${side} ${word} rib: a ${kind} rib.`,
    function:
      own.function ??
      `The ${side} ${word} rib curves round the chest from the spine at ${ribSpine(n)}. ${RIB_KIND[kind].how} ${cartilage}`,
    whyItMatters:
      kind === "floating"
        ? "The lowest two pairs of ribs are free at the front, so they are more mobile than the ribs above, and they partly shield the kidneys from behind."
        : kind === "false"
          ? "These ribs are held by springy cartilage, which lets the lower chest wall flex with each breath and spring back."
          : "The upper ribs shield the heart and lungs, and each breath lifts them a little to widen the chest.",
    ...(own.funFact ? { funFact: own.funFact } : {}),
    stats: [
      { label: "Type", value: RIB_KIND[kind].name },
      { label: "Joins the spine at", value: ribSpine(n) },
      { label: "Side", value: Side },
    ],
    sources: [RIB_SOURCE],
  };
}

function build(): CopyBook {
  const book: CopyBook = {};
  for (const level of LEVELS) {
    book[vertebraId(level)] = vertebraCopy(level);
    const pair = DISCS.find(([a]) => a === level);
    if (pair) book[discId(pair)] = discCopy(pair);
  }
  for (let n = 1; n <= 12; n++) for (const side of ["left", "right"] as const) book[ribId(n, side)] = ribCopy(n, side);
  return book;
}

/** One entry per vertebra (24), intervertebral disc (23) and rib (24). */
export const skeletonPartCopy: CopyBook = build();

/**
 * One entry per group id in body-map.json (the vertebrae, discs and ribs are built above).
 * Figures are adult, population-typical; where sources disagree the range is quoted. The model is an
 * adult male.
 */
export const bodyCopy: CopyBook = {
  skull: {
    id: "skull",
    label: "Skull",
    group: "skeleton",
    summary: "The bony vault that shields the brain and shapes the face.",
    function:
      "Eight cranial bones lock together at zigzag joints called sutures to enclose the brain, while fourteen facial bones frame the eyes, nose and mouth and carry the teeth. The bone also holds the sinuses, which lighten the head, and tiny openings called foramina that let nerves and blood vessels through. The three ear ossicles, the smallest bones in the body, sit hidden inside the temporal bone.",
    whyItMatters:
      "It has to absorb knocks without letting them reach the brain, which is why the vault is a sandwich of hard outer plates around a spongier core. Its openings are also the routes by which infections and tumours can travel in or out.",
    funFact:
      "A newborn's skull bones are not yet fused, and the soft gaps between them let the head squeeze through the birth canal and leave room for the brain to grow.",
    stats: [
      { label: "Bones", value: "22 (8 cranial, 14 facial)" },
      { label: "Adult teeth", value: "32 (this model shows 28)" },
      { label: "Ear ossicles", value: "3 per ear, each under 1 cm" },
      { label: "Front soft spot closes", value: "about 12 to 18 months" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK499834/"],
  },

  spine: {
    id: "spine",
    label: "Spine (sacrum, coccyx and ligaments)",
    group: "skeleton",
    summary:
      "The sacrum, coccyx and ligaments of a flexible column that holds you upright and protects the spinal cord. Each vertebra and disc is a part of its own.",
    function:
      "Seven cervical, twelve thoracic and five lumbar vertebrae are stacked with cushioning discs between them, resting on the fused sacrum and the tiny coccyx. The column has four gentle curves, which act like a spring to spread load and keep the head balanced over the hips. A hollow channel through the stack shelters the spinal cord, and nerves leave through gaps between neighbouring vertebrae.",
    whyItMatters:
      "The discs and small joints take years of load, so back pain is one of the most common reasons people seek care. A spine that is strong yet springy is what makes upright walking possible.",
    funFact:
      "You are slightly taller in the morning, because the discs soak up fluid overnight and squash a little again during the day.",
    stats: [
      { label: "Movable vertebrae", value: "24 (7 cervical, 12 thoracic, 5 lumbar)" },
      { label: "Intervertebral discs", value: "23" },
      { label: "Length in adult men", value: "about 70 cm" },
      { label: "Natural curves", value: "4" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK525969/"],
  },

  ribcage: {
    id: "ribcage",
    label: "Ribcage (sternum and ligaments)",
    group: "skeleton",
    summary:
      "The sternum and the ligaments of a flexible bony cage that guards the heart and lungs and works like a bellows. Each rib, with its cartilage, is a part of its own.",
    function:
      "Twelve pairs of ribs curve round from the thoracic spine, and most join the sternum at the front through bars of costal cartilage. The first seven pairs attach directly, the next three attach indirectly, and the last two are floating. Muscles lift the ribs to widen the chest as you breathe in, and the cartilage lets the cage spring back.",
    whyItMatters:
      "It protects vital organs while still moving with every breath. Broken ribs are painful mainly because breathing keeps moving them, and shallow breathing can then lead to chest infections.",
    funFact:
      "You breathe roughly 20,000 times a day, so your ribs move more often than any other joint in the body.",
    stats: [
      { label: "Rib pairs", value: "12 (7 true, 3 false, 2 floating)" },
      { label: "Sternum length", value: "about 15 to 20 cm" },
      { label: "Breaths per day", value: "roughly 20,000" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK538328/"],
  },

  pelvis: {
    id: "pelvis",
    label: "Pelvis",
    group: "skeleton",
    summary: "A sturdy bony basin that carries the weight of the upper body and anchors the legs.",
    function:
      "Each hip bone is three bones fused into one: the ilium, ischium and pubis, which meet in the cup of the hip socket. The two hip bones join at the front through the pubic symphysis and at the back to the sacrum, forming a ring that transfers body weight down into the legs. The ring also cradles the bladder and bowel, and in women the womb.",
    whyItMatters:
      "A ring-shaped structure can rarely break in only one place, so pelvic fractures often involve two and can be serious. Its width and shape are also what a baby must pass through at birth.",
    funFact:
      "The Y-shaped cartilage where the three bones meet is still growing in childhood and turns fully to bone only in the mid to late teens.",
    stats: [
      { label: "Bones fused in each hip bone", value: "3 (ilium, ischium, pubis)" },
      { label: "Fusion completes", value: "mid to late teens" },
      { label: "Hip bones", value: "2, joined at the pubic symphysis" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK551580/"],
  },

  shoulder_girdle: {
    id: "shoulder_girdle",
    label: "Shoulder girdle",
    group: "skeleton",
    summary: "The collarbones and shoulder blades that hang your arms from the trunk and give them their huge range of motion.",
    function:
      "Each clavicle acts as a strut holding the shoulder out from the chest, and each scapula glides over the back of the ribs, with a shallow socket for the arm bone. Because the socket is shallow and the girdle is mostly held by muscle and ligament, the shoulder can circle through almost a full sphere. The acromioclavicular and sternoclavicular joints let the whole girdle tilt and shrug.",
    whyItMatters:
      "The price of that freedom is stability: the shoulder is among the joints most likely to dislocate. The clavicle is the bone most often broken by a fall onto an outstretched arm or the shoulder.",
    funFact:
      "The collarbone is one of the first bones to begin hardening before birth yet the last to finish growing, with its inner end closing only in the mid-twenties.",
    stats: [
      { label: "Bones", value: "4 (2 clavicles, 2 scapulae)" },
      { label: "Clavicle length", value: "about 15 cm" },
      { label: "Joints in the shoulder complex", value: "4" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK525990/"],
  },

  arm_left: {
    id: "arm_left",
    label: "Left arm",
    group: "skeleton",
    summary: "The humerus, radius and ulna: a lever system that puts your hand where it is needed.",
    function:
      "The humerus is a single long bone in the upper arm, and the forearm has two, the radius and the ulna. At the elbow the ulna hinges to bend and straighten the arm, while the radius pivots around it so you can turn your palm up or down. Strong ligaments and a thick sheet between the two forearm bones hold everything together.",
    whyItMatters:
      "The forearm's twisting is what lets you use a screwdriver or turn a door handle. Fractures of the wrist end of the radius are among the most common broken bones in adults.",
    funFact:
      "The funny bone is not a bone: the tingle comes from knocking the ulnar nerve where it passes close to the surface behind the elbow.",
    stats: [
      { label: "Bones", value: "3 (humerus, radius, ulna)" },
      { label: "Humerus length", value: "about 30 to 33 cm" },
      { label: "Forearm rotation", value: "roughly 170 to 180 degrees" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK534821/",
      "https://www.ncbi.nlm.nih.gov/books/NBK545260/",
    ],
  },

  arm_right: {
    id: "arm_right",
    label: "Right arm",
    group: "skeleton",
    summary: "The humerus, radius and ulna: a lever system that puts your hand where it is needed.",
    function:
      "The humerus is a single long bone in the upper arm, and the forearm has two, the radius and the ulna. At the elbow the ulna hinges to bend and straighten the arm, while the radius pivots around it so you can turn your palm up or down. Strong ligaments and a thick sheet between the two forearm bones hold everything together.",
    whyItMatters:
      "The forearm's twisting is what lets you use a screwdriver or turn a door handle. Fractures of the wrist end of the radius are among the most common broken bones in adults.",
    funFact:
      "Most people favour one arm, and the dominant arm's bones grow slightly denser and thicker from the extra loading.",
    stats: [
      { label: "Bones", value: "3 (humerus, radius, ulna)" },
      { label: "Humerus length", value: "about 30 to 33 cm" },
      { label: "Forearm rotation", value: "roughly 170 to 180 degrees" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK534821/",
      "https://www.ncbi.nlm.nih.gov/books/NBK545260/",
    ],
  },

  hand_left: {
    id: "hand_left",
    label: "Left hand",
    group: "skeleton",
    summary: "Twenty-seven small bones arranged for both strong grip and delicate precision.",
    function:
      "Eight carpal bones make up the wrist, five metacarpals form the palm and fourteen phalanges make the fingers and thumb. The thumb's saddle-shaped joint lets it swing across the palm to meet each fingertip, which is the basis of precision grip. Tendons run from muscles in the forearm to move the fingers.",
    whyItMatters:
      "Loss of the thumb's opposition costs a hand most of its usefulness. Because the hand is so bone- and joint-dense, it is a common site of osteoarthritis and of sports and fall injuries.",
    funFact:
      "There are no muscles in your fingers themselves: the movement comes from tendons pulled by muscles in the palm and forearm.",
    stats: [
      { label: "Bones per hand", value: "27 (8 carpal, 5 metacarpal, 14 phalanges)" },
      { label: "Both hands", value: "54 of the body's 206 bones" },
      { label: "Fingers and thumb", value: "5" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK535382/",
      "https://www.nhs.uk/conditions/osteoarthritis/",
    ],
  },

  hand_right: {
    id: "hand_right",
    label: "Right hand",
    group: "skeleton",
    summary: "Twenty-seven small bones arranged for both strong grip and delicate precision.",
    function:
      "Eight carpal bones make up the wrist, five metacarpals form the palm and fourteen phalanges make the fingers and thumb. The thumb's saddle-shaped joint lets it swing across the palm to meet each fingertip, which is the basis of precision grip. Tendons run from muscles in the forearm to move the fingers.",
    whyItMatters:
      "Loss of the thumb's opposition costs a hand most of its usefulness. Because the hand is so bone- and joint-dense, it is a common site of osteoarthritis and of sports and fall injuries.",
    funFact:
      "Together the two hands hold more than a quarter of all the bones in the body.",
    stats: [
      { label: "Bones per hand", value: "27 (8 carpal, 5 metacarpal, 14 phalanges)" },
      { label: "Both hands", value: "54 of the body's 206 bones" },
      { label: "Carpal bones in two rows", value: "4 + 4" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK535382/",
      "https://www.nhs.uk/conditions/osteoarthritis/",
    ],
  },

  leg_left: {
    id: "leg_left",
    label: "Left leg",
    group: "skeleton",
    summary: "Femur, kneecap, tibia and fibula: the long levers that carry your weight and drive walking and running.",
    function:
      "The femur in the thigh is the longest and strongest bone in the body, ending in a ball that sits in the hip socket. At the knee it meets the tibia, the main weight-bearing shin bone, with the patella riding in front of the joint to increase the pull of the thigh muscles. The slimmer fibula beside the tibia mostly anchors muscles and steadies the ankle.",
    whyItMatters:
      "Leg bones are where age-related bone loss does the most damage, because a broken hip or thigh bone in later life can end independence. Regular weight-bearing exercise is one of the best ways to keep them strong.",
    funFact:
      "The kneecap is the body's largest sesamoid bone, a bone that forms inside a tendon.",
    stats: [
      { label: "Bones per leg", value: "4 (femur, tibia, fibula, patella)" },
      { label: "Femur length", value: "about a quarter of body height (roughly 45 to 50 cm)" },
      { label: "Peak bone mass reached", value: "late twenties to about 30" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK532982/",
      "https://www.niams.nih.gov/health-topics/bone-health",
    ],
  },

  leg_right: {
    id: "leg_right",
    label: "Right leg",
    group: "skeleton",
    summary: "Femur, kneecap, tibia and fibula: the long levers that carry your weight and drive walking and running.",
    function:
      "The femur in the thigh is the longest and strongest bone in the body, ending in a ball that sits in the hip socket. At the knee it meets the tibia, the main weight-bearing shin bone, with the patella riding in front of the joint to increase the pull of the thigh muscles. The slimmer fibula beside the tibia mostly anchors muscles and steadies the ankle.",
    whyItMatters:
      "Leg bones are where age-related bone loss does the most damage, because a broken hip or thigh bone in later life can end independence. Regular weight-bearing exercise is one of the best ways to keep them strong.",
    funFact:
      "Both knees are held stable by the same four main ligaments, including the two cruciates that cross inside the joint.",
    stats: [
      { label: "Bones per leg", value: "4 (femur, tibia, fibula, patella)" },
      { label: "Femur length", value: "about a quarter of body height (roughly 45 to 50 cm)" },
      { label: "Peak bone mass reached", value: "late twenties to about 30" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK532982/",
      "https://www.niams.nih.gov/health-topics/bone-health",
    ],
  },

  foot_left: {
    id: "foot_left",
    label: "Left foot",
    group: "skeleton",
    summary: "Twenty-six bones and a set of arches that turn each step into a spring.",
    function:
      "Seven tarsal bones form the ankle and heel, five metatarsals form the midfoot and fourteen phalanges make the toes. The calcaneus (heel bone) takes first contact, the talus passes load up to the shin, and the arches flex to absorb the shock and then stiffen to push off. Ligaments and tendons, not just the bones, hold the arches in shape.",
    whyItMatters:
      "The foot carries the full weight of the body many thousands of times a day, so small alignment problems can show up as pain in the knee, hip or back. Ankle sprains, which stretch the ligaments there, are among the most common sports injuries.",
    funFact:
      "When you run, each foot briefly takes a force of about two to three times your body weight.",
    stats: [
      { label: "Bones per foot", value: "26 (7 tarsal, 5 metatarsal, 14 phalanges)" },
      { label: "Both feet", value: "52 of the body's 206 bones" },
      { label: "Force on landing when running", value: "2 to 3 times body weight" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK557447/"],
  },

  foot_right: {
    id: "foot_right",
    label: "Right foot",
    group: "skeleton",
    summary: "Twenty-six bones and a set of arches that turn each step into a spring.",
    function:
      "Seven tarsal bones form the ankle and heel, five metatarsals form the midfoot and fourteen phalanges make the toes. The calcaneus (heel bone) takes first contact, the talus passes load up to the shin, and the arches flex to absorb the shock and then stiffen to push off. Ligaments and tendons, not just the bones, hold the arches in shape.",
    whyItMatters:
      "The foot carries the full weight of the body many thousands of times a day, so small alignment problems can show up as pain in the knee, hip or back. Ankle sprains, which stretch the ligaments there, are among the most common sports injuries.",
    funFact:
      "Together your two feet hold about a quarter of all your bones.",
    stats: [
      { label: "Bones per foot", value: "26 (7 tarsal, 5 metatarsal, 14 phalanges)" },
      { label: "Both feet", value: "52 of the body's 206 bones" },
      { label: "Arches per foot", value: "3 (medial, lateral, transverse)" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK557447/"],
  },

  larynx: {
    id: "larynx",
    label: "Larynx and hyoid",
    group: "skeleton",
    summary: "The voice box and the small floating bone above it that anchors the tongue and throat.",
    function:
      "The larynx is a frame of cartilages, including the thyroid cartilage that forms the Adam's apple, with the vocal folds stretched across its middle. Air pushed past the folds makes them vibrate, and small muscles change their tension and length to set the pitch. The hyoid bone above it suspends the larynx and gives the tongue and swallowing muscles something to pull against.",
    whyItMatters:
      "The larynx doubles as a valve that closes to keep food out of the windpipe, so voice and safe swallowing depend on the same small structure. Breaking the hyoid is unusual, which is why doctors pay close attention to it after neck injuries.",
    funFact:
      "The hyoid is the only bone in the body that does not articulate with another bone: it hangs in muscles and ligaments.",
    stats: [
      { label: "Vocal fold length", value: "about 17 to 25 mm in men, 12 to 17 mm in women" },
      { label: "Speaking pitch (fundamental)", value: "about 85 to 180 Hz in men, 165 to 255 Hz in women" },
      { label: "Larynx cartilages", value: "3 single, 3 paired" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK538202/",
      "https://www.ncbi.nlm.nih.gov/books/NBK553185/",
    ],
  },

  heart: {
    id: "heart",
    label: "Heart",
    group: "circulation",
    summary: "A fist-sized muscular pump that never rests, sending blood to the lungs and the rest of the body.",
    function:
      "The right side receives blood from the body and pumps it to the lungs to pick up oxygen; the left side receives it back and pumps it out through the aorta to everything else. Four valves keep the blood moving one way, and the heart's own coronary arteries feed the muscle. An electrical pacemaker in the right atrium sets the rhythm and the left ventricle, with the thickest wall, does the heaviest work.",
    whyItMatters:
      "Because it works every second of life, small problems with the coronary arteries or valves add up over decades, and heart disease is a leading cause of death worldwide. Its health responds well to exercise, not smoking and controlling blood pressure.",
    funFact:
      "The heart begins to beat about three weeks after conception, well before the rest of the body is recognisable.",
    stats: [
      { label: "Mass", value: "about 250 to 350 g" },
      { label: "Resting rate", value: "60 to 100 beats per minute" },
      { label: "Output at rest", value: "about 5 L per minute" },
      { label: "Beats per day", value: "roughly 100,000" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK470256/",
      "https://www.nhlbi.nih.gov/health/heart",
    ],
  },

  lungs: {
    id: "lungs",
    label: "Lungs",
    group: "respiratory",
    summary: "Two spongy organs where oxygen enters the blood and carbon dioxide leaves it.",
    function:
      "The right lung has three lobes and the left has two, leaving room for the heart. Air travels down branching tubes to about half a billion tiny sacs called alveoli, each wrapped in fine blood vessels, where gases swap across a membrane less than a thousandth of a millimetre thick. The diaphragm and rib muscles expand the chest to draw air in, and the lungs' elastic recoil pushes it back out.",
    whyItMatters:
      "The lungs are built with big spare capacity, so damage from smoking, infection or pollution can go unnoticed for years. Lung function slowly declines with age, which is why keeping it high in early adulthood pays off later.",
    funFact:
      "Spread flat, the alveoli would cover about 70 square metres by the classic estimate, roughly a badminton court, though newer measurements give higher figures.",
    stats: [
      { label: "Lobes", value: "5 (3 right, 2 left)" },
      { label: "Alveoli", value: "about 480 million" },
      { label: "Total capacity (adult male)", value: "about 6 L" },
      { label: "Breaths at rest", value: "12 to 20 per minute" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK470197/",
      "https://www.nhlbi.nih.gov/health/lungs",
    ],
  },

  airway: {
    id: "airway",
    label: "Airway",
    group: "respiratory",
    summary: "The windpipe and its branches, a tree of tubes that carries air down to the lungs.",
    function:
      "The trachea is held open by a stack of C-shaped cartilage rings and lined with hair-like cilia that sweep mucus and trapped dust upward. At the carina it splits into the left and right main bronchi, which divide again into lobar and segmental bronchi that reach each part of the lung. Around twenty-three branchings take the air from the trachea to the alveoli.",
    whyItMatters:
      "Anything that narrows these tubes, such as asthma, infection or an inhaled object, cuts airflow quickly, because resistance rises steeply as the tube gets narrower. The cilia are why smokers develop a cough: smoke paralyses the sweepers.",
    funFact:
      "The right main bronchus is shorter, wider and steeper than the left, so inhaled objects such as a swallowed peanut more often end up on the right.",
    stats: [
      { label: "Trachea length", value: "about 10 to 12 cm" },
      { label: "Trachea diameter", value: "about 2 to 2.5 cm" },
      { label: "Cartilage rings", value: "16 to 20, C-shaped" },
      { label: "Branching generations to the alveoli", value: "about 23" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK556044/"],
  },

  liver: {
    id: "liver",
    label: "Liver",
    group: "digestive",
    summary: "The body's largest internal organ and its chemical processing plant.",
    function:
      "Blood from the gut arrives through the portal vein so the liver can process nutrients, store energy as glycogen, make bile for fat digestion and clear alcohol, drugs and waste. It also builds proteins such as clotting factors and albumin. Its tissue is divided into eight functional segments, each with its own blood supply and bile drainage.",
    whyItMatters:
      "The liver can be badly damaged before it causes pain, so problems such as fatty liver and hepatitis are often found by blood tests. Uniquely, it can regenerate, but repeated injury eventually scars it (cirrhosis).",
    funFact:
      "A liver can regrow to near full size within weeks to months after a large part is removed, which is why living donors can give part of theirs.",
    stats: [
      { label: "Mass", value: "about 1.5 kg" },
      { label: "Blood flow", value: "about 1.5 L per minute (roughly a quarter of cardiac output)" },
      { label: "Functional segments", value: "8" },
      { label: "Known functions", value: "more than 500" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK500014/",
      "https://www.nhs.uk/conditions/liver-disease/",
    ],
  },

  gallbladder: {
    id: "gallbladder",
    label: "Gallbladder and bile duct",
    group: "digestive",
    summary: "A small pear-shaped pouch under the liver that stores bile until a fatty meal calls for it.",
    function:
      "The liver makes bile constantly, and the gallbladder holds it and concentrates it several-fold. When fatty food reaches the small intestine, a hormone signals the gallbladder to squeeze bile down the bile duct into the duodenum, where it breaks fat into droplets that enzymes can digest. The same duct meets the pancreatic duct just before it enters the gut.",
    whyItMatters:
      "Bile can crystallise into gallstones, which are common and can block the duct, causing sharp pain or inflammation of the gallbladder or pancreas. Removing the gallbladder is routine and most people manage well without it.",
    funFact:
      "The liver makes bile all day, but after removal of the gallbladder it simply trickles straight into the gut.",
    stats: [
      { label: "Length", value: "about 7 to 10 cm" },
      { label: "Storage capacity", value: "about 30 to 50 mL" },
      { label: "Bile made by the liver each day", value: "about 500 to 1,000 mL" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK459288/",
      "https://www.niddk.nih.gov/health-information/digestive-diseases/gallstones",
    ],
  },

  pancreas: {
    id: "pancreas",
    label: "Pancreas",
    group: "digestive",
    summary: "A long, soft gland behind the stomach that makes both digestive enzymes and blood-sugar hormones.",
    function:
      "Most of the gland produces a juice rich in enzymes that digest fat, protein and starch, and sends it through the pancreatic duct into the duodenum. Scattered through it, about a million clusters of cells called the islets of Langerhans make insulin, which lowers blood sugar, and glucagon, which raises it. The organ lies across the upper abdomen from the duodenum to the spleen.",
    whyItMatters:
      "When islet cells fail or the body stops responding to insulin, the result is diabetes. Because the organ is deep and its illnesses are often silent, pancreatic problems such as pancreatitis and cancer can be hard to catch early.",
    funFact:
      "Its name comes from the Greek for all flesh, because early anatomists saw no bone or cartilage in it.",
    stats: [
      { label: "Length", value: "about 12 to 15 cm" },
      { label: "Mass", value: "about 80 to 100 g" },
      { label: "Islets of Langerhans", value: "about 1 million" },
      { label: "Digestive juice per day", value: "about 1 L" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK532912/",
      "https://www.niddk.nih.gov/health-information/digestive-diseases/pancreatitis",
    ],
  },

  spleen: {
    id: "spleen",
    label: "Spleen",
    group: "lymphatic",
    summary: "A fist-sized organ under the left ribs that filters the blood and stands guard against infection.",
    function:
      "Blood flows slowly through its pulp, where macrophages remove worn-out red cells and trap bacteria. Its white pulp holds lymphocytes that respond to germs in the blood and make antibodies. It also stores a reserve of blood cells and platelets that can be released in an emergency.",
    whyItMatters:
      "You can live without it, but people who have lost their spleen are more prone to severe infection by certain bacteria and are advised to be vaccinated. Because it is soft and lies beneath the ribs, a heavy blow to the left side can rupture it.",
    funFact:
      "Around one person in ten carries a small extra spleen, called an accessory spleen, somewhere near the main one.",
    stats: [
      { label: "Length", value: "about 12 cm" },
      { label: "Mass", value: "about 150 g" },
      { label: "Red cell lifespan it enforces", value: "about 120 days" },
      { label: "Share of cardiac output", value: "about 5%" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK482235/"],
  },

  stomach: {
    id: "stomach",
    label: "Stomach",
    group: "digestive",
    summary: "A stretchy muscular bag that mixes food with acid and enzymes and hands it on in small portions.",
    function:
      "Its wall contracts in waves to churn food into a paste while glands release hydrochloric acid and pepsin to begin protein digestion. A thick layer of mucus protects the lining from its own acid. A ring of muscle at the exit releases the mixture into the duodenum a little at a time.",
    whyItMatters:
      "When the protective lining is damaged, often by Helicobacter pylori infection or anti-inflammatory drugs, ulcers can form. Stomach cancer and ulcer bleeding are the main serious problems.",
    funFact:
      "The lining renews itself every few days so that the acid never wears a hole in it.",
    stats: [
      { label: "Comfortable capacity", value: "about 1 to 1.5 L (stretches to 2 to 3 L)" },
      { label: "Acidity", value: "pH about 1.5 to 3.5" },
      { label: "Time food stays", value: "roughly 2 to 4 hours" },
      { label: "Lining renewal", value: "every 3 to 4 days" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK482334/",
      "https://www.nhs.uk/conditions/stomach-ulcer/",
    ],
  },

  small_intestine: {
    id: "small_intestine",
    label: "Small intestine",
    group: "digestive",
    summary: "A long coiled tube where most digestion finishes and nearly all nutrients enter the blood.",
    function:
      "The duodenum, the first stretch, receives bile and pancreatic juice and finishes chemical digestion. The jejunum and ileum that follow are lined with millions of finger-like villi and microscopic microvilli, which multiply the surface many-fold so nutrients can be absorbed. Waves of muscle contraction push the contents along. This model shows the duodenum and jejunum only.",
    whyItMatters:
      "Coeliac disease, which flattens the villi, shows how much depends on that surface: it can cause weight loss, anaemia and poor growth. Crohn's disease and blocked loops of bowel are other common reasons for surgery.",
    funFact:
      "Its name refers to its width, not its length: it is the longest part of the gut but narrower than the large intestine.",
    stats: [
      { label: "Length", value: "about 3 to 5 m in life (longer after death)" },
      { label: "Absorbing surface", value: "about 30 m2" },
      { label: "Duodenum length", value: "about 25 cm" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK459366/",
      "https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works",
    ],
  },

  large_intestine: {
    id: "large_intestine",
    label: "Large intestine",
    group: "digestive",
    summary: "The wide final section of the gut that reclaims water and compacts what is left into stool.",
    function:
      "The colon frames the abdomen in four parts, ascending, transverse, descending and sigmoid, and the appendix hangs off the first pocket, the caecum. It absorbs water and salts and is home to trillions of bacteria that ferment fibre and produce vitamin K and short-chain fatty acids. Its muscle ribbons, called taeniae coli, gather the wall into pouches called haustra.",
    whyItMatters:
      "Bowel cancer usually begins as a small polyp that takes years to turn dangerous, which is why screening from around age 45 to 50 saves lives. Diet high in fibre keeps the colon moving and feeds the helpful bacteria.",
    funFact:
      "The gut's bacteria are commonly estimated at about as many as the body's own cells, roughly 38 trillion.",
    stats: [
      { label: "Length", value: "about 1.5 m" },
      { label: "Resident bacteria", value: "about 38 trillion" },
      { label: "Time for contents to pass through", value: "roughly 12 to 48 hours" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK470577/",
      "https://www.nhs.uk/conditions/bowel-cancer/",
    ],
  },

  bladder: {
    id: "bladder",
    label: "Bladder and urinary tract",
    group: "urinary",
    summary: "A stretchy muscular bag that stores urine until you choose to empty it.",
    function:
      "Two narrow ureters carry urine down from the kidneys, and the bladder wall relaxes to hold it without a large rise in pressure. Stretch receptors signal fullness, and when you decide to go, the detrusor muscle in the wall contracts as the sphincters release. The urethra carries urine out of the body. The kidneys are not shown in this model.",
    whyItMatters:
      "Bladder control depends on nerves, muscles and the brain working together, and can weaken with age, childbirth or prostate enlargement. Infections that start here can travel up the ureters to the kidneys.",
    funFact:
      "The bladder's lining is one of the tightest barriers in the body, keeping the salty, waste-laden urine from leaking back into the blood.",
    stats: [
      { label: "Capacity", value: "up to about 500 mL" },
      { label: "First urge to pass urine", value: "around 150 to 300 mL" },
      { label: "Urine made per day", value: "about 1 to 2 L" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK531465/",
      "https://www.nhs.uk/conditions/urinary-incontinence/",
    ],
  },

  thyroid: {
    id: "thyroid",
    label: "Thyroid and parathyroid glands",
    group: "endocrine",
    summary: "A butterfly-shaped gland in the neck that sets the body's metabolic pace, with four tiny partners that control calcium.",
    function:
      "The thyroid takes up iodine from food and uses it to make thyroxine (T4) and triiodothyronine (T3), which set how quickly cells use energy and affect heart rate, temperature and weight. The pituitary keeps the output in balance through thyroid-stimulating hormone. Four parathyroid glands, each about the size of a grain of rice, sit behind it and keep blood calcium steady.",
    whyItMatters:
      "An underactive thyroid slows everything down and an overactive one speeds it up, and both are common and easy to test for. Lumps in the thyroid are also common and are mostly harmless.",
    funFact:
      "Iodine added to table salt in many countries was introduced specifically to prevent goitre, a swollen thyroid.",
    stats: [
      { label: "Mass", value: "about 20 to 25 g" },
      { label: "Iodine needed", value: "about 150 micrograms per day" },
      { label: "Parathyroid glands", value: "4, each about 5 mm" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK470452/",
      "https://www.niddk.nih.gov/health-information/endocrine-diseases/hypothyroidism",
    ],
  },

  oesophagus: {
    id: "oesophagus",
    label: "Oesophagus",
    group: "digestive",
    summary: "The muscular tube that carries every swallow from the throat to the stomach.",
    function:
      "A wave of muscle contraction called peristalsis squeezes food downward, so swallowing works even when you are lying down or upside down. A sphincter at the top opens only to let food in, and another at the bottom opens to admit food to the stomach and then closes to keep acid out. The tube runs behind the windpipe and heart and passes through the diaphragm.",
    whyItMatters:
      "If the lower sphincter leaks, stomach acid burns the lining, which is what heartburn is; long-term reflux can change the lining and raise cancer risk. Trouble swallowing is always worth checking.",
    funFact:
      "A swallow takes only a few seconds to reach the stomach, and you make several hundred of them every day.",
    stats: [
      { label: "Length", value: "about 25 cm" },
      { label: "Diameter", value: "about 2 cm" },
      { label: "Transit time for a swallow", value: "about 5 to 8 seconds" },
    ],
    sources: ["https://www.ncbi.nlm.nih.gov/books/NBK482513/"],
  },

  reproductive: {
    id: "reproductive",
    label: "Male reproductive organs",
    group: "reproductive",
    summary: "The testes and the ducts and glands that produce and deliver sperm (this model is male only).",
    function:
      "The testes make sperm and the hormone testosterone. Sperm mature and are stored in the epididymis, then travel along the ductus deferens, past the seminal glands and prostate, which add the fluid that makes up most of semen. The scrotum keeps the testes a few degrees cooler than the rest of the body, which sperm production needs.",
    whyItMatters:
      "Testicular cancer is the most common cancer in young men and is highly treatable when found early. Prostate enlargement and prostate cancer become more common with age.",
    funFact:
      "Sperm take about two and a half months to develop from start to finish.",
    stats: [
      { label: "Testis size", value: "about 5 cm long, 3 cm wide" },
      { label: "Testes temperature", value: "about 2 to 4 degrees C below core" },
      { label: "Sperm development time", value: "roughly 70 days" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK470201/",
      "https://www.ncbi.nlm.nih.gov/books/NBK540987/",
    ],
  },

  endocrine: {
    id: "endocrine",
    label: "Pituitary, pineal and adrenal glands",
    group: "endocrine",
    summary: "Three small hormone glands: the pea-sized master gland under the brain, the pineal that tracks night, and the adrenals that handle stress.",
    function:
      "The pituitary hangs beneath the hypothalamus and releases hormones that control growth, thyroid activity, water balance and the sex organs. The pineal gland deep in the brain releases melatonin in darkness, which cues sleep. One adrenal gland sits on top of each kidney, and together they release cortisol, adrenaline and hormones that manage salt and blood pressure.",
    whyItMatters:
      "A tiny tumour on the pituitary can throw off many other glands at once. The adrenals let the body respond to stress, but too much or too little cortisol causes serious illness.",
    funFact:
      "The philosopher Descartes called the pineal gland the principal seat of the soul.",
    stats: [
      { label: "Pituitary mass", value: "about 0.5 g" },
      { label: "Adrenal mass", value: "about 4 to 5 g each" },
      { label: "Pineal length", value: "about 1 cm" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK551529/",
      "https://www.ncbi.nlm.nih.gov/books/NBK482264/",
    ],
  },

  mouth_throat: {
    id: "mouth_throat",
    label: "Mouth and throat",
    group: "digestive",
    summary: "The tongue, salivary glands, palate and pharynx that taste, chew, swallow and speak.",
    function:
      "Three pairs of major salivary glands, the parotid, submandibular and sublingual, wet food and start starch digestion. The tongue, a bundle of eight muscles, moves food and shapes speech and carries the taste buds. The soft palate and pharynx guide each swallow, closing off the nose and windpipe at the right moment.",
    whyItMatters:
      "Saliva protects teeth and clears germs, which is why a dry mouth leads to decay. Coordinating breathing, swallowing and speech in the same narrow space is difficult, and it can go wrong after a stroke.",
    funFact:
      "Your taste buds replace themselves roughly every ten to fourteen days.",
    stats: [
      { label: "Saliva per day", value: "about 0.5 to 1.5 L" },
      { label: "Major salivary gland pairs", value: "3" },
      { label: "Tongue muscles", value: "8" },
      { label: "Taste bud renewal", value: "every 10 to 14 days" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK538325/",
      "https://www.ncbi.nlm.nih.gov/books/NBK507782/",
    ],
  },

  other: {
    id: "other",
    label: "Membranes and folds (pleura, omenta, mesocolon)",
    group: "supporting tissue",
    summary: "The slippery linings and fatty aprons that let organs glide and hold them in place.",
    function:
      "The pleura is a two-layer membrane around each lung with a thin film of fluid between the layers, so the lung slides against the chest wall as you breathe. In the abdomen, the peritoneum lines the cavity and folds to form the greater omentum, a fatty apron that hangs from the stomach, and the mesocolon, which suspends the colon and carries its blood vessels. The lesser omentum links the stomach and liver.",
    whyItMatters:
      "If air or fluid gets between the pleural layers, the lung is squeezed and can collapse. The omentum can wall off infection and is sometimes called the abdominal policeman.",
    funFact:
      "The peritoneum's surface area is about the same as that of the skin.",
    stats: [
      { label: "Pleural layers per lung", value: "2" },
      { label: "Pleural fluid per side", value: "roughly 10 mL" },
      { label: "Peritoneal surface area", value: "about 1.8 m2" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK541079/",
      "https://www.ncbi.nlm.nih.gov/books/NBK534788/",
    ],
  },

  thymus: {
    id: "thymus",
    label: "Thymus",
    group: "lymphatic",
    summary: "A two-lobed gland behind the breastbone where young T cells are trained, and which shrinks after puberty.",
    function:
      "Immature T cells arrive from the bone marrow and are tested in the thymus so that those that attack the body's own tissues are removed and the rest are ready to fight infections. It is largest relative to body size in infancy and peaks in absolute size around puberty. After that it slowly shrinks and is replaced by fat.",
    whyItMatters:
      "The thymus is a big part of why children build immunity so quickly, and its slow fading is one reason immune responses weaken with age. A missing or underdeveloped thymus at birth causes severe immune deficiency.",
    funFact:
      "Thymic output falls by about 3% a year until middle age and about 1% a year afterwards.",
    stats: [
      { label: "Peak mass", value: "about 30 to 40 g around puberty" },
      { label: "Newborn mass", value: "about 10 to 15 g" },
      { label: "Yearly decline in output", value: "about 3% to middle age, then about 1%" },
    ],
    sources: [
      "https://training.seer.cancer.gov/anatomy/lymphatic/",
      "https://medlineplus.gov/ency/article/004008.htm",
    ],
  },

  tonsils: {
    id: "tonsils",
    label: "Palatine tonsils",
    group: "lymphatic",
    summary: "Two lumps of immune tissue on either side of the back of the throat that sample what you breathe and swallow.",
    function:
      "The tonsils are lined with deep crypts that trap bacteria and viruses from the mouth and nose so that immune cells beneath can learn to recognise them and make antibodies. They belong to a ring of lymphoid tissue around the throat that also includes the adenoids and the tissue at the base of the tongue. They are largest in childhood and shrink after puberty.",
    whyItMatters:
      "The same crypts that trap germs can become infected, which is tonsillitis, and repeated infections are the main reason for removal. Once past childhood, the rest of the immune system covers for them.",
    funFact:
      "Debris in the crypts can harden into small tonsil stones, which are harmless but cause bad breath.",
    stats: [
      { label: "Size", value: "about 2.5 cm long" },
      { label: "Number of palatine tonsils", value: "2" },
      { label: "Largest size", value: "about ages 4 to 10" },
    ],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK539792/",
      "https://www.nhs.uk/conditions/tonsillitis/",
    ],
  },

  ...skeletonPartCopy,
};

/** check:sidecar reads every feature's book under this name. */
export { bodyCopy as copyBook };
