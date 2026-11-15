# Mars Mission Survival — editable story script v2.1

Reconciled November 13, 2026 from `Mars_Mission_Survival_10-Sol_Story_Script_v2.pdf`. The source PDF is preserved in the original tuesday preparation backup; it is intentionally not bundled into this clean project. This Markdown is the editable script; README.md owns the engine rules and has been synchronized to the approved solar table below. This is writing/content preparation, not implemented game code.

**Status:** all 13 scene versions transcribed; wording/timing fixes and supporting copy added. NASA `[DATA]`/`[CHECK]` markers intentionally remain pending the supplied resources and verification. Balance, child playtesting, final photo selection and code integration remain unfinished. Do not expose drafting markers to players.

## Approved Sol 6 balance — November 13 decision

These starter values were approved by the team from the v2 PDF. Select a variant once from the frozen NASA input. Use its effects instead of adding another version's costs. Existing event ID remains `solar_storm`; variants are `calm`, `active`, `stormy`. Choice IDs remain A/B/C.

| Choice | Calm | Active | Stormy |
|---|---|---|---|
| A: shield check/boost | power -4, shield +6 | power -10, shield +14 | power -15, shield +20 |
| B: drill/shelter; research pauses | power -2, shield +3, noScience | power -4, shield +7, noScience | power -5, shield +10, noScience |
| C: keep working | science +2, shield -4 | science +2, shield -10 | science +2, shield -20 |

No other event balance changes are approved in this revision. Fixed order, confirmed features, cargo, bonuses and flags remain as specified in README.md.

## Implementation cues that apply to every scene

- Camera, effect, dialogue and task cues are keyed to existing event/choice IDs. Sol 6 selects its frozen variant; Sol 8 resolves `quickPatch`. No shuffle, new mode or extra sol.
- After every RESULT, check the ending before opening the normal card/night flow; check again after NIGHT. Show only applicable safe After wording if a choice causes failure, then the per-meter ending below. Do not play unconditional success dialogue first.
- Each quoted narration bubble is tap-to-continue with no real waiting timer. Further split a bubble if mobile layout/read-aloud testing calls for it. Preserve the approved meaning. Metadata/source details expand separately from the short fact.
- All resource labels use Life Support, Power and Shielding. The story's shorthand air/water does not add meters. No quiz or score screen.
- Draft `[DATA]`/`[CHECK]` placeholders remain for NASA resources. For a release build, use verified bundled entries and honest Saved labels; unresolved content is blocked by content validation rather than shown to children.
- Research pauses preserve existing `noScience` semantics; do not subtract extra Science beyond the engine rules. A leak's “Life -2 instead of -5” is represented by its existing Life +3 choice effect followed by normal upkeep, with cargo modifiers handled by the engine. Do not implement both formulations and double the benefit.
- Treat “leak still there” as story context for that sol, not an instruction to add an unapproved persistent drain. Any drip animation is decorative feedback and must not deduct Life every frame. Existing effects/flags govern all deductions.
- Sol 3 warning and Sol 4 consequence are compressed fictional mission time: the forecasted storm passes between chapters. Apply the pending cost once; do not add a separate storm event.
- Finale choice effects stay in README Section 9: A life -4/power -8/shield -4; B life 0/power -10/shield -8; C life -8/power -10/shield 0. Zero here means no change, not setting the meter to zero. Success follows final upkeep.

## Supporting copy: Plan phase and frozen NASA briefing

The following are authored lines, not Gemini output. Map to content keys during conversion; keep existing cargo IDs. State, dates and credits are displayed in UI rather than packed into long dialogue.

**Welcome:** “Every rocket has a carrying limit. Choose the supplies you want to bring!”

**Tradeoff:** “More of one supply leaves less room for another. What will help your mission?”

**Budget full / over budget:** “That pack is too heavy. Remove something before adding this supply.”

**Balanced pack:** “Here is a balanced starting pack. You can change it before launch.” The actual selection must be a valid approved loadout, not inferred from this line.

**Launch:** “Your cargo is ready. Let’s begin our Mars mission!”

| Frozen input | Robo's short briefing | Optional cargo advice |
|---|---|---|
| calm | “NASA’s recorded observations give our mission a calm solar setting. We still need to plan our supplies.” | “Think about power, water and protection. A quiet setting is a chance to prepare.” |
| active | “NASA recorded increased solar activity in our observation window. Our story will include a solar warning.” | “Shield plating adds protection. Batteries can help with power use at night.” |
| stormy | “NASA’s recorded observations give our mission a stormy solar setting. Our story will test our protection plan.” | “Consider shield plating and power supplies. You choose what fits in the cargo.” |

**Source detail outside bubbles:** `[DATA: observation window, selected event if present, observation date, fetch date and source URL]`. Live fetch, cached data and bundled archives use explicit labels. “Saved NASA observations” is shown when archive/cached data is used; never claim it is today's Mars weather. Missing API data uses the verified saved archive, not an invented calm classification.

## Supporting copy: cargo hints and callbacks

| Cargo ID | Plan hint | Event callback / condition |
|---|---|---|
| `solar_extra` | “Extra panels make more power each sol. They take up cargo space.” | Robo, Sol 1 if packed: “We brought extra panels to help generate power.” |
| `batteries` | “These batteries help us use less stored power at night. They do not make sunlight.” | Robo, Sol 2 if packed: “Our battery upgrade helps with tonight’s power use.” |
| `shield_plating` | “Shield plating adds starting protection. It leaves less room for other supplies.” | Robo, Sol 6 if packed: “We brought extra protection before launch. Our choices still matter.” |
| `greenhouse_kit` | “This kit reduces our daily Life Support use. It is heavy.” | Mei, Sol 1/9 if packed: “Our greenhouse kit helps us use supplies carefully.” |
| `water_recycler` | “The recycler adds to our starting water supplies. That starting bonus happens once.” | Robo, Sol 1 if packed: “Our recycler gave us a starting supply boost.” |
| `spare_parts` | “Spare parts reduce the power cost of repairs. They help when equipment needs fixing.” | Kai, Sol 7 if packed: “Good thing we packed spare parts!” |
| `rover_fuel` | “This supply helps our outpost rover on the long trip. It takes up cargo space.” | Kai, Sol 4 B if packed: “Our extra rover supply reduced this trip’s power cost.” |
| `radio_booster` | “This makes messages clearer. It cannot make them travel faster.” | Robo, Sol 5 A if packed: “The booster helped us use Earth’s tip. The message still took time to travel.” |

These lines describe existing modifiers only. Do not add a new effect, item quantity, capacity increase or bonus because of dialogue. Use a short applicable callback once instead of repeating the whole inventory each sol.

## Supporting copy: warnings and risky-choice confirmation

Keep the README thresholds: low at 30 or less (once per meter/run), danger at 15 or less (hint each sol), empty at 0. Icons and text accompany colors; no frightening alarm.

| Meter | Low line | Danger hint |
|---|---|---|
| `life` | “Our air and water supplies are getting low. Let’s watch Life Support.” | “Life Support is very low. Look for a way to protect our air and water.” |
| `power` | “Our stored power is getting low. Let’s plan the next job carefully.” | “Power is very low. Check the cost before starting another job.” |
| `shield` | “Our protection is getting low. Let’s keep an eye on Shielding.” | “Shielding is very low. Look for protection or shelter choices.” |

**Choice projected to empty a meter:** “That would use all our {resource}. Are you sure?” Resource uses the UI meter name, not arbitrary player text. Buttons: “Choose this” / “Go back”. Keep the risky choice allowed, as specified; do not invent a penalty for cancelling.

## Supporting copy: per-meter gentle endings and retry

Preserve these confirmed messages:

- `ending.gentle.life`: “Air and water ran very low, so the crew moved to the emergency shelter to wait for the supply ship.”
- `ending.gentle.power`: “The batteries ran out, so the outpost powered down. The crew is safe in the shelter.”
- `ending.gentle.shield`: “Radiation got too strong, so the crew moved into the shelter to stay safe.”
- `hint.life`: “Try the ice hunt early, and watch the air.”
- `hint.power`: “Try saving power before a storm.”
- `hint.shield`: “Don't skip the shield during a solar storm.”

**Report invitation:** “The crew is safe. Let’s see which choices used our supplies.”

**Retry this sol:** “Try this sol again” restores the available sol-start snapshot with the same cargo and frozen observation. **New mission:** “Try again” starts Plan with a fresh observation lookup/fallback. No guarantee of a different solar level. Continue restores the durable checkpoint. Do not claim an in-memory sol-start snapshot survives browser closure.

**Optional reserve, only if enabled:** “Our emergency reserve gives us another chance. It can help once this mission.” Existing rule sets the exhausted meter to 10 once and `usedReserve`; no extra benefit is introduced.

## Supporting copy: four mini-games

| Existing ID | Robo instruction | Completion line |
|---|---|---|
| `cover_panels` | “Tap each panel to fit its cover. Cover all four, or choose Skip.” | “The covers are fitted. You earned a small power bonus.” |
| `rover_drive` | “Guide the rover around the rocks to the ice. Tap a route or use the keyboard.” | “The rover reached the ice. You earned a small Life Support bonus.” |
| `repair_wires` | “Choose a wire end, then its matching symbol. Connect all three pairs.” | “The wires are connected. You earned a small power bonus.” |
| `patch_leak` | “Tap each marked leak to place a patch. Patch all three, or choose Skip.” | “All three patches are fitted. You earned a small power bonus.” |

- Skip button stays visible and keyboard accessible throughout. Shared skip/error line: “No problem. Let's keep going!” Normal choice effects still apply, with no completion bonus or additional penalty.
- Rover blocked move with obstacle blocking enabled: “A rock blocks that route. Try another way!” No damage, timer or losing state. Keyboard control hint can say “Use the arrow keys to move. Tab to Skip.” Final controls must match the implemented component.
- With `obstacleBlocking: false`, use the same component and bonus but instruction: “Guide the rover through the waypoints to the ice. Tap a route or use the keyboard.” Do not show blocked-rock feedback when blocking is disabled.
- Wire mismatch: “Those symbols do not match yet. Try another pair!” Symbols/labels supplement color. No penalty.
- Completion lines appear only after actual completion and once-only bonus commit. If that result triggers a gentle ending, use appropriate safe result/ending copy. Mini-game bonuses remain +2 Power except Rover Drive +2 Life Support.

## Supporting copy: local mission-summary templates

Compose 2-3 short sentences, targeting 40-60 words and never exceeding 60. Use one verified observation of an actual choice, its outcome/consequence and one friendly suggestion. Select lines from evidence; do not invent comparisons or claim an upgrade prevented failure. These are deterministic local templates, not live AI output.

| Condition actually recorded | Observation / explanation sentence |
|---|---|
| `solar_extra` packed | “You packed extra solar panels, which increased the power generated each sol.” |
| `batteries` packed | “You packed batteries that reduced night power use, leaving cargo space for fewer other supplies.” |
| `shield_plating` packed | “Your shield plating added starting protection, and it used some of the cargo allowance.” |
| `greenhouse_kit` packed | “Your greenhouse kit reduced daily Life Support use, and it took up cargo space.” |
| `water_recycler` packed | “Your recycler added a starting Life Support bonus that helped supply the mission.” |
| `spare_parts` packed and Sol 7 reached | “Your spare parts reduced the power cost of the equipment repair decision.” |
| `rover_fuel` packed and Sol 4 B | “Your rover supply reduced the power cost of the long ice trip.” |
| `radio_booster` packed and Sol 5 A | “Your radio booster improved the benefit from Earth’s advice, while the signal still took time to travel.” |
| Sol 3 A | “You covered the solar panels, spending power before the storm to reduce its later power cost.” |
| Sol 4 A/B | “You sent the rover for ice, gaining Life Support while using power for the trip.” |
| Sol 5 A | “You waited for Earth’s advice, trading power and story time for a repair tip.” |
| Sol 5 C | “You continued research, leaving the flicker to increase later repair costs.” |
| Sol 6 calm A/B | “You used the calm solar encounter for a safety check or drill, trading power for protection.” |
| Sol 6 active A/B | “You prepared during the solar warning, using power to improve the mission’s protection.” |
| Sol 6 stormy A/B | “You chose protection during the simulated solar storm, trading power or research time for shielding.” |
| Sol 6 any C | “You continued research during the solar encounter, gaining Science while Shielding decreased.” |
| Sol 7 A | “You chose a full repair, spending power to fix the equipment.” |
| Sol 7 B | “Your quick patch used less power at first, and it led to the later leak chapter.” Use only if Sol 8 leak actually occurred; before that say “Your quick patch used power to handle the repair.” |
| Sol 7 C | “You switched to backup panels, reducing the power generated in later sols.” |
| Sol 8 leak A | “You patched the air leak, using power to complete the repair.” |
| Sol 8 leak B | “You used backup oxygen to add Life Support, which used power and your backup supply.” |
| Sol 8 meteors A/B | “You chose shelter or roof protection during the meteor chapter, trading research time or power for safety.” |
| Sol 9 A/B | “You used power for heating during the cold night, choosing which systems to keep running.” |
| Sol 9 C | “You limited heating to conserve power, while Life Support and the plants took a cost.” |

Select the specific A or B action in combined template rows when converting them into final template entries; never describe an unchosen alternative as fact. If no reliable specific observation exists, use “You made choices about the outpost’s supplies and saw how each decision changed the mission.”

**Ending sentence, select one:**

- Success: “You kept the outpost running through ten sols until the supply ship arrived.”
- Life failure: “Life Support ran out, so the crew moved into the shelter to wait safely.”
- Power failure: “Stored power ran out, so the crew waited safely in the shelter.”
- Shield failure: “Protection ran too low, so the crew moved into the shelter to stay safe.”

**Next-time sentence, select one relevant hint:**

- Life: “Next time, check how each choice affects air and water before sending the crew onward.”
- Power: “Next time, compare repair and heating costs and plan which power supplies to bring.”
- Shield: “Next time, compare shielding and shelter choices before continuing research during the solar encounter.”
- Success/general: “On another mission, try a different cargo plan and explore how its tradeoffs change your choices.”

Validate assembled sentence/word count and choose a shorter sentence if necessary. Source label: “Robo’s mission summary”. Accepted Gemini text alone is labeled “Written by AI”. Show report immediately, give AI up to 3 seconds, then use the prepared template; never replace a displayed summary with a late reply. The server’s 8-second timeout is separate.

## Supporting copy: photo caption slots and source details

Do not write final descriptive captions before selecting actual photos. Each below is an intentional drafting slot and not text for players. Preserve existing real-moment IDs in content; these topic labels do not rename them.

| Sol / topic | Caption and verification slot |
|---|---|
| 1 Gale | `[DATA: caption accurately describing selected Gale/Mount Sharp image; mission/camera/capture date/credit/source]` |
| 2 night | `[DATA: caption for selected twilight/night-related image; do not claim a temperature was measured at photo capture unless supported]` |
| 3 dust | `[DATA: caption describing actual dust image; distinguish a local dust devil from the 2018 global storm]` |
| 4 soil/water | `[DATA: caption for actual drill/soil/rover image; distinguish bound soil water from fictional nearby ice]` |
| 5 communications | `[DATA: caption matching the actual antenna/Earth-view image, plus credit/source]` |
| 6 all solar variants | `[DATA: caption for selected solar/rover image; its capture date is separate from the frozen solar observation]` |
| 7 maintenance | `[DATA: caption for actual worn-wheel image and credit/source]` |
| 8 leak | `[DATA: identify the actual space-station/repair context; explicitly not a photo of our fictional Mars leak]` |
| 8 meteors | `[DATA: caption for actual orbiter crater image; no claim it photographed our fictional incident]` |
| 9 cold | `[DATA: describe actual frost/dusk imagery; source the temperature separately]` |
| 10 exploration | `[DATA: identify actual mission image or label concept art as an illustration, with full credit/source]` |

All bundled images say “Saved photo”; label diagrams/concept art accurately. Source details expand separately, and cards can be skipped. Photo failure: “Photo not available. Here is the fact instead!” Preserve fact, credit and Continue.

## Supporting glossary additions

- **Launch weight:** “The weight a rocket must carry. Our game gives supplies weight points to help us choose.”
- **Cargo:** “The supplies and equipment carried on a spacecraft.”

## Supporting classroom questions

Use one short question at each discussion pause; a second is an optional teacher follow-up. Match the actual solar/branch version. No quiz, score or required typed response is introduced.

| Event | Main question | Optional follow-up |
|---|---|---|
| touchdown | “Why could we not give the first power to everything?” | “What did your cargo plan help with?” |
| first_night | “Why do batteries matter when the Sun goes down?” | “What did heating cost?” |
| dust_storm | “Why spend power before a storm?” | “When will the dust cost affect us?” |
| ice_hunt | “What did the rover trip give us, and what did it use?” | “How did a short trip differ from a long trip?” |
| solar_storm calm | “Why check protection during a quiet setting?” | “Which task used power?” |
| solar_storm active | “What can we do before a possible problem?” | “What did preparing cost?” |
| solar_storm stormy | “How did you choose between protection and research?” | “Did your cargo help with that choice?” |
| calling_earth | “Why could Earth not answer straight away?” | “What did you decide before the reply?” |
| equipment_failure | “What can happen when we delay a repair?” | “What is the tradeoff in a quick patch?” |
| leak | “How did you protect the air supply?” | “What did your repair choice use?” |
| meteors | “What did you trade for protection?” | “Why is checking equipment useful?” |
| cold_night | “Which systems did you choose to heat?” | “What did you switch off or give up?” |
| finale | “Which earlier decision would you change next time?” | “What real Mars fact surprised you?” |

The game uses the fixed sol order even though this question lookup is keyed by event/variant. Teacher materials remain a separate deliverable; these lines supply discussion content only.

---

## Main mission scenes — reconciled transcription

Junior Astronaut Mission Trainer · Gale Crater · ages 7–12 · team script v2.1 (fixed order, 13 prepared versions; reconciled November 13, 2026)

## How to use this script

One sol (Martian day) is one chapter: narration, mood and effects, scene dialogue, choices, then an explanation and a real moment. Robo narrates the story. Other characters speak in their own bubbles. The order is fixed, with no shuffle (see Mission order at the end). Sol 6 has three prepared versions, chosen once at mission start from the NASA solar observation: calm, active or stormy. Every version has its own mood and effects, narration, dialogue, choices, After lines and Real Mars card. NASA wording: say “NASA observed increased solar activity” and “inspired by real space weather”. Never say an event hit Mars or that it is today’s weather at the outpost. Meter numbers are starter values. Tune them while playtesting. [DATA] marks a spot for real NASA data to fill from the Nov 13 resources. [CHECK] marks a fact from general knowledge: confirm it on a NASA page and credit it before the game uses it. Never present saved data as live. Keep every speech bubble to one or two short sentences (reading level around grade 3 to 5).

## The 13 prepared versions

Ten scenes are played in each completed mission. Prepare one version for each of Touchdown, First Night, Dust Warning, Ice Hunt, Calling Earth, Equipment Failure, Cold Night and Finale (eight), three Sol 6 variants, and both Sol 8 branches. This totals 13 prepared versions. Prologue, Plan guidance, choice responses, endings and summaries are not additional sols.

## Cast

Commander (the player): the kid in charge. Robo-Assistant (Robo): friendly guide robot. Beeps, explains new words, never scolds.

Dr. Thiri (Mission Control, Earth): calm and warm. Her messages always arrive late.

Kai: crew engineer. Fixes things and makes small jokes.

Mei: crew gardener. Looks after the greenhouse, air and plants.

Curiosity: a real NASA rover that has explored Gale Crater since 2012. Only beeps, and Robo translates. Cameo on Sol 4.

## Meters

Life Support (air and water), Power, Shielding. Start at Life 80, Power 65, Shield 60. The crew uses Life −5 each sol. Sunlight adds Power by day, and dust storms cut it. If any meter reaches 0, the mission ends gently (see Endings). Science points only feed the Mission Report.

## The story so far (prologue)

What is going on: Earth has sent a small crew to build the first outpost in Gale Crater, a huge bowl on Mars with a tall mountain in the middle. A supply ship is on its way and will arrive just after Sol 10. Until then, the outpost depends on the Commander (the player).

Narration (Robo, before Sol 1):

“Hello, Commander! I’m Robo, your mission assistant.”

“You are in charge of a small crew on Mars. Our outpost sits in Gale Crater, a giant bowl in the ground with a mountain in the middle.”

“A supply ship is on its way! It will arrive after Sol 10.”

“Until then, we must keep three things going: air and water, power, and protection from the Sun’s radiation.”

“Every choice costs something. There are no perfect answers, only smart ones.”

“Ready, Commander?”

Mood and look: hopeful and curious. Dark starry space, Mars growing bigger, a gentle orchestral theme.

Effects: stars drift by; Mars grows into view; the landing pod glows as it enters the sky; the title card appears: MARS MISSION SURVIVAL; narration appears with a typewriter effect and a tap to continue.

## How narration and after-choice cards work

The goal is to reflect, not to grade.

Before the choice: Robo uses one or two short sentences per bubble. Split longer narration across tap-to-continue bubbles; there is no reading timer. Optional read-aloud.

After the choice: the meters animate, then Robo explains what happened and why in 1 or 2 short sentences. No score, no right or wrong labels, no red X.

Real moment: after Robo’s explanation, a small “Real Mars, tap to explore” invitation, at most one per scene. Opening it shows a bundled real NASA image labeled “Saved photo”, one short fact linked to the event, its credit and source. NASA observations separately show Live, Cached or Saved status, observation date and fetch date. Children can continue without opening it.

Never: quizzes mid-game, scolding, or long lectures. If a card takes more than about 10 seconds to read, cut it.

Mission Album: every encountered Real Mars card is collected in the end report, even if the player continued without opening it.

## Sol 1: Touchdown at Gale Crater (fixed, tutorial)

Mood and look: wonder and calm. Golden-pink sunrise, warm light, soft chimes.

**Narration (Robo) — tap to continue**

> We made it! The landing dust is settling.

**Narration (Robo) — tap to continue**

> Look, Commander: that tall mountain is Mount Sharp, and we are standing in Gale Crater. Today is Sol 1.

**Narration (Robo) — tap to continue**

> Let’s wake up the outpost!

Effects: slow camera pan over the outpost; a dust puff as the door opens; meters slide in one at a time with a small sparkle; Mount Sharp silhouette on the horizon; narration in a typewriter style.

Scene dialogue:

Robo: “A sol is one Martian day. It is a little longer than a day on Earth.”

Kai: “Everything runs on power: air, heat, even the lights.”

Mei: “Don’t forget the greenhouse. Plants help us breathe and eat!”

Choices (no wrong answer): where does the first power go?

A. Air system first (Life +5, Power −5)

After: “Air first! Breathing comes before everything. We have a little less power now, so we will plan carefully.”

B. Shield first (Shield +5, Power −5)

After: “The shield is ready to protect us from radiation. The air system can wait a little, but not for long.”

C. Greenhouse lights first (Life +3, Power −8)

After: “Mei’s plants are waking up! Plants give us food and fresh air, but their lights use a lot of power.”

Real moment (card): Gale Crater is a real crater about 154 km wide, and Mount Sharp rises about 5 km above its floor. NASA’s Curiosity rover landed here in 2012. [CHECK: confirm the numbers on NASA’s Curiosity pages.]

Kids learn: what a sol is, that power is shared, and that every choice has a cost.

## Sol 2: The First Night (fixed)

Mood and look: quiet and a little mysterious. The sky fades to deep blue-purple, stars appear, two tiny moons rise. Soft lullaby music and a gentle wind.

**Narration (Robo) — tap to continue**

> The Sun is going down, Commander. Our solar panels can’t make power in the dark, so the batteries must do all the work tonight.

**Narration (Robo) — tap to continue**

> And Mars nights get very cold!

Effects: fade from dusk to night; panels dim; window lights glow yellow; stars twinkle; the battery icon pulses slowly; small breath puffs inside the habitat.

Scene dialogue:

Mei: “Heating uses a lot of power. But the plants need to stay warm!”

Kai: “Warm and cozy, or save power for tomorrow? Hmm.”

Choices: how warm should we be tonight?

A. Full heating (Power −15, Life +2)

After: “Everyone is toasty! Heating used power, so tomorrow’s sunshine matters.”

B. Half heating (Power −8, Life −2)

After: “A bit chilly, but we saved some power. Careful planning is part of every mission.”

C. Heat the greenhouse only (Power −4, Life −5)

After: “The plants are safe, but the crew is cold. We kept most of our power, though we feel it in our toes!”

Real moment (card): Mars has two small moons, Phobos and Deimos. Curiosity’s weather station measures how cold Gale gets at night. [DATA: a real night temperature from Curiosity’s weather readings.]

Kids learn: day and night, batteries, trade-offs.

## Sol 3: Dust Storm Warning

Mood and look: uneasy and building. The sky shifts from butterscotch to rusty orange, the light dims, a low wind rises, and a slow drum joins the music.

**Narration (Robo) — tap to continue**

> Commander, I see a big orange cloud far away. It’s a dust storm, and it will reach us tomorrow.

**Narration (Robo) — tap to continue**

> Dust blocks sunlight, so our solar panels will make less power. We have one sol to get ready!

Effects: orange tint fades in; dust particles drift across the screen; the Sun becomes a pale disk; a banner slides in: DUST STORM TOMORROW; a dusty layer builds on unprotected panels.

Scene dialogue:

Kai: “We can cover the panels, or save energy now.”

Mei: “Mars storms can last for days. Let’s be ready!”

Choices: how do we get ready?

A. Cover the panels (Power −10 now, storm costs only Power −5)

After: “Smart! The covers keep dust off the panels. We spent power today so we lose less tomorrow.”

B. Switch off the lab to save energy (Power +5 now, storm costs Power −10, no science)

After: “We saved some energy by pausing experiments. Science will have to wait for sunnier days.”

C. Carry on as normal (Science +1, storm costs Power −15)

After: “We got extra science today, but the storm will cost us more power tomorrow. Planning ahead has a price, and so does skipping it.”

Real moment (card): Dust storms are a real Mars hazard. In 2018 a planet-wide dust storm blocked so much sunlight that NASA’s solar-powered Opportunity rover went quiet. [CHECK: confirm on NASA’s Opportunity pages.]

Kids learn: dust and solar power, and planning ahead with a forecast.

## Sol 4: The Ice Hunt (and a Surprise Visitor)

Mood and look: curious and adventurous. A clear butterscotch sky after the storm, soft shadows, upbeat explorer music.

**Narration (Robo) — tap to continue**

> The storm is over, and the sky is clear again! We need to plan our water supply.

**Narration (Robo) — tap to continue**

> Time for an ice hunt! I’m sending the rover out.

**Narration (Robo) — tap to continue**

> Wait... who is that?

Effects: a calm, bright transition after the storm; the rover drives across the map with a dust trail; the camera zooms on Curiosity; a small star-sparkle pops over it; the Shield bar flickers if the trip is long.

Scene dialogue:

Kai: “A short trip is safe. A long trip finds more ice, but the rover uses more power.”

Robo: “Look, a rover! That’s Curiosity. It has explored Gale Crater since 2012!”

Curiosity: “Bip... boop-bip!”

Robo: “Curiosity says: Welcome to the neighborhood!”

Choices: how far should the rover go?

A. Short trip (Life +8, Power −5)

After: “The rover found a little ice close to base. Not a lot, but it was a safe trip.”

B. Long trip (Life +18, Power −15, Shield −5)

After: “Lots of water! But the long trip used a lot of power and kept us outside longer, where there is more radiation.”

C. Ration the water (Life −3)

After: “We saved power by staying home, but our water is getting low. We will need a plan soon.”

Real moment (card): Curiosity’s instruments found a small amount of water locked in Gale’s soil. Future crews would also look for ice. In our game the ice is closer than in real life, to keep it fun. [CHECK: confirm the soil water amount on NASA’s Curiosity pages.]

Kids learn: ice means water, every trip costs power, and a real rover lives here.

## Sol 5: Calling Earth (Communication Delay)

Mood and look: quiet suspense and a feeling of distance. A clear dusk sky with Earth as a tiny blue dot, soft radio static, a slow ticking clock.

**Narration (Robo) — tap to continue**

> Uh-oh. One of our solar arrays is flickering.

**Narration (Robo) — tap to continue**

> Let’s call Mission Control on Earth! But Mars is very far away.

**Narration (Robo) — tap to continue**

> Our signal takes about 12 minutes to get there, and 12 more for the answer to come back.

Effects: the dish turns; a glowing dot travels along a dotted line to Earth; a story-time countdown shows REPLY IN 24 MIN (compressed animation, not a real 24-minute wait; the decision appears first); faint static at the screen edge; the Earth dot twinkles.

Scene dialogue:

Kai: “We could wait for Earth, or I could try fixing it now.”

Mei: “Waiting uses power too. What do you think, Commander?”

[Reply cue: do not show Dr. Thiri before the player chooses. After choice A, compress the waiting time, then show: “Hello, Commander! Thanks for your call. Let’s look at that array together.” Choices B/C continue without a duplicate repair/reward; use later message callbacks as scripted.]

Choices (the Commander must decide before the reply comes): what now?

A. Wait for Earth (Power −8 while waiting, then Earth’s tip gives Power +5 and a safe fix)

After: “Dr. Thiri’s tip fixed it safely! Waiting cost us some power, but we learned a new trick.”

B. Fix it now with Kai (Power −10, fixed)

After: “Kai fixed it fast, all on our own! Deciding without help from Earth is part of life on Mars.”

C. Ignore it and keep researching (Science +2, the flicker returns bigger on Sol 7)

After: “We got extra science, but the flicker is still there. Small problems can come back bigger.”

Real moment (card): The real signal delay between Mars and Earth changes through the year, from about 3 to 22 minutes one way. [DATA: the delay for today’s date.] That is why real rovers drive themselves a little: commands from Earth would arrive too late to steer. [CHECK: confirm on NASA’s rover pages.]

Kids learn: signal delay, and why astronauts must sometimes decide on their own.

## Sol 6: Solar Encounter (calm, active or stormy)

One scene, three versions. The NASA solar observation, read once at mission start, picks the version. All three use the same three choices, scaled to the situation. Robo may say “in our story”, but every Real Mars card must say “NASA observed” and “inspired by real space weather”.

Numbers at a glance (starters, tune in playtesting):

Boost the shield: Calm Power −4, Shield +6. Active Power −10, Shield +14. Stormy Power −15, Shield +20.

Pause or shelter (research pauses): Calm Power −2, Shield +3. Active Power −4, Shield +7. Stormy Power −5, Shield +10.

Keep working: Calm Science +2, Shield −4. Active Science +2, Shield −10. Stormy Science +2, Shield −20.

### Version 1: Calm (routine protection check)

Mood and look: calm and steady. A normal butterscotch day, soft light, a slow friendly rhythm in the music.

**Narration (Robo) — tap to continue**

> Time for our radiation check, Commander! Our mission uses NASA’s recorded observations.

**Narration (Robo) — tap to continue**

> In our story, the detector is clicking slowly. Let’s check our shield before we need it.

**Narration (Robo) — tap to continue**

> Let’s keep our good habits!

Effects: a soft blue scan line sweeps across the habitat shield; the radiation detector clicks slowly; the Shield bar glows green once; no alarm and no tint.

Scene dialogue:

Kai: “Our mission starts with a calm solar setting. A check never hurts.”

Mei: “Radiation is invisible, so we measure it.”

Dr. Thiri (late message): “Your mission uses a calm solar setting. Keep up the good work, Commander!”

Choices: how do we use a quiet day?

A. Run the full shield check (Power −4, Shield +6)

After: “We checked every shield panel. It used a little power, and now we are better protected.”

B. Quick safety drill, research pauses (Power −2, Shield +3)

After: “Practice makes us ready. Research waited a little, and we learned the safety steps.”

C. Skip the check and keep working (Science +2, Shield −4)

After: “We got extra science, but we missed a safety check. Our game’s protection meter went down a little.”

Real moment (card): NASA watches the Sun even during quieter periods. [DATA: observation-window start/end, source and the calm classification supported by the returned observations. If no qualifying event is recorded, describe that result; do not invent an event type or class or treat unavailable data as calm.] This mission is inspired by those observations. The card shows the observation date, the fetch date, the source link, and whether the data is Live, Cached or Saved. [CHECK: confirm on NASA’s space weather pages.]

Kids learn: a quiet Sun still needs checks, and the best time to maintain a shield is before you need it.

### Version 2: Active (warning and preparation)

Mood and look: alert but calm. A faint purple-pink glow creeps in at the horizon, gentle pulsing synth music, an amber SUN WATCH banner.

**Narration (Robo) — tap to continue**

> Beep! My radiation detector is clicking faster.

**Narration (Robo) — tap to continue**

> NASA recorded increased solar activity in our mission’s observation window. In our story, we are preparing for a possible particle burst.

**Narration (Robo) — tap to continue**

> It isn’t an emergency yet. Let’s get ready, Commander!

Effects: purple glow grows slowly along the horizon; the clicking speeds up a little; the Shield bar flashes amber once; an amber banner slides in: SUN WATCH; Kai reads a gauge.

Scene dialogue:

Kai: “We can’t see radiation, but we can measure it. Let’s be careful.”

Dr. Thiri (late message): “Our scientists are watching the Sun. Get your shield ready!”

Robo: “Her message was late, so we are already getting ready!”

Choices: how do we get ready?

A. Boost the shield (Power −10, Shield +14)

After: “The shield is ready! It used some power, but we are well prepared if the Sun gets busier.”

B. Short shelter break, research pauses (Power −4, Shield +7)

After: “We waited safely inside for a while. Research paused, but nobody is in danger.”

C. Keep working and watch the meter (Science +2, Shield −10)

After: “We got extra science, but the shield took a hit. Watching is smart, and so is getting ready early.”

Real moment (card): NASA observed increased solar activity: [DATA: observation type or class] on [DATA: observation date]. This mission is inspired by that real space weather. The card shows the observation date, the fetch date, the source link, and whether the data is Live, Cached or Saved. NASA scientists watch the Sun so astronauts can be warned early. [CHECK: confirm on NASA’s space weather pages.]

Kids learn: a busy Sun means getting ready early, and shielding costs power.

### Version 3: Stormy (shelter and protection)

This is the original scene, with its original numbers. Its narration and Real Mars card now follow the NASA wording rule.

Mood and look: dramatic and electric. A purple-pink glow in the sky, pulsing synth music, a clear but gentle alarm.

**Narration (Robo) — tap to continue**

> Beep, beep! My radiation detector is clicking fast.

**Narration (Robo) — tap to continue**

> In our story, a burst of fast, tiny particles from the Sun is reaching us. This is called a solar storm.

**Narration (Robo) — tap to continue**

> Mars has very little protection, so we must act!

Effects: purple glow across the sky; the screen edge pulses; a clicking sound speeds up; crew sprites hurry toward the shelter; the Shield bar sparkles. After the choice, a Real Mars card slides in.

Scene dialogue:

Kai: “We can’t see radiation, but it can be harmful to astronauts.”

Dr. Thiri (late message): “Storm warning! Stay safe!”

Robo: “Her message arrived after the storm started. That’s signal delay again!”

Choices: how do we protect the crew?

A. Boost the shield (Power −15, Shield +20)

After: “The shield is strong! It used a lot of power, but the crew stays well protected.”

B. Everyone into the shelter, research pauses (Power −5, Shield +10)

After: “Everyone is safe inside. We lose research time, but nobody is in danger.”

C. Keep working and watch the meter (Science +2, Shield −20)

After: “We got extra science, but the shield took a big hit. Next time, let’s weigh the risk.”

Real moment (card): NASA observed [DATA: observation type or class] on the Sun on [DATA: observation date]. This mission is inspired by that real space weather. The card shows the observation date, the fetch date, the source link, and whether the data is Live, Cached or Saved. Curiosity carries a radiation detector that has measured radiation at Gale since landing. Mars can even have faint auroras. [CHECK: confirm the detector and auroras on NASA pages.]

Kids learn: radiation, shielding costs power, and NASA watches the Sun.

## Sol 7: Sparks and Flickers (Equipment Failure)

Mood and look: tense and hands-on. Amber lights flicker, a red beacon blinks, and the music has a ticking rhythm.

**Narration (Robo) — tap to continue**

> Crackle! A solar panel is throwing sparks.

**Narration (Robo) — tap to continue**

> Machines get tired out here, Commander, and fixing them early is part of the job.” If the player chose C on Sol 5, Robo says instead: “That flicker from Sol 5 is back, and it’s bigger!

Effects: lights flicker; spark sprites; a red beacon on the panel; Kai’s wrench animation with little gears; a success jingle when fixed.

Scene dialogue:

Kai: “Uh-oh, that panel is making sparks! I can fix it, but it takes power and time.” Kai (after a fix): “Good as new. Almost!”

Choices (if Sol 5 was C, every repair costs 5 more Power): how do we fix it?

A. Full repair (Power −15, fully fixed)

After: “Good as new! The repair took a lot of power, but now the panel is safe.”

B. Quick patch (Power −6, may cause a leak on Sol 8)

After: “A quick patch saved power, but patches don’t always hold. Let’s keep an eye on it.”

C. Switch to backup panels (Power −8, solar power −5 for the rest of the mission)

After: “The backup panels work, but they make a little less power from now on.”

Real moment (card): Real rovers wear out too. Curiosity’s wheels got small holes over time, so engineers on Earth changed how it drives to protect them. [CHECK: confirm on NASA’s Curiosity pages.]

Kids learn: maintenance, and that choices can come back later.

## Sol 8: Hiss! (Leak) or Shooting Stars (Meteors)

If the Sol 7 choice was B and set quickPatch, play the leak. Otherwise, play the meteor shower. This is one Sol 8 slot, not an extra sol.

### Version 1: Hiss! (Leak)

Mood and look: urgent but not scary. Soft red lights sweep the room, a gentle siren, fast pulsing music.

**Narration (Robo) — tap to continue**

> Hiss, hiss! There’s a tiny leak in one of our air modules.

**Narration (Robo) — tap to continue**

> Remember that quick patch? Sometimes a quick fix doesn’t hold.

**Narration (Robo) — tap to continue**

> Don’t worry, it’s a small one!

Effects: white puff sprites at the module; the air meter slowly drips; Mei runs over with a patch kit.

Scene dialogue:

Mei: “I found it! We can patch it.”

Kai: “Patching uses power. Backup oxygen is another way.”

Choices: how do we stop the leak?

A. Patch the leak (Power −10, loss stops)

After: “Patched! The air is staying inside now. It cost power, but the problem is solved.”

B. Use backup oxygen (Life +10, Power −3, lose the end-of-mission bonus)

After: “The backup tank keeps us breathing, but it won’t last forever, and the leak is still there.”

C. Everyone rests to use less air (Life −2 instead of −5, research pauses)

After: “Resting saves air, but the crew can’t do science today. Slowing down is a real trick astronauts use.”

Real moment (card): Real space stations have had tiny air leaks, and crews find them and patch them. [CHECK: confirm on NASA’s space station pages.]

### Version 2: Shooting Stars (Meteors)

Mood and look: wonder with a little danger. Streaks of light cross the sky, with a whooshing sound.

**Narration (Robo) — tap to continue**

> Look up, Commander! Shooting stars!

**Narration (Robo) — tap to continue**

> Mars has thin air, so more tiny meteors reach the ground than on Earth. Most are very small, but let’s check the roof.

Effects: fast streak sprites; small dust puffs on the ground; a light screen shake.

Scene dialogue:

Kai: “Most are tiny, but a roof check never hurts.”

Choices: what do we do?

A. Shelter the crew (research pauses, no damage)

After: “Everyone stayed safe, and the roof is fine. We just lost a little research time.”

B. Reinforce the roof (Power −10, Shield +10)

After: “A stronger roof will protect us better from now on. It used some power today.”

C. Keep going (Science +1, Life −5)

After: “We kept working, and a small piece hit a module. We lost a little air. A quick check could have helped.”

Real moment (card): NASA’s Mars orbiters have photographed fresh craters made by small impacts. [CHECK: confirm on NASA’s orbiter pages.]

Kids learn: air is precious, and thin air means more meteors reach the ground.

## Sol 9: The Coldest Night

Mood and look: cold, hushed, a little tense but cozy. Blue-white tones, soft piano, a low wind.

**Narration (Robo) — tap to continue**

> Brrr! Tonight is the coldest night yet in our story.

**Narration (Robo) — tap to continue**

> Heaters use a lot of power. The plants and crew need warmth, but heating every system costs power.

**Narration (Robo) — tap to continue**

> What can we switch off? What matters most, Commander?

Effects: frost spreads from the window corners; breath clouds; the thermometer icon sinks; the greenhouse glows warm gold; stars look extra sharp.

Scene dialogue:

Mei: “Plants freeze if it gets too cold. Tomorrow’s food needs them!”

Kai: “Maybe we turn off what we don’t need.”

Choices: where does the heat go?

A. Heat everything (Power −18, Life +3)

After: “Everyone is warm, plants and crew! Heating everything used a lot of power.”

B. Heat the crew and plants only, lab off (Power −10)

After: “We kept what matters warm and saved power by switching off the lab. Good prioritizing!”

C. Minimum heat (Power −5, Life −5, plants suffer)

After: “We saved lots of power, but the plants got too cold, and tomorrow’s food will be smaller.”

Real moment (card): Curiosity uses heat from its onboard power source to stay warm on cold nights. [DATA: the coldest night temperature at Gale from Curiosity’s weather readings.] [CHECK: confirm on NASA’s Curiosity pages.]

Kids learn: prioritizing what matters most when power is limited.

## Sol 10: The Great Test (fixed finale)

Mood and look: epic, then hopeful. It opens with a red-orange storm and flashing alerts, and ends in golden dawn with a warm, heroic theme.

**Narration (Robo) — tap to continue**

> This is it, Commander, the last sol! A dust storm and a freezing night are coming at the same time.

**Narration (Robo) — tap to continue**

> The supply ship arrives soon. All we have to do is keep the outpost running.

**Narration (Robo) — tap to continue**

> You have learned so much. You can do this!

Effects: swirling storm; a rumbling sound; flickering lights; then sudden calm and a sunrise sweep; Mount Sharp turns gold; a small light, the supply ship, appears in the sky; pixel fireworks on success.

Scene dialogue:

Kai: “Our systems share power. Where should it go?”

Mei: “Air, shield or warmth? You decide!”

Dr. Thiri (reply arrives only after successful final-night check): “Commander, I just got your message. Your plan looks great! Earth is so proud of you.”

Choices (power plan): how do we get through the storm?

A. Balanced (a little to each system)

After: “We shared power across the systems. Real mission planners balance competing needs too.”

B. Air first (Life stays high, Shield and warmth lower)

After: “We prioritized air. That left less power for other needs.”

C. Shield first (Shield stays high, Life and warmth lower)

After: “We prioritized protection. That left less power for other needs.”

Check for an empty meter immediately after the choice result. If none is empty, apply final night upkeep and check again. Success is allowed only when all meters remain above 0 after Sol 10 NIGHT; otherwise play the gentle ending. Gate Dr. Thiri’s congratulatory reply, dawn/supply-ship arrival and fireworks to success. Never show success celebration after failure.

Real moment (card): NASA is working toward a lasting presence on the Moon and, later, human exploration of Mars. Real mission planners balance power, air and protection every day. [CHECK: confirm on NASA’s Artemis pages.]

Kids learn: putting everything together, just like real mission planners.

## Endings

Success: dawn breaks and the supply ship’s light appears. Robo: “Mission complete! You kept the outpost running for 10 sols. Real mission planners balance air, power and protection just like this.” Show the Mission Report and a printable Junior Commander certificate.

Gentle ending: “The outpost has to power down, but the crew is safe in the emergency shelter, and the supply ship is on its way. Want to see what happened?” Robo gives one hint, like “Next time, try saving power before a storm.”

Mission Report: the choices made, a meter graph across the sols, why it worked or failed, and the NASA data sources used.

Robo’s mission summary: shown with the report. Accepted AI text is labeled “Written by AI”. Otherwise show the local template labeled “Robo’s mission summary”; see the supporting template and timing contract above.

Mission Album: every encountered Real Mars card is saved with its source, whether or not it was opened.

Commander style: one friendly label based on the choices, such as Careful Planner, Brave Explorer or Crew Protector. A reflection, never a grade.

## Mission order (fixed, no shuffle)

The order never changes, so callbacks such as the Sol 5 flicker returning on Sol 7 always work.

- Sol 1: Touchdown

- Sol 2: First Night

- Sol 3: Dust Storm Warning

- Sol 4: Ice Hunt and Curiosity

- Sol 5: Calling Earth

- Sol 6: Solar Encounter (calm, active or stormy, from the NASA input read once at mission start)

- Sol 7: Equipment Failure

- Sol 8: Leak or Meteors (chosen by the Sol 7 repair choice)

- Sol 9: Cold Night

- Sol 10: Finale

Calling Earth always asks for a decision before the reply arrives.

## Words to explain in the Learn screen

Sol: one Martian day, a little longer than an Earth day.

Radiation: invisible energy from the Sun that can be harmful.

Shield: protection that blocks radiation.

Solar panel: collects sunlight to make power.

Signal delay: the time a message takes to travel between Mars and Earth.

Dust storm: a huge cloud of dust that blocks sunlight.
