/* Program data: source of truth = "Ryan's 6-Week Program: Nov 30 to Jan 10" (approved). */
(function (g) {
  // Exercise library. range = [low, high] reps for double progression. unit: lb | each | bw | assist
  const EX = {
    // Push A
    "db-bench": { name: "DB flat bench press", reps: 10, range: [8, 12], w: 35, unit: "each", rest: 90, compound: true, load: "Start 35s. Pick the pair where rep 10 leaves 3–4 in the tank.", cues: "Shoulder blades pinched, feet planted. Lower to mid-chest, elbows about 45°.", easier: "Push-ups on bench (hands elevated)", harder: "3 s lowering, then +5 lb per hand", muscles: "Chest, front delts, triceps", next: "+5 lb per hand" },
    "db-ohp": { name: "Seated DB shoulder press", reps: 10, range: [8, 12], w: 25, unit: "each", rest: 90, compound: true, load: "Start 25s (bench upright).", cues: "Ribs down, glutes on seat. Press up and slightly in; no arching.", easier: "Half-kneeling single-arm press, 20 lb", harder: "Standing press, then +5 lb", muscles: "Shoulders, triceps, upper chest", next: "+5 lb per hand" },
    "pushups": { name: "Push-ups (submax)", reps: 12, range: null, w: 0, unit: "bw", rest: 60, load: "Bodyweight. 50% of your test max (test = 24 → 2 x 12).", cues: "Body one straight line. Chest to fist height, lock out at top.", easier: "Hands on bench", harder: "2 s pause at bottom; feet on step", muscles: "Chest, triceps, core", next: "+2 reps per set, then 2 s pause at bottom", halfOfTest: "pushups" },
    "db-lateral": { name: "DB lateral raise", reps: 12, range: [10, 15], w: 10, unit: "each", rest: 60, load: "Start 10s.", cues: "Slight bend at elbows, raise to shoulder height, lead with elbows.", easier: "5s, or one arm at a time", harder: "2 s pause at top; 15s", muscles: "Side delts", next: "+5 lb per hand" },
    "db-oh-tri": { name: "DB overhead triceps extension", reps: 12, range: [10, 15], w: 25, unit: "lb", rest: 60, load: "Start one 25 lb DB, two hands.", cues: "Elbows point forward, lower behind head, ribs down.", easier: "Lying DB skull crusher, 15s", harder: "30–35 lb or 3 s lowering", muscles: "Triceps", next: "+5 lb" },
    // Pull A Equinox
    "pullup-strict": { name: "Strict pull-ups", reps: 2, range: null, w: 0, unit: "bw", rest: 120, load: "Bodyweight. If your max is 3, work sets are 1–2 reps.", cues: "Start from a dead hang, chin over bar, no kip or swing. Stop 1 rep short if form breaks.", easier: "Assisted pull-up machine", harder: "+1 rep per set, then add a set", muscles: "Lats, biceps, grip, core", next: "+1 rep per set", fromTest: "pullups" },
    "assisted-pullup": { name: "Assisted pull-up (machine or band)", reps: 8, range: [8, 10], w: 90, unit: "assist", rest: 90, load: "Machine: set assist so rep 8 is RIR 3 (try 80–100 lb). Band: thickest band that gives 8 clean reps.", cues: "Same strict form as a pull-up. Full stretch at the bottom, chest to bar.", easier: "More assistance", harder: "Cut 10 lb of assist when every set hits 10", muscles: "Lats, biceps, mid-back", next: "Cut 10 lb of assist" },
    "lat-pulldown": { name: "Lat pulldown", reps: 10, range: [8, 12], w: 105, unit: "lb", rest: 90, compound: true, load: "Start 100–110 lb; pick the weight that leaves 3 reps in reserve.", cues: "Slight lean back, pull the bar to your upper chest, elbows down and in.", easier: "One step lighter", harder: "One step heavier, then 3 s lowering", muscles: "Lats, biceps, rear delts", next: "One stack step heavier" },
    "cable-row": { name: "Seated cable row", reps: 10, range: [8, 12], w: 100, unit: "lb", rest: 90, compound: true, load: "Start 100 lb.", cues: "Chest tall, pull handle to belly, squeeze shoulder blades 1 s. No rocking.", easier: "One step lighter", harder: "One step heavier, then 2 s squeeze", muscles: "Mid-back, lats, rear delts", next: "One stack step heavier" },
    // Pull A home
    "cs-db-row": { name: "Chest-supported incline DB row", reps: 10, range: [8, 12], w: 30, unit: "each", rest: 90, compound: true, load: "Start 30s, bench at 30–45°.", cues: "Chest stays on pad. Pull elbows to back pockets, squeeze 1 s.", easier: "25s", harder: "2 s squeeze at top, then +5 lb", muscles: "Mid-back, lats, rear delts", next: "+5 lb per hand" },
    "db-row-1arm": { name: "One-arm DB row", reps: 10, perSide: true, range: [8, 12], w: 40, unit: "lb", rest: 60, compound: true, load: "Start 40 lb.", cues: "Flat back, hips square. Row to hip, not chest.", easier: "30 lb", harder: "50 lb, then 3 s lowering", muscles: "Lats, mid-back, biceps", next: "+5 lb (at 50 lb: 3 s lowering)" },
    "yt-raise": { name: "Prone Y-T raise on incline bench", reps: 8, range: [8, 12], w: 5, unit: "each", rest: 60, load: "Start 5s (or no weight). 8 Y + 8 T per set.", cues: "Thumbs up, shoulder blades down and back. Slow and strict.", easier: "No weight", harder: "10s or 2 s hold", muscles: "Lower traps, rear delts, rotator cuff", next: "2 s hold, then 10s" },
    "hammer-curl": { name: "DB hammer curl", reps: 10, range: [8, 12], w: 25, unit: "each", rest: 60, load: "Start 25s.", cues: "Elbows pinned to sides, no swinging.", easier: "20s", harder: "30s or 3 s lowering", muscles: "Biceps, forearms, grip", next: "+5 lb per hand" },
    // Legs A
    "goblet-squat": { name: "DB goblet squat", reps: 10, range: [8, 12], w: 35, unit: "lb", rest: 90, compound: true, load: "Start 35 lb (same DB as the rep test).", cues: "DB at chest, elbows inside knees. Sit down between heels, chest tall.", easier: "Squat to bench, 25 lb", harder: "3 s down + 1 s pause, then 50 lb; then DB front squat", muscles: "Quads, glutes, core", next: "+5 lb (at 50: 3 s down + pause)" },
    "db-rdl": { name: "DB Romanian deadlift", reps: 10, range: [8, 12], w: 35, unit: "each", rest: 90, compound: true, load: "Start 35s.", cues: "Soft knees, hips back, DBs slide down thighs. Flat back; stop at stretch.", easier: "25s", harder: "50s, then single-leg RDL", muscles: "Hamstrings, glutes, lower back", next: "+5 lb per hand" },
    "rev-lunge": { name: "Reverse lunge", reps: 8, perSide: true, range: [8, 12], w: 0, unit: "each", rest: 60, load: "Bodyweight in Week 1; then 15s.", cues: "Step back long, front shin vertical, knee lightly kisses mat.", easier: "Hold bench for balance", harder: "DBs, then step-back from aerobic step", muscles: "Quads, glutes, balance", next: "Add DBs (15s), then +5 lb" },
    "hip-thrust": { name: "DB hip thrust (back on bench)", reps: 12, range: [10, 15], w: 40, unit: "lb", rest: 60, load: "Start one 40 lb DB on hips (pad with foam).", cues: "Chin tucked, ribs down, drive through heels, squeeze 1 s at top.", easier: "Floor glute bridge", harder: "50 lb, then single-leg", muscles: "Glutes, hamstrings", next: "+5 lb (at 50: single-leg)" },
    // Push B
    "bb-floor-press": { name: "Barbell floor press", reps: 10, range: [8, 15], w: 55, unit: "lb", rest: 90, compound: true, load: "Start 55 lb (bar + two 10s). Only loads: 35, 55, 85, 105.", cues: "Lie on mat, knees bent. Lower until triceps touch floor, pause, press.", easier: "DB floor press, 30s", harder: "Reps to 15 at 55, then 85 lb at 8 reps", muscles: "Chest, triceps", next: "Next barbell load (55 → 85 → 105), restart at 8 reps" },
    "incline-db": { name: "Incline DB press (30°)", reps: 10, range: [8, 12], w: 30, unit: "each", rest: 90, compound: true, load: "Start 30s.", cues: "Shoulder blades back, lower to upper chest, press in a slight arc.", easier: "25s", harder: "35s, then 3 s lowering", muscles: "Upper chest, front delts, triceps", next: "+5 lb per hand" },
    "hk-press": { name: "Half-kneeling 1-arm DB press", reps: 8, perSide: true, range: [8, 12], w: 25, unit: "lb", rest: 60, load: "Start 25 lb.", cues: "Squeeze glute of down knee, stay tall, no leaning away.", easier: "Seated, 20 lb", harder: "Standing, 30–35 lb", muscles: "Shoulders, core, triceps", next: "+5 lb" },
    "cg-pushup": { name: "Close-grip push-up", reps: 10, range: [8, 15], w: 0, unit: "bw", rest: 60, load: "Bodyweight.", cues: "Hands under shoulders, elbows brush ribs.", easier: "Hands on bench", harder: "Feet on step, then 2 s pause", muscles: "Triceps, chest", next: "Feet on step, then 2 s pause" },
    // Pull B Equinox
    "negatives": { name: "Pull-up negatives", reps: 3, range: [3, 4], w: 0, unit: "bw", rest: 120, fixedSets: 3, load: "Bodyweight. Step or jump to the top. Lower in 3–5 s.", cues: "Lower in 3–5 s to straight arms. Reset each rep.", easier: "Negatives on the assisted machine", harder: "5 s lowering, then 3 x 4", muscles: "Lats, biceps, grip", next: "5 s lowering, then 3 x 4" },
    "cg-pulldown": { name: "Close-grip lat pulldown", reps: 10, range: [8, 12], w: 95, unit: "lb", rest: 90, compound: true, load: "Start 90–100 lb (neutral-grip handle).", cues: "Pull handle to upper chest, elbows drive down to ribs.", easier: "One step lighter", harder: "One step heavier, then 3 s lowering", muscles: "Lats, biceps", next: "One stack step heavier" },
    "db-curl": { name: "DB biceps curl", reps: 10, range: [8, 12], w: 20, unit: "each", rest: 60, load: "Start 20s.", cues: "Full stretch at bottom, squeeze at top, no swing.", easier: "15s", harder: "25s, then 3 s lowering", muscles: "Biceps", next: "+5 lb per hand" },
    // Pull B home
    "bb-row": { name: "Barbell bent-over row", reps: 10, range: [8, 15], w: 55, unit: "lb", rest: 90, compound: true, load: "Start 55 lb; reps to 15, then 85 lb.", cues: "Hinge to about 45°, flat back. Pull bar to belly button.", easier: "Chest-supported DB row", harder: "85 lb, then 2 s pause at top", muscles: "Upper back, lats, spinal erectors", next: "Next barbell load (55 → 85 → 105), restart at 8 reps" },
    "db-pullover": { name: "DB pullover (across bench)", reps: 12, range: [10, 15], w: 30, unit: "lb", rest: 60, load: "Start one 30 lb DB.", cues: "Slight elbow bend, lower behind head to stretch, pull back over chest.", easier: "20 lb", harder: "40–50 lb, 3 s lowering", muscles: "Lats, chest, core", next: "+5 lb" },
    "rear-delt-fly": { name: "DB rear-delt fly (chest on incline)", reps: 12, range: [10, 15], w: 10, unit: "each", rest: 60, load: "Start 10s.", cues: "Pinkies lead, arms wide, no shrug.", easier: "5s", harder: "15s with 1 s pause", muscles: "Rear delts, upper back", next: "+5 lb per hand" },
    // Legs B
    "bb-rdl": { name: "Barbell Romanian deadlift (from floor)", reps: 10, range: [8, 12], w: 85, unit: "lb", rest: 90, compound: true, load: "Start 85 lb. Deadlift it up from the floor, then RDL reps from the top.", cues: "Bar stays on thighs, hips back, flat back, stand tall with glutes.", easier: "DB RDL, 35s", harder: "105 lb, then 3 s lowering", muscles: "Hamstrings, glutes, back", next: "105 lb (max), then 3 s lowering" },
    "bss": { name: "DB Bulgarian split squat", reps: 8, perSide: true, range: [8, 12], w: 0, unit: "each", rest: 60, load: "Bodyweight first, then 15s.", cues: "Rear foot on bench, front foot far out, drop straight down.", easier: "Split squat, rear foot on floor", harder: "25s, then 3 s lowering", muscles: "Quads, glutes, balance", next: "Add DBs (15s), then +5 lb" },
    "step-up": { name: "DB step-up (aerobic step + risers)", reps: 10, perSide: true, range: [8, 12], w: 20, unit: "each", rest: 60, load: "Start 20s.", cues: "Whole foot on step, drive through heel, control the way down.", easier: "Lower step, no DBs", harder: "Higher step or 30s", muscles: "Quads, glutes", next: "+5 lb per hand or higher step" },
    "sl-calf": { name: "Single-leg calf raise on step", reps: 12, perSide: true, range: [12, 15], w: 0, unit: "lb", rest: 45, load: "Bodyweight; hold bench for balance.", cues: "Full stretch at bottom, 1 s squeeze at top.", easier: "Both legs", harder: "Hold a 25 lb DB", muscles: "Calves, ankles", next: "Hold a DB (start 15–25 lb)" },
    // Ramp-up (light, RIR 4–5)
    "r-goblet": { name: "Goblet squat (light)", reps: 10, range: null, w: 25, unit: "lb", rest: 60, load: "25 lb. RIR 4–5: this should feel easy.", cues: "DB at chest, sit between heels, chest tall.", easier: "Squat to bench", harder: "Stay light until Nov 30", muscles: "Quads, glutes" },
    "r-bench": { name: "DB bench press (light)", reps: 10, range: null, w: 25, unit: "each", rest: 60, load: "25s. RIR 4–5.", cues: "Shoulder blades pinched, elbows about 45°.", easier: "20s", harder: "Stay light until Nov 30", muscles: "Chest, triceps" },
    "r-row": { name: "Chest-supported DB row (light)", reps: 10, range: null, w: 25, unit: "each", rest: 60, load: "25s. RIR 4–5.", cues: "Chest on pad, elbows to back pockets.", easier: "20s", harder: "Stay light until Nov 30", muscles: "Back, biceps" },
    "r-rdl": { name: "DB RDL (light)", reps: 10, range: null, w: 25, unit: "each", rest: 60, load: "25s. RIR 4–5.", cues: "Hips back, flat back, stop at stretch.", easier: "20s", harder: "Stay light until Nov 30", muscles: "Hamstrings, glutes" },
    "r-pushup": { name: "Push-ups", reps: 10, range: null, w: 0, unit: "bw", rest: 60, load: "Bodyweight, 2 x 10.", cues: "Straight line, chest to fist height.", easier: "Hands on bench", harder: "Stay at 10", muscles: "Chest, triceps, core" },
  };

  const SESSIONS = {
    pushA: { name: "Push A", loc: "home", ex: ["db-bench", "db-ohp", "pushups", "db-lateral", "db-oh-tri"], finisher: "Conditioning 6 min: upright bike, 30 s moderate / 30 s easy x 6. Cool-down 2 min: chest doorway stretch, child's pose." },
    pullA: { name: "Pull A", loc: "equinox", alt: "pullAHome", ex: ["pullup-strict", "assisted-pullup", "lat-pulldown", "cable-row"], finisher: "Dead hang 5 min: Week 1 is a max hold test, Week 2+ is 2 x 20–30 s; then dead bug 2 x 8/side. Cool-down 2 min: lat stretch, thoracic rotations." },
    pullAHome: { name: "Pull A (home)", loc: "home", alt: "pullA", ex: ["cs-db-row", "db-row-1arm", "yt-raise", "hammer-curl"], finisher: "Core 5 min: stability-ball dead bug 2 x 8/side, side plank 2 x 20 s/side. Cool-down 2 min: lat stretch on bench, thoracic rotations." },
    legsA: { name: "Legs + Core A", loc: "home", ex: ["goblet-squat", "db-rdl", "rev-lunge", "hip-thrust"], finisher: "Core 6 min: dead bug 2 x 8/side, forearm plank 2 x 30 s (plank test replaces set 2 in Week 1). Cool-down 2 min: hip flexor + hamstring stretch." },
    pushB: { name: "Push B", loc: "home", ex: ["bb-floor-press", "incline-db", "hk-press", "cg-pushup"], finisher: "Conditioning 6 min: treadmill walk at 8–10% incline, 3.0–3.3 mph. Cool-down 2 min: pec + triceps stretch." },
    pullB: { name: "Pull B", loc: "equinox", alt: "pullBHome", ex: ["negatives", "pullup-strict", "cg-pulldown", "db-row-1arm", "db-curl"], finisher: "Core 5 min: dead hang 2 x 20–30 s, suitcase carry 2 x 30 m/side with a 40–50 lb DB. Cool-down 2 min: lat + hamstring stretch." },
    pullBHome: { name: "Pull B (home)", loc: "home", alt: "pullB", ex: ["bb-row", "db-pullover", "rear-delt-fly", "db-curl"], finisher: "Core 5 min: suitcase carry 3 x 30 m/side with one 40–50 lb DB. Cool-down 2 min: lat + hamstring stretch." },
    legsB: { name: "Legs + Core B", loc: "home", ex: ["bb-rdl", "bss", "step-up", "sl-calf"], finisher: "Core 6 min: stability-ball rollout 2 x 8, side plank 2 x 30 s/side. Cool-down 2 min: couch stretch, figure-4." },
    ramp: { name: "Light full-body", loc: "home", ex: ["r-goblet", "r-bench", "r-row", "r-rdl", "r-pushup"], finisher: "Plank 2 x 20 s. Then 5 min stretching (hips, hamstrings, chest)." },
  };

  const PHASES = { 0: "Ramp-up", 1: "Foundation", 2: "Consistency", 3: "Progression", 4: "Strength & Conditioning", 5: "Performance", 6: "Assessment" };

  const BENCH = [
    { id: "weight", name: "Body weight", unit: "lb", baseline: "240", protocol: "7-day average, morning, after bathroom", retestDay: "Jan 4–10", num: true },
    { id: "rhr", name: "Resting HR (Garmin)", unit: "bpm", baseline: "66 (7-day avg 71)", protocol: "Overnight reading, 7-day average", retestDay: "Jan 4–10" },
    { id: "sleep", name: "Sleep (Garmin)", unit: "", baseline: "4h22m, score 43", protocol: "Nightly duration + score; target 7+ h", retestDay: "Weekly avg" },
    { id: "pushups", name: "Strict push-ups", unit: "reps", baseline: "20–30 est", protocol: "One set to form failure, chest to fist height", testDay: "Mon 11/30", retestDay: "Mon 1/4", num: true },
    { id: "pullups", name: "Strict pull-ups", unit: "reps", baseline: "2–3 est", protocol: "Equinox: dead-hang start, chin over bar, no kip; stop 1 short if form breaks", testDay: "Tue 12/1", retestDay: "Tue 1/5", num: true },
    { id: "hang", name: "Dead hang", unit: "sec", baseline: "", protocol: "Equinox: arms straight, hold to grip failure", testDay: "Tue 12/1", retestDay: "Tue 1/5", num: true },
    { id: "plank", name: "Forearm plank", unit: "sec", baseline: "", protocol: "Hold until hips sag (end of Legs A)", testDay: "Thu 12/3", retestDay: "Wed 1/6", num: true },
    { id: "goblet35", name: "Goblet squat, 35 lb", unit: "reps", baseline: "", protocol: "Reps to RIR 1 or form break", testDay: "Thu 12/3", retestDay: "Wed 1/6", num: true },
    { id: "mile", name: "1-mile run", unit: "min:sec", baseline: "11:00", protocol: "Treadmill 1% or flat outdoor, steady", retestDay: "Fri 1/8" },
    { id: "continuous", name: "Continuous easy run", unit: "mi", baseline: "2.0", protocol: "Longest run at conversational pace", retestDay: "Sat 1/9: 5K", num: true },
    { id: "balance", name: "Single-leg balance", unit: "sec L / R", baseline: "", protocol: "Eyes open, hands on hips, cap 60 s per side", testDay: "Wed 12/2", retestDay: "Wed 1/6" },
    { id: "toetouch", name: "Toe touch", unit: "", baseline: "", protocol: "Knees straight: shins, toes or floor", testDay: "Wed 12/2", retestDay: "Wed 1/6" },
    { id: "ohsquat", name: "Overhead squat check", unit: "notes", baseline: "", protocol: "5 bodyweight reps, arms up; note heels, knees, arms", testDay: "Wed 12/2", retestDay: "Wed 1/6" },
  ];

  // Calendar. Each entry: lift (session key), run {min,label}, sets, rir, note, tests [benchmark ids], type
  const D = {};
  const add = (date, o) => { D[date] = o; };
  // Ramp-up Nov 18–29
  const rampLift = { lift: "ramp", sets: 2, rir: "4–5", note: "Very light. 2 x 10 each, RIR 4–5. If still sore 48 h after a light day, do walk + mobility instead." };
  ["2026-11-18", "2026-11-20", "2026-11-23", "2026-11-25", "2026-11-28"].forEach(d => add(d, Object.assign({ title: "Light full-body", week: 0 }, rampLift)));
  ["2026-11-19", "2026-11-22", "2026-11-24", "2026-11-27"].forEach(d => add(d, { title: "Easy cardio + mobility", week: 0, run: { min: 20, max: 25, label: "20–25 min easy run or bike at conversational pace, then 10 min mobility (hips, hamstrings, T-spine, shoulders)." } }));
  add("2026-11-21", { title: "Walk + stretch", week: 0, run: { min: 30, max: 45, walk: true, label: "30–45 min walk plus 10 min stretching." } });
  add("2026-11-26", { title: "Thanksgiving: walk + stretch", week: 0, run: { min: 30, max: 45, walk: true, label: "30–45 min walk plus 10 min stretching." } });
  add("2026-11-29", { title: "Full rest", week: 0, rest: true, note: "Rest before Week 1. Sleep 7.5+ h." });

  const W = (n) => n;
  const rest = (title, note) => ({ title, rest: true, note });
  const plan = {
    1: [
      { lift: "pushA", sets: 2, rir: "3–4", tests: ["pushups"], note: "Test push-ups first (after warm-up), then Push A." },
      { lift: "pullA", sets: 2, rir: "3–4", tests: ["pullups", "hang"], note: "Equinox. Pull-up max test first; dead hang test in the finisher." },
      { title: "Easy run + mobility tests", run: { min: 20, label: "Easy 20 min. Walk breaks to stay under 134 bpm." }, tests: ["balance", "toetouch", "ohsquat"] },
      { lift: "legsA", sets: 2, rir: "3–4", tests: ["goblet35", "plank"], note: "Goblet squat rep test at the start; plank test at the end." },
      { lift: "pushB", sets: 2, rir: "3–4" },
      { title: "Easy run + 10 min mobility", run: { min: 25, label: "Easy 25 min, conversational." } },
      rest("Recovery · weekly review", "Optional 20–30 min walk. Send your weekly review."),
    ],
    2: [
      { lift: "pushA", sets: 2, rir: "2–3", note: "Add a 3rd set where Week 1 felt easy." },
      { lift: "pullA", sets: 2, rir: "2–3", run: { min: 20, label: "Easy 20 min (separate session)." }, note: "Add a 3rd set where Week 1 felt easy." },
      { lift: "legsA", sets: 2, rir: "2–3", note: "Add a 3rd set where Week 1 felt easy." },
      { lift: "pushB", sets: 2, rir: "2–3", note: "Add a 3rd set where Week 1 felt easy." },
      { lift: "pullB", sets: 2, rir: "3", note: "First Pull B. Skip strict pull-up sets this week." },
      { title: "Easy run + mobility", run: { min: 30, label: "Easy 30 min." } },
      rest("Recovery · weekly review", "Optional walk."),
    ],
    3: [
      { lift: "pushA", sets: 3, rir: "2" },
      { lift: "pullA", sets: 3, rir: "2", run: { min: 25, label: "Easy 25 min (separate)." } },
      { lift: "legsA", sets: 3, rir: "2" },
      { lift: "pushB", sets: 3, rir: "2" },
      { lift: "pullB", sets: 3, rir: "2", run: { min: 30, label: "Easy 30 min (separate)." } },
      { lift: "legsB", sets: 2, rir: "3", note: "First Legs B." },
      rest("Recovery · weekly review", "Optional walk."),
    ],
    4: [
      { lift: "pushA", sets: 3, rir: "1–2", heavy: true },
      { lift: "pullA", sets: 3, rir: "1–2", heavy: true, run: { min: 30, label: "Easy 30 min (separate)." } },
      { lift: "legsA", sets: 3, rir: "1–2", heavy: true },
      { lift: "pushB", sets: 3, rir: "1–2", heavy: true },
      rest("Christmas: rest or walk", "Pull B moves to Sunday if you want it."),
      { lift: "legsB", sets: 3, rir: "2", heavy: true },
      { lift: "pullB", sets: 3, rir: "2", optional: true, run: { min: 30, label: "If you skip Pull B: easy 30 min run." }, note: "Pull B or recovery. Then weekly review." },
    ],
    5: [
      { lift: "pushA", sets: 3, rir: "1–2", heavy: true, note: "Hardest week: 4th set optional. Use tempo/pauses where DBs max out." },
      { lift: "pullA", sets: 3, rir: "1–2", heavy: true, run: { min: 30, label: "Easy 30 min (separate)." }, note: "4th set optional." },
      { lift: "legsA", sets: 3, rir: "1–2", heavy: true, note: "4th set optional." },
      { lift: "pushB", sets: 3, rir: "1–2", heavy: true, note: "4th set optional." },
      { lift: "pullB", sets: 3, rir: "2", run: { min: 35, label: "Easy 35 min: longest run (about 2.9 mi)." }, note: "Jan 1 weigh-in." },
      { lift: "legsB", sets: 3, rir: "1–2", heavy: true, note: "4th set optional." },
      rest("Recovery · weekly review", "Optional walk."),
    ],
    6: [
      { lift: "pushA", sets: 2, rir: "3", tests: ["pushups"], note: "Push-up retest first." },
      { lift: "pullA", sets: 2, rir: "3", tests: ["pullups", "hang"], run: { min: 20, label: "Easy 20 min." }, note: "Pull-up + dead hang retest." },
      { lift: "legsA", sets: 2, rir: "3", tests: ["goblet35", "plank", "balance", "toetouch", "ohsquat"], note: "Squat, plank and mobility retests." },
      { lift: "pushB", sets: 2, rir: "3" },
      { title: "1-mile time trial", run: { min: 20, label: "Warm up, 1-mile time trial, then easy 10 min." }, tests: ["mile"] },
      { title: "5K at conversational pace", run: { min: 37, label: "3.1 mi easy. Walk breaks if HR passes 134." }, tests: ["continuous"] },
      rest("Block review + Block 2 plan", "Walk. Send the block review."),
    ],
  };
  const start = new Date(Date.UTC(2026, 10, 30));
  for (let w = 1; w <= 6; w++) {
    plan[w].forEach((o, i) => {
      const d = new Date(start.getTime() + ((w - 1) * 7 + i) * 86400000);
      const iso = d.toISOString().slice(0, 10);
      const e = Object.assign({ week: w }, o);
      if (e.lift && !e.title) e.title = SESSIONS[e.lift].name;
      D[iso] = e;
    });
  }

  g.PROGRAM = { EX, SESSIONS, PHASES, BENCH, DAYS: D, FIRST: "2026-11-18", START: "2026-11-30", LAST: "2027-01-10", PROTEIN_GOAL: 180, ZONE2: [115, 134], GOAL_WEIGHT: 230, START_WEIGHT: 240 };
})(typeof window !== "undefined" ? window : globalThis);
