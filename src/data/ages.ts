export type AgeStage = "infant" | "toddler" | "child" | "teen" | "youngAdult" | "adult" | "senior";

export interface AgeStageInfo {
  id: AgeStage;
  label: string;
  years: string;
  /** Typical standing (or lying) length for the stage. */
  height: string;
  /**
   * Whole-body scale as a fraction of the adult model's height (illustrative).
   * A part's `scale` in ageNotes is applied ON TOP of this, so it describes the
   * part's size relative to the same part in an adult AFTER the body has been
   * scaled to this height. That is how "infant skull proportionally larger"
   * shows up as a value above 1 while the whole infant body is small.
   */
  heightScale: number;
  note: string;
}

export const ageStages: AgeStageInfo[] = [
  { id: "infant", label: "Infant", years: "0 to 1 year", height: "about 50 to 75 cm", heightScale: 0.4, note: "The fastest growth of life: length grows by about half in the first year and the brain roughly doubles in volume." },
  { id: "toddler", label: "Toddler", years: "1 to 3 years", height: "about 75 to 95 cm", heightScale: 0.52, note: "Walking, talking and a burst of new brain connections; the head is still large compared with the body." },
  { id: "child", label: "Child", years: "4 to 12 years", height: "about 100 to 150 cm", heightScale: 0.72, note: "Steady growth of about 5 to 7 cm a year, with baby teeth replaced and body proportions moving towards adult." },
  { id: "teen", label: "Teen", years: "13 to 19 years", height: "about 150 to 180 cm", heightScale: 0.95, note: "The pubertal growth spurt: about a quarter of adult bone mass is laid down in the two years around peak growth." },
  { id: "youngAdult", label: "Young adult", years: "20 to 34 years", height: "about 160 to 185 cm", heightScale: 1, note: "Growth plates have closed and most systems are at or near their peak." },
  { id: "adult", label: "Adult", years: "35 to 64 years", height: "about 160 to 185 cm (slow shrinkage from about 40)", heightScale: 1, note: "A long plateau, with gradual declines in bone density, lung function and blood-vessel flexibility beginning." },
  { id: "senior", label: "Senior", years: "65+ years", height: "typically 1 to 3 cm shorter than at peak", heightScale: 0.98, note: "Age-related change becomes noticeable in the brain, bones, heart and lungs, though the pace varies enormously between people." },
];

export type AgeRisk = "low" | "medium" | "high";
export type AgeTint = "growth" | "peak" | "decline";

export interface AgeNote {
  note: string;
  /** Size of the part relative to an adult part, after whole-body scaling (see AgeStageInfo.heightScale). */
  scale?: number;
  risk?: AgeRisk;
  tint?: AgeTint;
}

export type AgeNotes = Record<string /* body group id, plus "brain" for the brain-map regions */, Partial<Record<AgeStage, AgeNote>>>;

const legNotes: Partial<Record<AgeStage, AgeNote>> = {
  infant: { note: "Leg bones are still largely cartilage and proportionally short, and bowed legs are normal at this age.", scale: 0.62, risk: "low", tint: "growth" },
  toddler: { note: "Bowed legs usually straighten by about age 2 to 3, and many children pass through a knock-kneed phase before they finish straightening.", scale: 0.75, risk: "low", tint: "growth" },
  child: { note: "Legs grow steadily from active growth plates near the hips and knees, adding roughly 5 to 6 cm of height a year.", scale: 0.9, risk: "low", tint: "growth" },
  teen: { note: "About a quarter of adult bone mass is laid down in the two years around peak growth, so this is the time to build bone.", scale: 1.0, risk: "low", tint: "growth" },
  youngAdult: { note: "Growth plates have closed and peak bone mass is reached in the late twenties to about 30.", scale: 1.0, risk: "low", tint: "peak" },
  adult: { note: "Bone density starts a slow decline, roughly half a percent a year, unless it is protected by exercise, calcium and vitamin D.", scale: 1.0, risk: "medium", tint: "decline" },
  senior: { note: "Bone loss speeds up, especially in women after menopause, and osteoporosis makes hip and thigh fractures a leading risk.", scale: 0.99, risk: "high", tint: "decline" },
};

const armNotes: Partial<Record<AgeStage, AgeNote>> = {
  infant: { note: "The arm bones are mostly cartilage at the ends, and the limbs are short next to the large head and trunk.", scale: 0.7, risk: "low", tint: "growth" },
  toddler: { note: "Arms lengthen quickly and gain the strength and control for climbing, throwing and feeding.", scale: 0.8, risk: "low", tint: "growth" },
  child: { note: "Growth plates near the shoulder and wrist keep the arms lengthening, and forearm fractures from falls are common and heal fast.", scale: 0.92, risk: "low", tint: "growth" },
  teen: { note: "The growth spurt brings the arms to adult length, and the growth plates close towards the end of the teens.", scale: 1.0, risk: "low", tint: "growth" },
  youngAdult: { note: "The arm bones are at full length and close to peak density.", scale: 1.0, risk: "low", tint: "peak" },
  adult: { note: "Bone density and grip strength begin a slow decline, which strength training can slow.", scale: 1.0, risk: "medium", tint: "decline" },
  senior: { note: "Weaker bones make a broken wrist from a fall one of the most common fractures, often the first sign of osteoporosis.", scale: 0.99, risk: "high", tint: "decline" },
};

const handNotes: Partial<Record<AgeStage, AgeNote>> = {
  infant: { note: "Most of the small wrist bones have not yet turned to bone, and the grasp reflex gives way to a deliberate grip over the first year.", scale: 0.75, risk: "low", tint: "growth" },
  toddler: { note: "The pincer grip between thumb and finger is refined, and the wrist bones start to appear on X-rays one by one.", scale: 0.82, risk: "low", tint: "growth" },
  child: { note: "Doctors estimate a child's bone age from an X-ray of the hand and wrist, because its bones mature in a known order.", scale: 0.92, risk: "low", tint: "growth" },
  teen: { note: "The hand reaches adult size, and its growth plates are among the last to close.", scale: 1.0, risk: "low", tint: "growth" },
  youngAdult: { note: "Grip strength and fine control are at their peak.", scale: 1.0, risk: "low", tint: "peak" },
  adult: { note: "Grip strength slowly falls, and osteoarthritis at the base of the thumb becomes more common from midlife.", scale: 1.0, risk: "medium", tint: "decline" },
  senior: { note: "Arthritis in the finger joints is very common, and weaker grip is linked to general frailty.", scale: 1.0, risk: "high", tint: "decline" },
};

const footNotes: Partial<Record<AgeStage, AgeNote>> = {
  infant: { note: "A baby's foot looks flat because a fat pad fills the arch, and most of its bones are still cartilage.", scale: 0.7, risk: "low", tint: "growth" },
  toddler: { note: "Flat feet are normal in new walkers, and the foot grows quickly, often needing a new shoe size every few months.", scale: 0.8, risk: "low", tint: "growth" },
  child: { note: "The arch usually forms by about age 6, and the foot keeps growing ahead of the rest of the body.", scale: 0.95, risk: "low", tint: "growth" },
  teen: { note: "Feet reach adult length early in puberty, before final height, which is why teenagers can look all feet.", scale: 1.0, risk: "low", tint: "growth" },
  youngAdult: { note: "The foot is at full size and strength.", scale: 1.0, risk: "low", tint: "peak" },
  adult: { note: "Ligaments slowly slacken, so feet can lengthen and flatten slightly, and bunions and heel pain become more common.", scale: 1.0, risk: "medium", tint: "decline" },
  senior: { note: "The fat pads under the heel and ball thin, arthritis stiffens the joints, and foot problems add to the risk of falls.", scale: 1.0, risk: "high", tint: "decline" },
};

/**
 * Illustrative, population-typical notes per body group, keyed by the ids in
 * body-map.json. "brain" is included for the brain view (brain-map.json regions
 * share it). Scales are design values for visual effect, not measurements.
 */
export const ageNotes: AgeNotes = {
  brain: {
    infant: { note: "The brain roughly doubles in volume in the first year, reaching about 70 percent of its adult size.", scale: 2.15, risk: "low", tint: "growth" },
    toddler: { note: "By age 3 it is about 80 to 85 percent of adult size while connections between neurons form at a huge rate.", scale: 1.8, risk: "low", tint: "growth" },
    child: { note: "It reaches about 90 percent of adult volume by age 6 as language, reading and memory circuits strengthen.", scale: 1.35, risk: "low", tint: "growth" },
    teen: { note: "Total volume is near adult size, but the prefrontal cortex is still maturing, which shapes impulse control and risk-taking.", scale: 1.05, risk: "low", tint: "growth" },
    youngAdult: { note: "Frontal-lobe maturation finishes around the mid-twenties, and mental processing speed is close to its peak.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Brain volume begins to shrink by a fraction of a percent a year from around 40, while vocabulary and experience keep growing.", scale: 1.0, risk: "low", tint: "decline" },
    senior: { note: "Volume loss speeds up and dementia becomes far more likely, affecting roughly 1 in 20 people at 65 to 74 and about 1 in 3 at 85 and over.", scale: 0.99, risk: "high", tint: "decline" },
  },
  heart: {
    infant: { note: "The heart beats about 100 to 160 times a minute and sits proportionally larger in the chest than it will later.", scale: 1.15, risk: "low", tint: "growth" },
    toddler: { note: "Resting rate has slowed to roughly 90 to 140 beats per minute, and the heart keeps growing with the body.", scale: 1.12, risk: "low", tint: "growth" },
    child: { note: "Resting rate settles to about 70 to 115 beats per minute, and a healthy child's heart is very efficient and rarely diseased.", scale: 1.08, risk: "low", tint: "growth" },
    teen: { note: "Resting rate approaches the adult range of 60 to 100, and the heart and aerobic capacity grow rapidly through puberty.", scale: 1.03, risk: "low", tint: "growth" },
    youngAdult: { note: "Maximum heart rate and aerobic fitness are highest here, and both slip gradually from now on.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Arteries slowly stiffen and plaque can begin to build, so blood pressure and cholesterol checks matter.", scale: 1.0, risk: "medium", tint: "decline" },
    senior: { note: "The walls stiffen and fill less easily, and coronary artery disease, heart failure and atrial fibrillation become much more common.", scale: 1.02, risk: "high", tint: "decline" },
  },
  lungs: {
    infant: { note: "The air sacs are still multiplying and a baby breathes about 30 to 60 times a minute.", scale: 0.85, risk: "low", tint: "growth" },
    toddler: { note: "New air sacs keep forming through early childhood, and breathing has slowed to about 24 to 40 breaths a minute.", scale: 0.88, risk: "low", tint: "growth" },
    child: { note: "The lungs keep growing through the school years and a child breathes about 18 to 25 times a minute.", scale: 0.93, risk: "low", tint: "growth" },
    teen: { note: "Lung volume climbs with height and reaches its adult size in the late teens.", scale: 0.99, risk: "low", tint: "growth" },
    youngAdult: { note: "Lung function peaks in the early to mid twenties.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Capacity begins a slow decline, with the amount of air blown out in one second falling roughly 25 to 30 mL a year, faster in smokers.", scale: 1.0, risk: "medium", tint: "decline" },
    senior: { note: "The chest wall stiffens and air sacs lose elastic recoil, so capacity is lower and pneumonia and COPD are bigger risks.", scale: 1.0, risk: "high", tint: "decline" },
  },
  liver: {
    infant: { note: "The liver is proportionally large, about 4 to 5 percent of body weight against about 2 percent in adults, and drug-clearing enzymes are still maturing.", scale: 1.25, risk: "low", tint: "growth" },
    toddler: { note: "It stays relatively large, and its detoxifying enzymes reach near-adult activity over the first years.", scale: 1.2, risk: "low", tint: "growth" },
    child: { note: "By school age the liver's share of body weight approaches the adult value of about 2 to 3 percent.", scale: 1.12, risk: "low", tint: "growth" },
    teen: { note: "It reaches adult size and function, though fatty liver linked to excess weight can already appear.", scale: 1.03, risk: "low", tint: "growth" },
    youngAdult: { note: "Full adult function and excellent ability to regenerate.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Alcohol, viral hepatitis and fatty liver disease are the main threats, and roughly 1 in 4 adults worldwide has some fatty liver.", scale: 1.0, risk: "medium", tint: "peak" },
    senior: { note: "Liver volume and blood flow decline noticeably, so many drugs are cleared more slowly and doses often need adjusting.", scale: 0.93, risk: "medium", tint: "decline" },
  },
  spine: {
    infant: { note: "The spine starts as a single C-shaped curve, and the neck curve appears as the baby lifts its head at about 3 to 4 months.", scale: 1.3, risk: "low", tint: "growth" },
    toddler: { note: "The lower-back curve develops as the child stands and walks, and the spine straightens out of its infant C shape.", scale: 1.18, risk: "low", tint: "growth" },
    child: { note: "The vertebrae keep growing and the spine settles into its adult S-shaped curves.", scale: 1.07, risk: "low", tint: "growth" },
    teen: { note: "The growth spurt lengthens the spine fastest, and this is also when adolescent scoliosis most often appears.", scale: 1.0, risk: "low", tint: "growth" },
    youngAdult: { note: "The growth plates in the vertebrae close by about the early twenties, leaving the spine at full length and strength.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Discs slowly lose water and height, and low back pain is very common in this age range.", scale: 1.0, risk: "medium", tint: "decline" },
    senior: { note: "Disc thinning, arthritis and osteoporosis can compress vertebrae, causing height loss and stooping, and spinal fractures become common.", scale: 0.97, risk: "high", tint: "decline" },
  },
  skull: {
    infant: { note: "The bones are not yet fused, and soft spots let the head grow, so the skull is large relative to the face.", scale: 2.05, risk: "low", tint: "growth" },
    toddler: { note: "The front soft spot closes at about 12 to 18 months and the skull has reached most of its adult size.", scale: 1.7, risk: "low", tint: "growth" },
    child: { note: "The braincase is nearly full-sized by about age 6, while the face keeps growing down and forward and baby teeth start to be replaced.", scale: 1.3, risk: "low", tint: "growth" },
    teen: { note: "The face lengthens and the jaws grow through puberty, and wisdom teeth begin to come through from about 17.", scale: 1.03, risk: "low", tint: "growth" },
    youngAdult: { note: "The joints between the skull bones begin to fuse very slowly, and the skeleton is at peak density.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "The bony frame of the face slowly remodels, with the eye sockets widening slightly and the jaw changing shape.", scale: 1.0, risk: "low", tint: "decline" },
    senior: { note: "Tooth loss shrinks the jawbone and the facial skeleton remodels further, which changes the shape of the lower face.", scale: 1.0, risk: "medium", tint: "decline" },
  },
  ribcage: {
    infant: { note: "The ribs run nearly horizontal, giving a round barrel shape, so babies rely mostly on the diaphragm to breathe.", scale: 1.2, risk: "low", tint: "growth" },
    toddler: { note: "The ribs begin to angle downward as the child stands and walks, and the cartilage is still very flexible.", scale: 1.12, risk: "low", tint: "growth" },
    child: { note: "The chest widens and deepens towards the adult oval, and the springy ribs rarely break.", scale: 1.05, risk: "low", tint: "growth" },
    teen: { note: "Growth of the ribs and breastbone completes in the late teens.", scale: 1.0, risk: "low", tint: "growth" },
    youngAdult: { note: "The ribcage is at its most flexible and strongest.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "The cartilage joining the ribs to the breastbone begins to calcify, making the chest wall slowly stiffer.", scale: 1.0, risk: "low", tint: "decline" },
    senior: { note: "A stiffer, more calcified cage and weaker bones make rib fractures more likely and breathing less efficient.", scale: 0.98, risk: "medium", tint: "decline" },
  },
  pelvis: {
    infant: { note: "Each hip bone is still three parts joined by cartilage and the sockets are shallow, which is why newborns are checked for hip problems.", scale: 0.8, risk: "low", tint: "growth" },
    toddler: { note: "The three parts stay separate and the hip socket deepens as the child begins to walk.", scale: 0.85, risk: "low", tint: "growth" },
    child: { note: "The pelvis broadens gradually and the cartilage that will fuse the bones keeps growing.", scale: 0.92, risk: "low", tint: "growth" },
    teen: { note: "The three parts fuse in the mid to late teens and the pelvis widens noticeably at puberty, especially in girls.", scale: 0.99, risk: "low", tint: "growth" },
    youngAdult: { note: "Fusion is complete and bone density in the hip is at its peak.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Bone density in the hip starts to decline slowly.", scale: 1.0, risk: "medium", tint: "decline" },
    senior: { note: "Hip and pelvic fractures become a leading cause of hospital admission in older adults because of osteoporosis and falls.", scale: 1.0, risk: "high", tint: "decline" },
  },
  leg_left: legNotes,
  leg_right: legNotes,
  arm_left: armNotes,
  arm_right: armNotes,
  hand_left: handNotes,
  hand_right: handNotes,
  foot_left: footNotes,
  foot_right: footNotes,
  large_intestine: {
    infant: { note: "The colon is colonised by bacteria within days of birth, shaped by the birth and feeding method, and the abdomen looks prominent.", scale: 1.15, risk: "low", tint: "growth" },
    toddler: { note: "Toilet training becomes possible as nerves and muscles mature at about 2 to 3 years.", scale: 1.1, risk: "low", tint: "growth" },
    child: { note: "Bowel habits settle into an adult-like pattern, and constipation is the common complaint.", scale: 1.05, risk: "low", tint: "growth" },
    teen: { note: "It is adult in size and function, and inflammatory bowel disease often first appears between the teens and the thirties.", scale: 1.0, risk: "low", tint: "growth" },
    youngAdult: { note: "Function is at its peak, and irritable bowel and inflammatory bowel disease are the usual concerns.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Polyps become more common, and screening for bowel cancer typically starts from about age 45 to 50.", scale: 1.0, risk: "medium", tint: "decline" },
    senior: { note: "Transit slows, pouches called diverticula form in the wall, and bowel cancer is most common at these ages, with most cases after 50.", scale: 1.0, risk: "high", tint: "decline" },
  },
  bladder: {
    infant: { note: "The bladder sits higher, in the abdomen, and empties by reflex with little voluntary control.", scale: 0.8, risk: "low", tint: "growth" },
    toddler: { note: "Awareness of fullness develops, and many children gain daytime control between ages 2 and 4.", scale: 0.9, risk: "low", tint: "growth" },
    child: { note: "Capacity grows steadily and most children stay dry at night by about age 5 to 7.", scale: 0.95, risk: "low", tint: "growth" },
    teen: { note: "It reaches adult capacity, up to about 500 mL, and has moved down into the pelvis.", scale: 1.0, risk: "low", tint: "growth" },
    youngAdult: { note: "Full adult function; urinary infections are the usual problem, especially in women.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Pelvic-floor and prostate changes begin to affect control, and overactive bladder becomes more common from midlife.", scale: 1.0, risk: "medium", tint: "decline" },
    senior: { note: "Capacity falls, the wall loses elasticity, and urgency, night-time trips and leaks become common.", scale: 0.95, risk: "medium", tint: "decline" },
  },
  thyroid: {
    infant: { note: "Newborns are screened at birth because thyroid hormone is essential for brain development.", scale: 1.1, risk: "low", tint: "growth" },
    toddler: { note: "Thyroid hormone keeps driving both brain growth and physical growth.", scale: 1.0, risk: "low", tint: "growth" },
    child: { note: "Thyroid problems are uncommon in childhood, but an underactive gland can slow growth.", scale: 1.0, risk: "low", tint: "growth" },
    teen: { note: "Puberty raises the demand for thyroid hormone, and autoimmune thyroid disease can first appear here.", scale: 1.0, risk: "low", tint: "growth" },
    youngAdult: { note: "Function is at its peak, and autoimmune thyroid disease is much more common in women.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Lumps called nodules and an underactive thyroid become more common with age.", scale: 1.0, risk: "medium", tint: "decline" },
    senior: { note: "An underactive thyroid affects roughly 5 to 10 percent of older adults, and nodules are found in many people on ultrasound.", scale: 0.95, risk: "medium", tint: "decline" },
  },
  stomach: {
    infant: { note: "The stomach holds only about 30 mL in the first days, growing to roughly 200 to 300 mL by the end of the first year.", scale: 0.9, risk: "low", tint: "growth" },
    toddler: { note: "Acid production reaches near-adult levels and the child moves onto a family diet.", scale: 0.95, risk: "low", tint: "growth" },
    child: { note: "Capacity grows with body size, and Helicobacter pylori infection is often picked up in childhood.", scale: 1.0, risk: "low", tint: "growth" },
    teen: { note: "Capacity and acid output are adult, and reflux and ulcers can begin to appear.", scale: 1.0, risk: "low", tint: "growth" },
    youngAdult: { note: "Digestive function is at its peak.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Ulcers from Helicobacter pylori or anti-inflammatory drugs are the main problem, and heartburn is common.", scale: 1.0, risk: "medium", tint: "peak" },
    senior: { note: "The lining thins and acid production often falls, and the risk of medicine-related ulcers and of stomach cancer is higher.", scale: 1.0, risk: "medium", tint: "decline" },
  },
  thymus: {
    infant: { note: "The thymus is proportionally at its largest and busiest, training the infant's T cells.", scale: 1.6, risk: "low", tint: "growth" },
    toddler: { note: "It is still very active, and large enough to shadow the top of the heart on infant chest X-rays.", scale: 1.6, risk: "low", tint: "growth" },
    child: { note: "It continues to grow in absolute size as the child meets new germs.", scale: 1.5, risk: "low", tint: "growth" },
    teen: { note: "It reaches its peak mass, about 30 to 40 g, around puberty and then begins to shrink.", scale: 1.4, risk: "low", tint: "peak" },
    youngAdult: { note: "Shrinkage has begun: tissue is gradually replaced by fat while the T cells already made persist.", scale: 1.15, risk: "low", tint: "decline" },
    adult: { note: "It is mostly fat by middle age and produces only a small trickle of new T cells.", scale: 1.0, risk: "low", tint: "decline" },
    senior: { note: "Little active thymus remains, which is one reason older adults respond less strongly to vaccines and new infections.", scale: 0.7, risk: "medium", tint: "decline" },
  },
  tonsils: {
    infant: { note: "The tonsils are small at birth and begin to enlarge as the baby meets germs.", scale: 1.0, risk: "low", tint: "growth" },
    toddler: { note: "They enlarge quickly as immune training ramps up, and frequent throat infections are normal.", scale: 1.4, risk: "low", tint: "growth" },
    child: { note: "They are largest at about ages 4 to 10, the peak age for tonsillitis and for tonsil surgery.", scale: 1.8, risk: "medium", tint: "peak" },
    teen: { note: "They begin to shrink after puberty as the rest of the immune system takes over.", scale: 1.3, risk: "low", tint: "decline" },
    youngAdult: { note: "They are smaller and tonsillitis is less frequent.", scale: 1.0, risk: "low", tint: "decline" },
    adult: { note: "They are small and quiet, and lasting one-sided tonsil enlargement in an adult should be checked by a doctor.", scale: 0.9, risk: "low", tint: "decline" },
    senior: { note: "Tonsil tissue has largely regressed.", scale: 0.7, risk: "low", tint: "decline" },
  },
  pancreas: {
    infant: { note: "Digestive enzyme output is still maturing, which is why babies digest milk well but starch poorly.", scale: 1.15, risk: "low", tint: "growth" },
    toddler: { note: "Enzyme output rises as the diet widens.", scale: 1.1, risk: "low", tint: "growth" },
    child: { note: "Type 1 diabetes, when the insulin-making cells are lost, often first appears in childhood and adolescence.", scale: 1.05, risk: "low", tint: "growth" },
    teen: { note: "The hormones of puberty make the body temporarily more resistant to insulin.", scale: 1.0, risk: "low", tint: "growth" },
    youngAdult: { note: "Insulin response is at its peak.", scale: 1.0, risk: "low", tint: "peak" },
    adult: { note: "Insulin resistance and type 2 diabetes become more common, especially with weight gain.", scale: 1.0, risk: "medium", tint: "decline" },
    senior: { note: "Insulin release falls, and diabetes affects more than 1 in 4 people over 65.", scale: 1.0, risk: "high", tint: "decline" },
  },
  reproductive: {
    infant: { note: "The testes have descended into the scrotum by birth in most boys.", risk: "low", tint: "growth" },
    toddler: { note: "A testis that has not descended is usually corrected by surgery in the first two years.", risk: "low", tint: "growth" },
    child: { note: "The organs are dormant until puberty.", risk: "low", tint: "growth" },
    teen: { note: "Puberty switches on testosterone, the testes enlarge and sperm production begins.", risk: "low", tint: "growth" },
    youngAdult: { note: "Testosterone and fertility are at their peak, and testicular cancer is the most common cancer at this age.", risk: "low", tint: "peak" },
    adult: { note: "Testosterone falls slowly, by roughly 1 percent a year, and the prostate begins to enlarge.", risk: "medium", tint: "decline" },
    senior: { note: "By the 80s most men have some prostate enlargement, and prostate cancer risk rises.", risk: "high", tint: "decline" },
  },
};

export const ageDisclaimer =
  "Illustrative and population-typical only: real people vary widely, the model is a single adult male scaled for effect, and none of this is medical advice.";

export interface AgeSource {
  title: string;
  url: string;
}

export const ageSources: AgeSource[] = [
  { title: "NIMH: The Teen Brain, 7 Things to Know", url: "https://www.nimh.nih.gov/health/publications/the-teen-brain-7-things-to-know" },
  { title: "NIA: How the Aging Brain Affects Thinking", url: "https://www.nia.nih.gov/health/brain-health/how-aging-brain-affects-thinking" },
  { title: "MedlinePlus: Aging changes in the heart and blood vessels", url: "https://medlineplus.gov/ency/article/004006.htm" },
  { title: "MedlinePlus: Aging changes in the lungs", url: "https://medlineplus.gov/ency/article/004011.htm" },
  { title: "MedlinePlus: Aging changes in the bones, muscles and joints", url: "https://medlineplus.gov/ency/article/004015.htm" },
];
