# Mars Mission Survival: Build Spec for Codex (v2)

*Working title. NASA Space Apps Challenge 2026, challenge: "Build a Junior Astronaut Mission Trainer". Spec v2 (replaces v1). It adds the Plan phase, NASA Real-Sky integration, Curiosity photos, mini-games, AI debrief and teacher pack, keeps the failure state, and lists every asset.*

---

## CONFIRMED UPDATE: single mission flow (reconciled November 11, 2026)

This section is authoritative for confirmed product decisions. The November 11 fixed-order and Rover Drive fallback decisions are incorporated here. The PDF remains the source for the original scene format; where it differs, this README governs.

**Player flow:** Start New -> read NASA input once (with saved-data fallback) -> Plan phase with Robo guidance -> prologue -> Sol 1 -> Sol 2 -> middle mission events -> Sol 10 -> ending and mission report.

**Original base game plus six additions:**
1. Plan phase: choose cargo under the launch-weight budget; Robo gives optional advice based on the NASA input. Advice never forces a cargo choice.
2. NASA Real-Sky integration: part of the single mission, not a separate mode. It selects the calm, active or stormy solar-event version and supplies attributed observation details.
3. Mini-games: optional quick tasks, always skippable.
4. Real NASA/Curiosity photo cards: real facts, credits and source labels.
5. AI debrief: Gemini summary with a local rule-based template backup.
6. Teacher pack: separate menu access, printables and Classroom setting.

**No mode-selection screen. Free Play / Endless is excluded. No optional post-mission quiz is planned.**

### Discussion status and document ownership

**Core feature discussion is complete.** The agreed product goal is knowledge through fun for ages 7-12. Remaining work is content production, art approval, balancing and implementation verification, not a request to invent more features.

- This README describes gameplay, scope, UI, technical behavior and the asset catalog in Section 11.
- Title, Plan and report use the assembled outpost or frontend layout; prologue uses code-drawn stars/planet/landing cues initially. No separate title, cargo-bay, report or prologue image is assigned. Dedicated illustrations require a later scoped decision, not an assumption that an artist missed them.
- Writing status (November 13): `docs/story-script.md` v2.1 contains all 13 scene versions, revised narration/timing and supporting Plan, cargo, warning, mini-game, template-summary, caption-slot, glossary and classroom copy. The source v2 PDF is preserved. Remaining work: verify NASA `[DATA]`/`[CHECK]` entries, select/caption photos, approve art/style, test resource balance and child readability, convert content to runtime files, measure scene coordinates, and verify APIs/public deployment. No new sol is required.
- The PDF supplies original scene writing/structure; this README supersedes it where new features differ; the fixed sol order is specified in 7.5. Exact art sizes remain working delivery targets until approved dependency artwork is available.

### Confirmed title menu, save and responsive UI

Title menu: **Start New**, **Continue** (only with a valid unfinished save), **Learn** (learning hub and Teacher Pack), **Sources & Credits**. Settings remains available during the mission. Start New opens a fresh cargo plan directly, without a replacement popup. An inline notice explains that launching replaces unfinished progress; Back preserves it until launch. Continue restores the existing run without fetching new NASA conditions.

Build dialogue boxes, speech tails, portrait/photo frames, meters, buttons, cards, source/disclosure labels and all text with responsive HTML/CSS/SVG. No generated UI-frame images are required. On narrow screens, reflow portraits and choices instead of shrinking the whole interface into unreadable text. Make tap targets, focus, font sizing and Reduce Motion work independently of scene art.

The scene is layered: sky/mountain/terrain -> permanent structures -> optional packed-cargo objects -> characters -> effects -> UI. Place effects below readable controls and make decorative overlays ignore pointer input. The outpost is a fictional Gale-inspired simulation, not a photograph of a real base.

### Confirmed Plan phase: cargo, meters and 2D assets

- Players select upgrade packages once each (for example, "Extra solar panels"), not individual panel quantities such as three versus six. Each package consumes launch-weight points, so bringing one upgrade leaves less room for others.
- Cargo changes actual game calculations, not just the scene's appearance. Extra panels increase power generated each sol; they do not increase the Power meter's maximum or immediately fill it. All three meters remain capped at 100.
- **Starter-number example:** both loadouts can begin at Power 65/100. Standard generation of +12 yields 77/100 at sol start; packing extra panels raises generation to +15, yielding 80/100. This comparison excludes penalties, event costs and night upkeep. Numbers remain subject to balancing.
- Show current stored Power separately from a short generation label such as "Solar generation: +15 per sol". Keep generation rules in the engine and use the selected cargo modifiers consistently throughout the mission.
- Robo gives short cargo explanations and optional advice from the frozen NASA observation, with its date and source. The player still chooses freely within the budget.
- Show packed extra panels at the outpost using a transparent layer or repeated panel sprites over the base scene. Cargo combinations do not require separately generated full-scene images.
- Minimum extra-panel art: the cargo icon `cargo/solar_extra.png` and the scene layer `buildings/extra_panels.png`, already listed in the asset catalog. Static panels are sufficient; meter animation or a small power-flow effect can communicate generation. An unfolding animation is optional, not required.
- Other visible upgrades can use the catalog's battery-box and shield-plating layers. Not every cargo item needs a new visible building or animation; its benefit must be explained in the UI and applied by the engine.

### Confirmed Teacher Pack scope

Keep the lesson plan, event-matched discussion questions, kid-friendly vocabulary, prediction/choice/result worksheet, Mission Album printing and certificate. The title-menu entry is **Learn**, opening **Your Mars Learning**; it contains these Teacher Pack materials. Classroom is a setting on the same mission, not a new mode; Section 14 owns its presentation and print requirements. No student accounts, connected devices or automatic voting.

### Confirmed photo cards: knowledge through fun for ages 7-12

The goal is learning through play: make a decision, see its consequences, then discover one short real-world connection. Keep Robo friendly and curious, never scolding. Photo cards are brief optional discoveries, not lectures, quizzes or gates to continuing the mission. See 12.6 for the public-release implementation and backups.

- After the choice result and Robo's explanation, show a small "Real Mars - tap to explore" invitation. Opening it reveals a real image, one short fact linked to the event, and an easy Continue/close action. Children may continue without opening it.
- Use grade 3-5 language, one or two short sentences, large readable text and clear controls. Explain unfamiliar words in context. Keep the main fact short enough to read in about 10 seconds; put technical metadata and source details in a secondary expandable area.
- Use curated real NASA images shipped with the site, not a live photo API. NASA Real-Sky observations are a separate integration. Saved photos remain honestly labeled even when the solar observation was fetched live.
- Reuse suitable images across event variants where accurate. Select cards by the actual event/variant ID, not its sol number. Save encountered card IDs to the Mission Album without requiring every card to be opened.
- Photos must support the fact without implying they document the fictional crew or today's outpost conditions. Never present generated art as a real NASA photo. Preserve image credits and distinguish photographs from diagrams or illustrations.

### Confirmed scene count: 10 sols, 13 prepared versions

| Fixed sol | Event | Prepared versions |
|---|---|---|
| 1 | Touchdown tutorial | 1 |
| 2 | First Night | 1 |
| 3 | Dust Storm Warning | 1 |
| 4 | Ice Hunt and Curiosity | 1 |
| 5 | Calling Earth | 1 |
| 6 | Solar encounter: calm OR active OR stormy | 3 |
| 7 | Equipment Failure | 1 |
| 8 | Leak OR Meteor Shower, selected by earlier repair choice | 2 |
| 9 | Cold Night | 1 |
| 10 | Finale | 1 |
| Total | Ten scenes played per completed mission | 13 |

The three extras are two alternative solar versions and one alternative leak/meteor version. Each version includes its dialogue, mood/camera/effect cues, choices, meter effects, After lines and Real Mars card. Choice responses, prologue, endings and Plan guidance are additional writing, not extra sol events. No separate preparation or aftermath sol is added.

### Exactly where NASA input is used

- Fetch recent NASA observations once at mission start, before cargo selection. Freeze the chosen input, source, observation date, sky level and event variant for the run; do not change conditions halfway through.
- Robo explains the observation during Plan and offers cargo advice. Say "NASA observed increased solar activity" rather than claiming today's weather at the Mars outpost.
- The solar event uses its prepared calm (routine protection check), active (warning/preparation), or stormy (shelter/protection) version. Player choice and cargo determine meter changes within tested limits.
- Its Real Mars card shows the actual observation, date, source link and Live/Cached/Saved status. A live fetch can contain an older observation; show both observation and fetch dates.
- Dust, cold, ice hunts, equipment faults and meteors remain authored simulation events. Do not claim the solar feed predicts them or that a reported event hit Mars. Describe the mission as inspired by real NASA space-weather observations.

### Fixed order, storage and backups

The order is fixed: touchdown -> first night -> dust warning -> ice hunt -> calling Earth -> solar encounter -> equipment failure -> leak or meteors -> cold night -> finale. NASA input selects the Sol 6 solar variant; the earlier repair choice selects Sol 8. Neither changes the order. Camera/effect cues stay keyed to event IDs. See 7.5 for the exact IDs.

No database is needed. Save mission state and the frozen NASA snapshot locally with an in-memory fallback (Section 15). NASA and AI backups are defined in 7.8, 13.1 and the Section 16 fallback table. Neither API may block completion. No gameplay random seed is needed; only the balance simulator may use a seed for repeatable random-choice sampling.

### Confirmed Rover Drive and its fallback

Keep obstacles, tap and keyboard routing, friendly blocked-move feedback, no losing state and Skip always available. Add an implementation fallback setting that disables obstacle blocking in the same component, allowing a simple waypoint route to the ice. It does not create a new mode or change costs, rewards or completion history. See 7.10.

### Not in scope

- Shuffle, schedule randomization, seeded schedules and hazard-pacing constraints.
- Story/Daily mode selection, Free Play / Endless, and a post-mission quiz.
- Accounts, a database and cross-device progress synchronization.
- Live photo fetching or AI-generated NASA photographs.

---

## READ FIRST: rules, timing and how to use this file

1. **What the organizers have confirmed (as relayed by the team; keep a screenshot or email as proof):**
   - **AI use is allowed.** Disclose it in the README and in the game wherever AI writes text (Section 13). Ask whether disclosure is also needed for generated images, audio and code.
   - **Assets can be prepared before the event, as long as nothing is pushed to the official GitHub repository before Nov 14.**
2. **Still unconfirmed: writing game code before Nov 14.** The local meeting notes say starting code and creating files before 9:00 AM on the competition day can mean disqualification (time-stamps are checked). One mentor slide appeared to say projects can be prepared early. The new permission covers **assets**, so treat **code as not allowed until the organizers confirm it in writing.** Planning, the Story Script, data study and asset production are fine.
3. **How to prepare assets safely:**
   - Keep prepared assets in a local folder or in your own private repository, never in the official repository, until Nov 14.
   - Keep `asset-preparation/asset-log.md` (filename, tool, date, prompt, edits, license). Keep the original files and their real dates. Do not change time-stamps.
   - On Nov 14, after the event starts, make the first commit to the official repository and add the assets then.
   - Photos must be real NASA images, saved with their credit and a note about the usage guidelines.
4. **Time.** The meeting notes give about 18 on-site hours (Nov 14, 9:00 AM to 6:00 PM, then Nov 15, 9:00 AM with submission before 6:00 PM). The team believes there is more time. Confirm it. Every extra feature in this spec sits behind a feature flag (Section 4), so the base game can ship first and features can be added or cut without breaking it.
5. **How to use this file:** give this whole file to Codex and run the phases in Section 19 one at a time, once the rules above allow it. Before Nov 14, use the "Before the event" list in Section 19 (assets and planning only).
6. **Message to send to the organizers (copy and paste):**
   > Thank you for confirming that AI tools are allowed and that we may prepare assets before Nov 14 without pushing them to the official GitHub repository. May we also write game code locally before Nov 14 and push it only on Nov 14? Does the AI permission cover generated images, audio, text and code, and how should we disclose it? May we use open-source libraries and public NASA data and photos? Is working overnight between Nov 14 and Nov 15 allowed, and are the submission limits (video length, slides) still 30 seconds or 7 slides?
7. **If code is not allowed before the event:** read API documentation and look at sample data (data study is allowed). To rehearse working with Codex, use a clearly unrelated throwaway project, delete it, and do not reuse its code or assets.

---

## 1. Project summary

- **What:** a browser game where kids aged 7 to 12 run a small outpost in Gale Crater on Mars for 10 sols (Martian days) and balance air and water, power and radiation shielding.
- **Core idea:** every choice has a cost. After each choice, Robo explains what happened and why, and a Real Mars card shows one real NASA fact with a real photo.
- **Story:** a supply ship arrives just after Sol 10. Until then, the outpost depends on the player (the Commander). Robo-Assistant narrates.
- **Standout features (v2):** pack your own cargo before launch (Plan phase), play one mission influenced by recent real NASA solar observations, quick hands-on mini-games, real Curiosity photos, a personal AI debrief from Robo, and a classroom teacher pack.
- **Goal:** a working prototype that teaches real constraints of deep-space survival (shared power, radiation, dust, signal delay, launch weight), not only a fun game.

### Challenge requirements and how we meet them

| Challenge asks | Our answer |
|---|---|
| Kids ages 7 to 12 | Short sentences, grade 3 to 5 reading level, big buttons, glossary tooltips |
| Lunar or Martian outpost | Mars, Gale Crater |
| Life support, shielding, power, food, communication delay | Three meters (Life Support, Power, Shielding). Food is a choice (greenhouse lights, greenhouse kit). Communication delay is a Sol 5 mechanic with callbacks on Sols 6 and 10 |
| No "free" choice | Choices have resource, delayed-effect, research or opportunity tradeoffs as listed in Section 9. Every cargo item has a weight cost and a downside |
| Real NASA data, attributed in the tool | DONKI space weather (the solar encounter and Plan briefing), Gale conditions, a Real Mars card on every sol with a real photo. Source on each card |
| Do not present static data as live | NASA observations show Live/Cached/Saved status; bundled photos say "Saved photo" |
| Link a decision to current space weather | NASA Real-Sky integration |
| Browser-playable, no account | Static site plus two small serverless functions. No login |
| Replayability | Branching flags, three NASA-selected solar variants and different cargo plans within the fixed order |
| Short note on datasets used | README "Data" section and an in-game Sources page |

---

## 2. Locked design decisions

| Topic | Decision |
|---|---|
| Setting | Mars, Gale Crater, 10 sols |
| Audience | Kids 7 to 12 (reading level grade 3 to 5) |
| View | Third-person 2D overview, semi-pixel art style. No first-person, no 3D |
| Meters | Life Support (air and water), Power, Shielding. Range 0 to 100. Food is a choice, not a bar. Build only these three confirmed meters |
| Cast | Robo-Assistant (narrator and guide), Dr. Thiri (Mission Control), Kai (engineer), Mei (gardener), Curiosity (real rover cameo on Sol 4) |
| Story | A supply ship arrives after Sol 10 |
| Mission | One mission flow; no Story/Daily selector. Free Play / Endless is outside confirmed scope |
| Before Sol 1 | **Plan phase:** pack cargo under a launch-weight budget |
| Sol flow | Robo hint, tap the glowing spot, Commander walks, event appears, choice, optional **mini-game**, After card, Real Mars card with photo, night upkeep, check |
| Walk rule | If the fix is a physical place, walk there. If it is a sudden warning, it interrupts wherever the player is |
| Reflection | No score, no "wrong" labels. After lines, Real Mars card, Mission Report, Mission Album, Commander style, **AI debrief** |
| Failure | Gentle ending with warnings, "What happened?" screen, retry from a sol (Section 7.6) |
| Order | All ten sol slots follow the fixed order in 7.5; Sol 6 has three solar variants and Sol 8 has the leak/meteors branch |
| Accounts | None. No personal data collected |
| Language | English in the submission. Burmese option is a stretch goal |
| AI | Allowed per the team. Used only for the end-of-mission debrief and for asset creation (disclosed) |

---

## 3. Characters and voice

- **Robo-Assistant ("Robo"):** friendly guide robot. Beeps, explains new words once, never scolds. Narrates every sol and writes the debrief.
- **Dr. Thiri:** calm and warm. Her messages always arrive late (signal delay).
- **Kai:** crew engineer. Fixes things, small jokes. Mentions the spare parts if packed.
- **Mei:** crew gardener. Greenhouse, air, plants. Mentions the greenhouse kit if packed.
- **Curiosity:** a real NASA rover that has explored Gale Crater since 2012. Only beeps. Robo translates.
- **Writing rules:** one or two short sentences per bubble, no fear language (the crew is always safe, even in the gentle ending), explain terms in context, never use a real person's name.

---

## 4. Scope, features and priorities

### Feature flags
All extras are switchable in `src/features.ts`. With every flag off, the base game must still work completely.

```ts
export const FEATURES = {
  plan: true,        // cargo Plan phase
  miniGames: true,   // quick tasks inside events
  photos: true,      // real photos on Real Mars cards
  realSky: true,     // NASA Real-Sky integration
  aiDebrief: true,   // Robo's AI summary at the end
  teacherPack: true, // teacher page, classroom mode, printables
};
```

### P0: base game (must work on its own)
- Core loop for sols 1 to 10 in default order, three meters, night upkeep
- Warnings, gentle failure and "What happened?" (Section 7.6), success ending
- Ten events with walk-to-spot, Robo narration, choices, After card, Real Mars card (text only)
- Mood presets (tint plus one particle type), saved DONKI and Gale data
- Public deployment, README with a Data section

### P1: standout features (each behind a flag; suggested order)
1. Real photos on Real Mars cards (small, high impact)
2. Plan phase (cargo)
3. Mini-games
4. Teacher pack (can be built in parallel by non-coders)
5. NASA Real-Sky integration (needs the sky function)
6. AI debrief (needs the debrief function)
7. Report/Album/Commander-style polish, sound and music, and Teacher Pack vocabulary polish. The basic failure report, confirmed title-menu entries and Reduce Motion behavior remain required; they are not deferred polish.

### P2: stretch
- Burmese language option, read-aloud (browser speech synthesis), printable certificate polish. Exclusions are listed under Not in scope.

If behind schedule, defer optional polish from the bottom of P1 first. Preserve the confirmed feature scope and working fallbacks; never cut the After card, Real Mars card, failure handling or baseline accessibility.

---

## 5. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS | Team already knows React, Vite and Tailwind |
| Game logic | Pure TypeScript module (`src/engine`), no React inside | Testable and tunable |
| State | `useReducer` or Zustand | Turn-based state |
| Animation | CSS transitions and keyframes (Framer Motion optional) | Walk, glow, overlays, meters |
| Mini-games | Plain DOM or SVG with pointer events (Canvas only if needed) | No game engine required |
| Audio | Native `Audio` or Howler.js | Small |
| **Backend** | **Two small serverless functions** (Vercel or Netlify): `/api/sky` and `/api/debrief` | Hide API keys, cache NASA data, call the AI safely |
| **Database** | **None.** JSON content, `localStorage` for progress, edge cache for NASA responses | No accounts, nothing to host |
| AI | Gemini (the team used it in Pathopia), called only from `/api/debrief` | Key stays on the server |
| Printing | Print stylesheets and static PDFs (`jsPDF` optional) | No server-side PDF work |
| Tests | Vitest (engine), optional Playwright smoke test | Protect the rules |
| Hosting | Vercel (preferred, for functions) or Netlify | Free, public link |
| Tools | ESLint, Prettier | Consistent Codex output |

Environment variables (server only; never ship keys to the browser): `NASA_API_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`. Provide a `.env.example`.

### Local development

**Member 1 checkpoint (November 14):** the existing starter is runnable; shared contracts, fixed-order routing and starter constants are in `src/engine/`. Read [docs/CONTRACTS.md](docs/CONTRACTS.md) before parallel work. The pure engine, storage/retry, scene player and approved Sol 1 timeline now have tested app-entry integration. The temporary development screen requires the backend sky contract; final UI/media, remaining sols and API handlers are still outstanding. See docs/SCENE_PLAYER_HANDOFF.md. Member 1 is working on `main` by explicit team instruction.

Use **Node 24** (supported versions are recorded in `package.json`). `npm run typecheck` and `npm run format:check` are available in addition to the commands below. `npm run validate` is a planned content-validation command, not implemented at this checkpoint.

The repository now has a runnable React/Vite/TypeScript starter scaffold; this is not yet a playable game, and the API handlers are not implemented.

```powershell
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Use `npm run dev:vercel` to run the Vite app with Vercel's local serverless-function support when API handlers are added. The scaffold also provides `npm run format:check` and `npm run format`.

---

## 6. Folder structure

```
mars-mission-survival/
  README.md                  # how to play, data sources, credits, AI disclosure
  .env.example
  docs/
    story-script.md          # all text: narration, dialogue, After lines, Real moments
    facts.md                 # verified facts and source notes
    PROJECT_STRUCTURE.md     # folder responsibilities
  asset-preparation/
    asset-log.md             # asset origins, prompts, edits, credits and rights
    bg/ buildings/ characters/ cargo/ minigames/ overlays/ photos/ audio/ references/
  public/
    assets/
      bg/ buildings/ characters/ overlays/ icons/ cargo/ minigames/
      photos/                # real photos (WebP)
      audio/                 # music/, sfx/, ambient/ inside this directory
      fonts/
    teacher/                 # printable PDFs and templates
  src/
    features.ts              # feature flags
    engine/
      types.ts balance.ts state.ts reducer.ts schedule.ts
      loadout.ts             # cargo modifiers
      mission.ts             # mission initialization and frozen sky snapshot
      sky.ts                 # DONKI data to sky level
      debrief.ts             # builds the debrief payload
      engine.test.ts
    content/
      events.json story.json glossary.json realMoments.json
      cargo.json photos.json minigames.json spots.json moods.json
      donkiArchive.json galeData.json debriefTemplates.json
    services/
      sky.ts                 # calls /api/sky with fallback
      debrief.ts             # calls /api/debrief with fallback
      storage.ts
    ui/
      screens/               # Title, Plan, Prologue, Scene, Debrief,
                             # Report, Teacher, Sources, Settings
      components/            # Meters, SolBadge, Hotspot, Commander, NarrationCard,
                             # ChoicePanel, AfterCard, RealMarsCard, PhotoFrame,
                             # CargoCard, BudgetBar, Overlay, Banner, SkyBadge
      minigames/             # CoverPanels, RepairWires, PatchLeak, RoverDrive
    App.tsx main.tsx
  api/
    sky.ts                   # DONKI proxy with caching
    debrief.ts               # AI debrief with safety checks
  scripts/
    simulate.ts              # random-choice playthroughs and loadout balance
                             # optional simulator-only seed; never changes event order
    validate-content.ts      # checks content files (Section 8)
```

Content ownership: no player-facing copy hard-coded in components. `story.json` owns UI/dialogue/After lines and instruction keys; `realMoments.json`, `glossary.json` and `debriefTemplates.json` own their confirmed structured facts, definitions and summary templates. Approved writing originates in `docs/story-script.md`; verified sources are recorded in `docs/facts.md`. Gameplay balance values belong in `balance.ts`, `cargo.json` and `events.json`; layout dimensions, sprite metadata and source observations are not gameplay balance values.

---

## 7. Game rules (engine)

### 7.1 State

```ts
export type MeterId = 'life' | 'power' | 'shield';
export type SpotId = 'habitat' | 'air' | 'greenhouse' | 'solar' | 'dish' | 'rover';
export type SkyLevel = 'calm' | 'active' | 'stormy';
export type CargoId = 'solar_extra' | 'batteries' | 'shield_plating' | 'greenhouse_kit'
  | 'water_recycler' | 'spare_parts' | 'rover_fuel' | 'radio_booster';
export type MiniGameId = 'cover_panels' | 'repair_wires' | 'patch_leak' | 'rover_drive';
export type MoodId =
  | 'calm_day' | 'golden_dawn' | 'dusk_night' | 'dust_storm' | 'solar_storm'
  | 'alarm_amber' | 'alarm_red' | 'meteors' | 'cold_night'
  | 'finale_storm' | 'finale_dawn';

export interface Effects {
  life?: number; power?: number; shield?: number; science?: number;
  noScience?: boolean;
  setFlags?: string[];
  solarPenalty?: number;
  pending?: { solsLater: number; effects: Effects };
}

export interface Modifiers {          // produced by the cargo plan
  solarGain: number; baseLoad: number; lifeUpkeep: number;
  startBonus: Partial<Record<MeterId, number>>;
}

export interface GameState {
  missionDate: string;                               // UTC date at run creation
  contentVersion: string;
  schedule: string[];                                // fixed sol slots; resolve Sol 8 via quickPatch
  solarVariant: SkyLevel;                            // frozen for this run
  sky?: { level: SkyLevel; source: 'live' | 'cache' | 'saved';
          eventId?: string; observedAt?: string; fetchedAt: string; sourceUrl?: string };
  cargo: CargoId[];
  modifiers: Modifiers;
  sol: number;                                        // 1..10
  phase: 'PLAN' | 'BRIEFING' | 'WALK_SELECT' | 'WALKING' | 'EVENT'
       | 'CHOICE' | 'MINIGAME' | 'RESULT' | 'REAL_CARD' | 'NIGHT' | 'ENDED';
  meters: Record<MeterId, number>;                    // clamped 0..100
  science: number;
  flags: string[];
  solarPenalty: number;
  pending: { appliesAtSol: number; effects: Effects }[];
  history: { sol: number; eventId: string; choiceId: string;
             miniGame?: 'done' | 'skipped';
             meters: Record<MeterId, number> }[];
  albumIds: string[];                                 // real moments seen
  ending?: 'success' | 'gentle';
  failedMeter?: MeterId;
}
```

### 7.2 One sol, step by step

1. **Sol start:** apply pending effects due this sol. Then `power += solarGain - solarPenalty` (from `modifiers`). Apply the plants consequence on the sol after Cold Night if `plantsSuffered` was set (once).
2. **BRIEFING:** Robo's narration card for the sol's event (with cargo or sky callbacks if they apply).
3. **If the event needs a walk:** `WALK_SELECT` (glow the target, wrong taps give a friendly hint, no penalty), then `WALKING` (about 1.5 seconds, skippable). Otherwise go straight to `EVENT`.
4. **EVENT:** apply the mood preset, show scene dialogue, then `CHOICE` (A, B, C with cost icons and a caution icon when relevant).
5. **MINIGAME (optional):** if the chosen action has a mini-game and the flag is on, show it. Result is `done` or `skipped`.
6. **RESULT:** resolve the selected authored event/solar variant first, then apply its choice effects, conditional flags/cargo adjustments and the mini-game bonus (only if `done`), then clamp. Variant effects replace the reference choice effects; do not apply stormy-reference costs and variant costs twice. Animate meters and show the matching Robo After line.
7. **REAL_CARD:** a small tappable Real Mars card with a photo. Save its id to `albumIds`.
8. **NIGHT:** `life -= lifeUpkeep`, `power -= baseLoad`. Clamp.
9. **Checks** (Section 7.6): check immediately after RESULT, before REAL_CARD/NIGHT, and again after NIGHT. If a meter is 0 or less, enter the gentle ending without advancing the normal sol flow. After Sol 10 NIGHT with all meters above 0, the ending is `success`. Otherwise go to the next sol.

### 7.3 Starter balance (tune in `balance.ts` only)

| Setting | Value |
|---|---|
| Start meters | life 80, power 65, shield 60 |
| lifeUpkeep (each night) | 5 |
| solarGain (each sol start) | 12 |
| baseLoad (each night) | 8 |
| Meter clamp | 0 to 100 |

### 7.4 Flags and branching

| Flag | Set by | Used by |
|---|---|---|
| `ignoredFlicker` | Sol 5, choice C | Sol 7: every repair costs 5 more power. Robo uses the "flicker is back, bigger" narration |
| `quickPatch` | Sol 7, choice B | Sol 8 plays the leak. Without it, play the meteor shower |
| `usedBackupO2` | Sol 8 leak, choice B | End report: no backup-oxygen bonus |
| `plantsSuffered` | Sol 9, choice C | Next sol start: life minus 3 (once) |
| `usedReserve` | Emergency Reserve (7.6, optional) | End report |

`solarPenalty` increases by 5 with Sol 7 choice C and lasts for the rest of the mission.

### 7.5 Fixed mission order

| Sol | Event ID / resolution |
|---|---|
| 1 | `touchdown` |
| 2 | `first_night` |
| 3 | `dust_storm` (dust warning) |
| 4 | `ice_hunt` |
| 5 | `calling_earth` |
| 6 | `solar_storm`, using the calm, active or stormy authored variant from the frozen NASA input |
| 7 | `equipment_failure` |
| 8 | `leak` if the Sol 7 repair set `quickPatch`; otherwise `meteors` |
| 9 | `cold_night` |
| 10 | `finale` |

Keep the existing IDs. NASA does not reorder events or determine unrelated Mars hazards. The Sol 3 pending dust effect applies on Sol 4; Calling Earth precedes its Sol 6/10 callbacks and Sol 7 equipment consequences; the Sol 9 plants consequence applies on Sol 10. Sol-number references guaranteed by this order may remain.

Each event owns its narration, choices, mood, camera/effect cues and card. Key cues to event IDs even though their sol slots are fixed. The three solar variants and leak/meteors branch still require 13 prepared scene versions for ten played sols. No seed, pacing algorithm or randomized schedule is used in gameplay.

### 7.6 Low meters and failure (kid-friendly)

Thresholds live in `balance.ts`: `warnAt: 30`, `dangerAt: 15`.

| Zone | Range | UI | Robo |
|---|---|---|---|
| OK | above 30 | normal bar | nothing |
| Low | 30 or less | yellow bar, icon pulses gently | warns once per meter per run |
| Danger | 15 or less | red bar, soft alert tone | gives a hint to fix it, each sol |
| Empty | 0 | mission ends | gentle ending |

- **Caution before a risky choice:** if a choice would take any meter to 0 or below, show a caution icon on its button. Tapping it makes Robo confirm ("That would use all our power. Are you sure?"). The choice is still allowed.
- **When to check:** after RESULT and again after NIGHT. If a meter is 0 or less, the mission ends. If two meters reach 0 together, use the one that dropped most as `failedMeter`.
- **Gentle ending:** never say "Game Over" and never say the crew is harmed. The crew is safe in the emergency shelter and the supply ship is still on its way. One message per meter (keys `ending.gentle.life`, `ending.gentle.power`, `ending.gentle.shield`):
  - Life Support: "Air and water ran very low, so the crew moved to the emergency shelter to wait for the supply ship."
  - Power: "The batteries ran out, so the outpost powered down. The crew is safe in the shelter."
  - Shielding: "Radiation got too strong, so the crew moved into the shelter to stay safe."
- **"What happened?" screen:** the meter graph by sol, the 2 or 3 choices that drained the failed meter most (computed from `history`), one hint (keys `hint.life`, `hint.power`, `hint.shield`), and the AI debrief if enabled (Section 13). No score. Hints: Life: "Try the ice hunt early, and watch the air." Power: "Try saving power before a storm." Shield: "Don't skip the shield during a solar storm."
- **Retry:** "Try again" starts a new mission at Plan with a fresh NASA lookup/fallback. "Try this sol again" restores the sol-start snapshot, retaining the same cargo, frozen NASA input and fixed order. Sol-start retry snapshots are kept in memory, separately from `GameState`; they are distinct from the durable Continue checkpoint in Section 15. Do not promise sol-start retry after reopening unless that snapshot is available; Continue still restores its durable checkpoint.
- **Optional, Emergency Reserve:** the first time a meter would reach 0, set it to 10 once and set flag `usedReserve`. Robo explains emergency reserves. The second time ends the mission.

### 7.7 Plan phase (cargo)

Before Sol 1 the player packs cargo under a **launch-weight budget of 10 points**. Robo teaches that real rockets can only carry so much. The habitat, air module, dish and rover are always included. Cargo items are upgrades. Starter items (all numbers are starters; tune with the simulator):

| Id | Item | Weight | Effect | Downside |
|---|---|---|---|---|
| `solar_extra` | Extra solar panels | 3 | `solarGain` +3 | Heavy |
| `batteries` | Big batteries | 2 | `baseLoad` −3 | Does nothing in daylight |
| `shield_plating` | Shield plating | 3 | start shield +20 | Only matters in radiation events |
| `greenhouse_kit` | Greenhouse kit | 3 | `lifeUpkeep` −2 | Heavy |
| `water_recycler` | Water recycler | 2 | start life +10 | One-time bonus |
| `spare_parts` | Spare parts | 1 | repair choices cost 5 less power (Sol 7) | Only useful if something breaks |
| `rover_fuel` | Extra rover fuel | 2 | ice hunt long trip costs 5 less power (Sol 4) | Only useful once |
| `radio_booster` | Radio booster | 1 | Sol 5 option A: Earth's tip gives +3 more power | Cannot make signals faster; only clearer |

Total weight of everything is 17, so the player must choose.

- **Rules:** no item may be best in every run. `scripts/simulate.ts` must try every loadout under the budget and report win rates. Acceptance: the best loadout wins at most about 15 percentage points more often than the average loadout.
- **Cargo effects in events:** events can list `ifCargo` adjustments (for example Sol 7: spare parts adds +5 power to every repair choice). Events can also add optional dialogue lines when a cargo item was packed (for example Kai: "Good thing we packed spare parts!").
- **UI:** a cargo bay screen with item cards (icon, name, weight), a budget bar ("Launch weight 7 of 10"), tap to add or remove, a "Balanced pack" preset button, and a "Launch!" button. Robo gives one short hint per item.
- **State:** the plan produces `cargo` and `modifiers` once. The engine never changes them during the mission.
- **Confirmed selection and visuals:** use one selectable package per cargo ID, not a quantity picker. Extra panels raise `solarGain` from the starter 12 to 15; Power capacity stays 100 and starting Power stays unchanged. Show the extra-panel layer only when `solar_extra` is packed. See "Confirmed Plan phase: cargo, meters and 2D assets" above for the comparison and minimum asset requirements.

### 7.8 NASA Real-Sky integration in the single mission

- Before Plan, `/api/sky` obtains recent DONKI observations (initial window: last 7 days). Use cached/saved data promptly if unavailable. Freeze the response for the run.
- Initial classification to verify against sample data: stormy for an X-class flare or energetic particle event; active for an M-class flare or fast CME; otherwise calm. These are game categories, not a Mars forecast.
- Plan guidance: Robo cites the observation and offers optional cargo advice. Keep it short, sourced and honest about saved data.
- Prepare three solar versions: calm = routine protection check, active = warning and preparation, stormy = shelter/protection encounter. Each has authored narration, dialogue, camera/effects, choices and After lines; no runtime AI scene generation.
- The team approved the v2 PDF's solar values on November 13. The table below is authoritative for all three versions and is mirrored in `docs/story-script.md` v2.1. Section 9 retains the original numbers as the stormy reference. These are starter values requiring balance tests, not an automatic severity multiplier. Variant dialogue matches its actual effects.

| Choice ID | Calm | Active | Stormy |
|---|---|---|---|
| A: shield check/boost | power -4, shield +6 | power -10, shield +14 | power -15, shield +20 |
| B: drill/shelter | power -2, shield +3, noScience | power -4, shield +7, noScience | power -5, shield +10, noScience |
| C: keep working | science +2, shield -4 | science +2, shield -10 | science +2, shield -20 |
- Solar costs can depend on sky level, player choice and cargo; cap difficulty so every level has a viable path. Do not apply NASA severity to dust, cold or equipment events.
- The real card names the actual observation, date/type/class and source URL. Say "inspired by real space weather NASA observed on [date]"; never claim the observation hit Mars.
- Badge: "NASA solar activity: calm / active / stormy", observation date and Live/Cached/Saved status. Fetch time is separate from observation time.
- Fallback: live -> valid cached response under 48 hours old -> bundled verified archive. Freeze the fallback too; a late response cannot change a started run.
- API: `GET /api/sky?date=YYYY-MM-DD` returns `{ date, level, event, source, fetchedAt }`. Server cache is about an hour; keys stay server-side. The date is an observation-query date, not a promise of identical missions for everyone that day.
- No separate preparation or aftermath event is required for this scope. Plan guidance, the solar encounter and the final report provide the connection.

### 7.9 Mini-games

Short hands-on tasks after the player picks an action. The choice and its cost stay the same. Finishing gives a small bonus. **Skip** is always available and applies the base result with no extra penalty.

| Mini-game | Event and choice | What the kid does | Bonus if done |
|---|---|---|---|
| `cover_panels` | Sol 3, choice A | Tap each of 4 solar panels to cover it | power +2 |
| `rover_drive` | Sol 4, choices A and B | Draw or tap a path for the rover around rocks to the ice | life +2 |
| `repair_wires` | Sol 7, choice A | Connect 3 matching wire pairs | power +2 |
| `patch_leak` | Sol 8 leak, choice A | Tap 3 leak spots to patch them | power +2 |

Rules: no timers, 10 to 20 seconds typical, no failure state (it cannot be lost), a keyboard or tap-only way to complete it, Reduce Motion version, Robo gives one hint line. The result is `done` or `skipped` and is stored in `history`.

### 7.10 Confirmed mini-game flow and implementation responsibilities

Mini-games are short hands-on tasks inside selected events, not separate modes or extra sols. Attach them to the fixed event/choice IDs, not presentation timing. Only the choices listed in 7.9 open a task; other choices continue directly to RESULT.

**Player flow:** event and dialogue -> choose an action -> task overlay with one Robo instruction and visible Skip -> complete or skip -> apply the choice result and any completion bonus once -> Robo's After card -> Real Mars card -> night upkeep.

- Open a focused task panel over the outpost. Keep Skip visible throughout. On completion or skip, close it and return to the normal story flow without losing mission state.
- Cover Panels: tap each of four panels to cover it; completion requires all four covered.
- Rover Drive: use tap-selected steps or waypoints to guide the rover around rocks to the ice. Drawing/dragging is optional; a tap-only and keyboard route must work. A blocked move gives friendly feedback rather than damage or a losing state. Skip remains visible throughout.
- Rover Drive implementation fallback: a component setting `obstacleBlocking` defaults to `true`. When set to `false`, the same component accepts the simple waypoint route without collision blocking. Rock art can remain decorative; do not give misleading blocked-move feedback in this setting. Both settings use the same ice destination, tap/keyboard controls, Skip, `done`/`skipped` history and +2 Life completion bonus. No timer, penalty or new gameplay mode is introduced. Test obstacle blocking on/off, blocked feedback when enabled, and one-time completion/skip behavior.
- Repair Wires: select one wire end, then its matching end; complete three pairs. Use symbols/labels as well as colors. A mismatch allows another attempt without a resource penalty.
- Patch Leak: tap each of three marked leak spots to place patches; completion requires all three patched.
- No countdown, forced time limit or losing state. The 10-20 seconds is a design target, not a deadline. Allow retries within the task and keep motion optional.
- Completing awards only the small bonus in 7.9. Skipping still carries out the selected story action and applies its normal effects; it does not leave the repair unfinished or add a penalty. Component errors also resolve as skipped.
- **Starter example:** Full Repair costs 15 Power. Completing Repair Wires adds 2 Power, for a net cost of 13 before any cargo adjustment. Skipping costs the normal 15. Apply effects only in RESULT, not again inside the task component; guard against repeated completion clicks and duplicate bonuses.
- Record `done` or `skipped` against the choice in mission history. Preserve keyboard focus when opening/closing the panel, support phone/tablet layouts, and honor Reduce Motion.
- Assets are task backgrounds and separate objects/sprites, not prerecorded videos. Reuse the established style and catalog in 11.9; implement movement, matching, patches and feedback in the UI.

**Team supplies for each task:** asset files and paths, intended player action, completion condition, and any desired layout/reference. For sprite sheets provide frame dimensions, frame order and animation intent when available. Unspecified layout/timing details can be resolved during implementation and review.

**Codex handles:** task code, tap/keyboard input, asset placement, interface animation, Skip/error behavior, one-time engine bonuses, history integration, responsive layout and Reduce Motion. The team playtests the result and requests adjustments. Implement only when the event's coding rules permit it; this section confirms the design, not an instruction to start coding now.

---

## 8. Data model for events and content authoring

```ts
export interface Choice {
  id: 'A' | 'B' | 'C';
  labelKey: string;
  costIcons: string[];
  effects: Effects;
  extraIfFlag?: { flag: string; effects: Effects };
  ifCargo?: { cargo: CargoId; effects: Effects }[];   // e.g. spare_parts
  miniGame?: { id: MiniGameId; bonus: Effects };
  afterKey: string;
}

export interface GameEvent {
  id: string;
  type: 'story' | 'emergency';
  location: SpotId | null;
  needsWalk: boolean;
  mood: MoodId;
  variants?: Partial<Record<SkyLevel, {    // solar encounter only; resolve before rendering
    mood: MoodId;
    narrationKey: string;
    dialogueKeys: string[];
    choices: Choice[];
    cameraCue?: string;
    effectCues?: string[];
  }>>;
  cameraCue?: string;                     // event-owned, independent of sol number
  effectCues?: string[];
  narrationKey: string;
  narrationAltKey?: { ifFlag: string; key: string };
  dialogueKeys: string[];
  dialogueIfCargo?: { cargo: CargoId; key: string }[];
  choices: Choice[];
  realMomentId: string;                    // card text and photo come from realMoments.json
  learnKey: string;
}
```

### Example (Sol 3, `dust_storm`)

```json
{
  "id": "dust_storm",
  "type": "story",
  "location": "solar",
  "needsWalk": true,
  "mood": "dust_storm",
  "narrationKey": "dust_storm.narration",
  "dialogueKeys": ["dust_storm.kai", "dust_storm.mei"],
  "choices": [
    { "id": "A", "labelKey": "dust_storm.A.label", "costIcons": ["power-"],
      "effects": { "power": -10, "pending": { "solsLater": 1, "effects": { "power": -5 } } },
      "miniGame": { "id": "cover_panels", "bonus": { "power": 2 } },
      "afterKey": "dust_storm.A.after" },
    { "id": "B", "labelKey": "dust_storm.B.label", "costIcons": ["power+", "science-"],
      "effects": { "power": 5, "noScience": true, "pending": { "solsLater": 1, "effects": { "power": -10 } } },
      "afterKey": "dust_storm.B.after" },
    { "id": "C", "labelKey": "dust_storm.C.label", "costIcons": ["science+", "power-"],
      "effects": { "science": 1, "pending": { "solsLater": 1, "effects": { "power": -15 } } },
      "afterKey": "dust_storm.C.after" }
  ],
  "realMomentId": "rm_dust_2018",
  "learnKey": "dust_storm.learn"
}
```

### How to author event content

This game stores authored content in JSON files and needs no database. Section 6 defines ownership of dialogue, structured facts, definitions and templates. Gameplay uses the fixed order in 7.5; a simulator seed, if used, only reproduces sampled choices.

To add or change an event:
1. Add an entry to `events.json` (spot, mood, choices, effects, flags, mini-game, cargo adjustments).
2. Add its text keys to `story.json`: `<id>.narration`, `<id>.dialogue.1`, `<id>.A.label`, `<id>.A.after` (and B, C), `<id>.learn`.
3. Add its Real Mars card (text, source, photo id) to `realMoments.json`.
4. Connect it to its existing fixed slot or variant/branch in `schedule.ts` without adding sols, reordering events or renaming IDs.
5. Run `npm run validate`.

`scripts/validate-content.ts` works like Pathopia's routing checks. It fails if a text key is missing, a choice has no After line, an event has no Real Mars card or photo entry, a flag is read but never set, a cargo id or mini-game id is unknown, or a speech bubble is longer than about 25 words (warning).

---

## 9. All events and starter effects

"noScience" means research is paused that sol. All numbers are starters. Put them in `events.json` and `balance.ts`, and tune with the simulator. Use the fixed sol slots in 7.5. Prepare 13 scene versions for ten played sols. The solar row below gives the existing stormy-version reference numbers and mood only; the three approved authored variants are specified by 7.8 and replace, rather than stack with, those effects.

| Sol | Event id | Spot (walk?) | Mood | Choices and effects | Mini-game and cargo |
|---|---|---|---|---|---|
| 1 | `touchdown` | habitat (yes, tutorial) | golden_dawn | A life +5, power −5. B shield +5, power −5. C life +3, power −8 | Robo comments on the packed cargo |
| 2 | `first_night` | none (no) | dusk_night | A power −15, life +2. B power −8, life −2. C power −4, life −5 | none |
| 3 | `dust_storm` | solar (yes) | dust_storm | A power −10, then next sol power −5. B power +5, noScience, then next sol power −10. C science +1, then next sol power −15 | A: `cover_panels` (+2 power) |
| 4 | `ice_hunt` | rover (yes) | calm_day, Curiosity cameo | A life +8, power −5. B life +18, power −15, shield −5. C life −3 | A and B: `rover_drive` (+2 life). B with `rover_fuel`: power +5 |
| 5 | `calling_earth` | dish (yes) | dusk_night, radio static | A power −3 net (−8 waiting, +5 from Earth's tip). B power −10. C science +2, set `ignoredFlicker` | A with `radio_booster`: power +3 |
| 6 | `solar_storm` | none (no) | solar_storm | A power −15, shield +20. B power −5, shield +10, noScience. C science +2, shield −20 | Use one of three prepared solar versions (7.8) |
| 7 | `equipment_failure` | solar (yes) | alarm_amber | A power −15. B power −6, set `quickPatch`. C power −8, solarPenalty +5. If `ignoredFlicker`, every choice costs 5 more power | A: `repair_wires` (+2 power). All with `spare_parts`: power +5 |
| 8a | `leak` (if `quickPatch`) | air (yes) | alarm_red | A power −10. B life +10, power −3, set `usedBackupO2`. C life +3 (offsets upkeep), noScience | A: `patch_leak` (+2 power) |
| 8b | `meteors` (otherwise) | none (no) | meteors | A noScience. B power −10, shield +10. C science +1, life −5 | none |
| 9 | `cold_night` | greenhouse (yes) | cold_night | A power −18, life +3. B power −10, noScience. C power −5, life −5, set `plantsSuffered` | none |
| 10 | `finale` | none (no) | finale_storm then finale_dawn | A balanced: life −4, power −8, shield −4. B air first: life 0, power −10, shield −8. C shield first: life −8, power −10, shield 0 | none |

All player-facing text (narration, dialogue, After lines, Real moments, "Kids learn") lives in `docs/story-script.md` (the team's Story Script). Paste it in at the start and ask Codex to convert it into `src/content/story.json` using the keys above. Do not rewrite the wording. New lines to add to the script: Robo's cargo-packing narration, the NASA observation briefing and three solar versions, mini-game instruction lines, photo captions, cargo callbacks (Kai, Mei), and the debrief voice template.

---

## 10. UI and scene spec

### 10.1 Screens
1. **Title:** game name, Start New, Continue (only for a valid unfinished save), Sources & Credits, Learn, and an optional NASA observation badge. Explain the replacement inline; replace saved progress only when the new cargo launches.
2. **Mission initialization (no mode screen):** obtain NASA input or fallback once, then open Plan. No Story/Daily selection.
3. **Plan phase:** cargo bay with item cards, budget bar, Balanced pack, Launch, and Robo's optional NASA-based cargo guidance with observation date/source.
4. **Prologue:** Robo narration cards with typewriter text and tap to continue.
5. **Scene (main screen):** HUD plus outpost map (below).
6. **Mini-game overlays:** one per mini-game, with Robo hint and Skip.
7. **Vocabulary (inside Teacher Pack):** the fixed glossary remains available to teachers; the Learn entry opens the complete learning hub, rather than a second standalone glossary.
8. **Debrief and Mission Report:** Robo's AI debrief (or template), choices made, meter graph by sol, why it worked or failed, Mission Album, Commander style, data sources.
9. **Learn (Your Mars Learning):** learning materials, Teacher Pack downloads/printing, Classroom presentation switch and lesson plan links.
10. **Sources:** every dataset and photo used, links, observation Live/Cached/Saved status, and Saved photo labels for bundled images.
11. **Settings:** sound, reduce motion, text size, Classroom mode.

### 10.2 Scene layout
- **Top bar:** three meters (icon, label, percent, bar) and the sol badge ("Sol 3, Day").
- **Center:** the outpost with six tappable spots, the Commander sprite and Robo.
- **Bottom:** Robo speech bubble or narration card. Choices appear as three big buttons with cost icons.
- **Side:** Learn and Help buttons. Use the team's own logo. No NASA logo unless the brand guidelines allow it.

### 10.3 Tappable spots
The image is only the picture. Spots are transparent buttons placed with percentages.

```json
{
  "habitat":    { "x": 56, "y": 34, "w": 26, "h": 26, "stand": [60, 62] },
  "air":        { "x": 44, "y": 34, "w": 12, "h": 26, "stand": [48, 62] },
  "greenhouse": { "x": 10, "y": 22, "w": 26, "h": 32, "stand": [24, 60] },
  "solar":      { "x": 6,  "y": 58, "w": 24, "h": 32, "stand": [30, 72] },
  "dish":       { "x": 76, "y": 12, "w": 10, "h": 22, "stand": [78, 40] },
  "rover":      { "x": 68, "y": 62, "w": 18, "h": 24, "stand": [72, 74] }
}
```
Placeholder numbers: measure the final art (pixel box divided by image width and height) and replace them.

- Scene container: `position: relative; aspect-ratio: 16 / 9`. Sky layer, ground layer and building layers stack inside it.
- Each spot is an absolutely positioned `<button>` (percent units), with `aria-label`, transparent background and a touch size of at least about 44 px.
- Active target: CSS pulse glow. Wrong tap: Robo shows a friendly hint ("Nothing needed here. Try the glowing spot!"). No penalty.
- Commander: absolutely positioned sprite moved with a CSS transition on `left` and `top` (about 1.5 s). Fire the arrival event once (guard against `transitionend` firing for both properties). A skip button jumps to the end.
- On arrival: apply the mood, show scene dialogue, then the choices.

### 10.3.1 Confirmed locations and adaptation of the reference sketch

The team's location diagrams and React sketch describe the same six-spot system already specified above. The 13 prepared scene versions do not require 13 locations or maps. Buildings stay in place; event IDs determine destinations and camera/effect cues. The diagrams' sol labels match the fixed order in 7.5; no map or location randomization is required.

| Event / version | Walk required? | Target / presentation |
|---|---|---|
| Touchdown | Yes, short tutorial walk | Habitat control |
| First Night | No | Dusk and heating choices appear wherever the Commander is |
| Dust Storm Warning | Yes | Solar panel field |
| Ice Hunt / Curiosity | Yes | Rover garage; rover departure and Curiosity camera cue belong to this event |
| Calling Earth | Yes | Comms dish |
| Solar encounter: calm, active or stormy | No for all three | Open the matching check/warning/protection panel wherever the Commander is; calm does not use a storm alarm |
| Equipment Failure | Yes | Solar panel field |
| Leak | Yes | Air module |
| Meteors | No | Sky/outpost interruption |
| Cold Night | Yes | Greenhouse |
| Finale | No | Whole-outpost scene; a dish/message camera cue does not require a walk |

- Keep one stable 16:9 outpost composition with separate sky, terrain, building, cargo and effect layers. Dust, frost, alarms and solar glow are overlays; do not generate a full new outpost for each event. Existing sky layers may still change for day/night.
- The reference diagram labels habitat for Sols 1 and 10, but also says the finale needs no walk. Resolve this as above: habitat is the tutorial target; the finale may show habitat/dish actions cinematically without making the player walk there.
- Both sets of sample coordinates (the reference React `SPOTS` and the JSON above) are placeholders. Use only one final `spots.json`, measured from the approved artwork: `x = left / width * 100`, `y = top / height * 100`, with equivalent formulas for hitbox width/height. `stand` is a separate reachable ground position near the building, not the hitbox center.
- Use a consistent Commander foot anchor for `stand` coordinates and define draw order so the sprite does not appear to float over buildings. Choose unobstructed paths; straight CSS transitions alone do not avoid obstacles. Add a few waypoints only where the final layout needs them.
- The React example is a layout sketch, not complete game logic. Accept hotspot input only during WALK_SELECT; lock duplicate walk requests, advance on arrival once, and support Skip, Reduce Motion and already-at-target cases without waiting for a transition event that may never fire.
- Keep overlays decorative (`pointer-events: none`); transparent buttons still need visible keyboard focus, descriptive labels and a static target marker when pulses are disabled. Validate at least 44-pixel effective targets at actual phone/tablet sizes, without overlapping neighboring buttons. Reflow the UI or offer labeled location controls if the scaled map is too small.
- Camera pans/zooms must transform the artwork, sprites, hotspots and effects together, so tap targets remain aligned. Event camera cues must not alter the logical location coordinates or depend on hard-coded sol numbers.
- Keep image text in HTML, reuse the established palette/style and preserve transparent sprites and crisp pixel scaling. Follow the current asset-log and organizer-confirmation rules in READ FIRST; the older screenshot's uncertainty about AI permission does not replace those rules.

### 10.4 Cards after a choice
- **After card (Robo):** automatic speech bubble with 1 or 2 sentences, shown as the meters animate. Cause and effect inside the game.
- **Real Mars card:** a small badge ("Real Mars, tap to read"). Opens a card with a **real photo** (framed, with a "Real photo" tag), one real fact, its source, the camera and date for photos, and a "Saved photo" label. The solar observation separately shows Live/Cached/Saved status and its observation date. Encountered cards are saved to the Mission Album even when not opened.
- If the two together take longer than about 10 seconds to read, cut text.

### 10.5 Mood presets

| Mood id | Tint (overlay) | Particles / effects | Sound |
|---|---|---|---|
| calm_day | none | none | calm music |
| golden_dawn | warm gold, low opacity | slow sparkles | soft chimes |
| dusk_night | deep blue-purple | stars, lights on in windows | lullaby, light wind |
| dust_storm | rusty orange | horizontal dust, pale sun | low wind, slow drum |
| solar_storm | purple-pink glow | gentle pulsing border | clicking that speeds up, synth, soft alarm |
| alarm_amber | amber | flickering lights, sparks | ticking |
| alarm_red | red sweep | white hiss puffs | soft siren |
| meteors | none | streaks, light screen shake | whoosh |
| cold_night | blue-white | frost at corners, breath puffs | soft piano, low wind |
| finale_storm | red-orange | swirling dust, flicker | rumble, building theme |
| finale_dawn | gold sweep | pixel fireworks on success | warm victory theme |

**Safety rules:** no flashing faster than 3 times per second, no harsh or sudden loud sound, a Reduce Motion setting that removes shake, pulses and particles, and an easing back to calm within about 2 seconds after a reaction beat.

### 10.6 Accessibility
- Keyboard focus and `aria-label` on every spot, button and mini-game control.
- Never show meaning by color alone (icons and labels on meters and sky levels).
- Large rounded font, readable contrast, text size setting, alt text on every photo.
- Tablet and phone friendly (tap targets, no hover-only actions).
- Mini-games always have Skip and a non-drag way to finish.

---

## 11. Asset catalog

**Confirmed production scope: generate only what is needed.** Reuse existing sprites, frames and scene layers before creating alternatives. The three solar versions reuse the outpost and characters with authored text and CSS mood/effect changes; they do not need three new full-scene images. Extra panels use the existing cargo icon and conditional scene layer. Mini-games use the objects/backgrounds listed in 11.9. NASA photos are sourced real images, never generated. Teacher materials use HTML/print layout; no separate illustration set is required. AI debrief reuses Robo and card UI; its thinking portrait is listed in the catalog, while a neutral portrait can serve during integration. No separate report background is required. Do not generate assets for Free Play or a quiz.

**General specs**
- **Pixel art:** base scene 480 by 270 px (16:9), displayed at 4x (1920 by 1080) with `image-rendering: pixelated`. Sprites are drawn in base pixels and scaled by whole numbers. PNG with transparency.
- **Export resolution (approved November 13):** catalog dimensions remain logical layout sizes. `asset-preparation/export-manifest.json` records `logical_size` separately from physical PNG `size`: Kai/Mei/Thiri portraits export at 384x384, Commander and crew map frames at 96x128 (4x base), both Member 3 vehicle sprites at 128x96, and cargo icons at 128x128. The renderer must use physical sheet cells for slicing while preserving logical scene/display sizes; do not enlarge characters in the world just because their files contain more pixels. Small effects and other exports retain their existing sizes pending UI review. Original masters are preserved.
- **Asset preparation status (November 13):** scripted alpha cleanup is applied to fourteen Member 2 cutouts. Commander/crew frames share logical foot anchor `(12,30)`; the top-down rover has centered pivots; leak/patch coverage and the clear frost center are checked. These settings are reproducible from the export manifest, with source masters preserved. Plating fit, panel design mismatches and outdoor helmet edits remain separate; final scene positions and in-game readability still need integration review.
- **Photos:** WebP, 960 by 540 px, about 150 KB or less each.
- **Icons:** SVG (or 32 by 32 pixel PNG for the pixel set). **UI frames:** responsive HTML/CSS/SVG, not generated PNGs.
- **Audio:** MP3 (OGG as a fallback if wanted), 128 kbps for music, mono for most SFX, loops must be seamless, quiet masters, no sudden loud sounds.
- **No text inside images.** All text is HTML.
- **Budget:** total download under about 15 MB, audio lazy-loaded per scene.
- **Priority tags:** **P0** = needed for the base game, **P1** = needed for a P1 feature.
- **Every asset** gets a line in `asset-preparation/asset-log.md`: filename, tool or author, date, prompt (if AI), edits, license.

### 11.1 Starter palette (about 20 colors; use it everywhere)

| Role | Hex | Role | Hex |
|---|---|---|---|
| Mars rust | #B5482A | Deep rust | #7A2E1E |
| Sand | #E0A060 | Butterscotch | #F0B66B |
| Dusty pink | #D98A7A | Night purple | #2B1B4A |
| Deep blue | #14204A | Ice blue | #A9D3F5 |
| Panel blue | #2F5DA8 | Off white | #F2EDE4 |
| Metal grey | #8C8F99 | Dark | #1C1B22 |
| Teal accent | #2EC4B6 | Alert red | #E5484D |
| Amber | #F5A524 | Shield purple | #8B5CF6 |
| Life blue | #3BA7F5 | Power yellow | #FFC93C |
| Plant green | #4CAF50 | Glow gold | #FFE08A |

### 11.2 Scene backgrounds and layers

Ground has a transparent sky region; mountain is transparent around its silhouette. Sky rectangles are opaque. Measure and record layer registration/offsets against the approved scene.

| File | Canvas / sheet | Background, contents or priority |
|---|---|---|
| `bg/mars_ground.png` | 480x270 | Transparent sky region; opaque ground |
| `bg/mount_sharp.png` | 480x90 | Transparent around mountain |
| `bg/sky_day.png` | 480x110 | Opaque |
| `bg/sky_dusk.png` | 480x110 | Opaque |
| `bg/sky_night.png` | 480x110 | Opaque |
| `bg/sky_dust.png` | 480x110 | Opaque |
| `bg/sky_dawn.png` | 480x110 | Opaque |

### 11.3 Buildings and scene cargo layers

Permanent structures, state variants, conditional cargo upgrades and the fictional outpost rover are listed below. Transparent PNG throughout. Keep door/state anchors aligned.

| File | Canvas / sheet | Background, contents or priority |
|---|---|---|
| `buildings/habitat.png` | 160x90 | Transparent |
| `buildings/air_module.png` | 56x80 | Transparent |
| `buildings/greenhouse.png` | 120x90 | Transparent |
| `buildings/solar_panels_clean.png` | 110x80 | Transparent |
| `buildings/solar_panels_dusty.png` | 110x80 | Transparent |
| `buildings/solar_panels_covered.png` | 110x80 | Transparent |
| `buildings/solar_panels_damaged.png` | 110x80 | Transparent |
| `buildings/comms_dish.png` | 48x80 | Transparent |
| `buildings/rover_garage_closed.png` | 80x60 | Transparent |
| `buildings/rover_garage_open.png` | 80x60 | Transparent |
| `buildings/shelter_closed.png` | 56x40 | Transparent |
| `buildings/shelter_open.png` | 56x40 | Transparent |
| `buildings/supply_ship.png` | 32x32 | Transparent |
| `buildings/outpost_rover.png` | 32x24 | 1; Core |
| `buildings/extra_panels.png` | 80x50 | Transparent; 1 |
| `buildings/battery_box.png` | 24x24 | Transparent; 1 |
| `buildings/shield_plating.png` | 160x20, subject to habitat fit | Transparent; 1 |

### 11.4 Characters and portraits

All transparent. Robo is an original design approved before expressions/animation. Map frames differ from larger portraits; do not generate separate full scenes for reactions. The four crew/effect polish sheets are optional as marked.

| File | Canvas / sheet | Background, contents or priority |
|---|---|---|
| `characters/robo_neutral.png` | 128x128 | One neutral portrait |
| `characters/robo_explaining.png` | 128x128 | One explaining portrait |
| `characters/robo_concerned.png` | 128x128 | One gently concerned portrait |
| `characters/robo_cheering.png` | 128x128 | One encouraging celebration portrait |
| `characters/robo_thinking.png` | 128x128 | One thoughtful portrait |
| `characters/robo_idle.png` | 48x24 | Two 24x24 frames |
| `characters/robo_float.png` | 96x24 | Four 24x24 frames |
| `characters/commander_idle.png` | 48x32 sheet, 24x32 cells | 2; Core |
| `characters/commander_walk.png` | 96x32 sheet, 24x32 cells | 4; Core |
| `characters/commander_cheer.png` | 48x32 sheet, 24x32 cells | 2; Core |
| `characters/commander_concerned.png` | 24x32 | 1; Core |
| `characters/kai_neutral.png` | 128x128 | 1; Core |
| `characters/kai_concerned.png` | 128x128 | 1; Core |
| `characters/kai_happy.png` | 128x128 | 1; Core |
| `characters/mei_neutral.png` | 128x128 | 1; Core |
| `characters/mei_concerned.png` | 128x128 | 1; Core |
| `characters/mei_happy.png` | 128x128 | 1; Core |
| `characters/thiri_neutral.png` | 128x128 | 1; Core |
| `characters/thiri_concerned.png` | 128x128 | 1; Core |
| `characters/thiri_happy.png` | 128x128 | 1; Core |
| `characters/curiosity.png` | 32x24 | 1; Core |
| `characters/kai_work.png` | 72x32 sheet, 24x32 cells | 3; Optional polish |
| `characters/mei_work.png` | 72x32 sheet, 24x32 cells | 3; Optional polish |

### 11.5 Overlays and effects

Frost uses partial alpha and a clear center. Spark/hiss sheets are optional polish. Generate no other effect sheets initially: frontend handles dust particles, tints, solar glow, signal rings, meteors, window glow and modest celebration.

| File | Canvas / sheet | Background, contents or priority |
|---|---|---|
| `overlays/spark.png` | 32x8 sheet, 8x8 cells | 4; Optional polish |
| `overlays/hiss_puff.png` | 32x8 sheet, 8x8 cells | 4; Optional polish |
| `overlays/frost_corners.png` | 480x270 | Transparent + partial alpha; 1 |

### 11.6 UI pieces: frontend only

Build responsive dialogue boxes, speech tails, card/photo/portrait frames, meter bars, sol badge, buttons, target markers, caution/lock symbols and selection states in HTML/CSS/SVG. No generated 9-slice UI images are required. Reflow portrait/text/choices on phones; all text stays accessible and sharp.

### 11.7 Icons

Use a consistent openly licensed SVG icon set or original code/vector icons for life, power, shielding, navigation, settings, sound, warning, source, camera, teacher and cargo weight. These are not extra AI-image assignments. Preserve icon-set license/credits. Do not encode meaning by color alone.

### 11.8 Cargo icons

Eight transparent 48x48 icons, selected as upgrade packages, not item quantities. The developer supplies labels, budget, benefits and selection states. No crate illustration is required initially.

| File | Canvas / sheet | Background, contents or priority |
|---|---|---|
| `cargo/solar_extra.png` | 48x48 | Transparent; 1 |
| `cargo/batteries.png` | 48x48 | Transparent; 1 |
| `cargo/shield_plating.png` | 48x48 | Transparent; 1 |
| `cargo/greenhouse_kit.png` | 48x48 | Transparent; 1 |
| `cargo/water_recycler.png` | 48x48 | Transparent; 1 |
| `cargo/spare_parts.png` | 48x48 | Transparent; 1 |
| `cargo/rover_fuel.png` | 48x48 | Transparent; 1 |
| `cargo/radio_booster.png` | 48x48 | Transparent; 1 |

### 11.9 Mini-game assets

Use the objects/backings below. Code repeats panels/markers, draws wires/terminals and terrain/path controls, and applies feedback; do not generate a separate screenshot for each task state. Backings are opaque; other task sprites are transparent.

| File | Canvas / sheet | Background, contents or priority |
|---|---|---|
| `minigames/panel.png` | 64x48 | Transparent; 1 |
| `minigames/panel_cover.png` | 64x48 | Transparent; 1 |
| `minigames/rover_top.png` | 96x24 sheet | Transparent; 4 cells of 24x24 |
| `minigames/rock_small.png` | 16x16 | Transparent; 1 |
| `minigames/rock_medium.png` | 24x24 | Transparent; 1 |
| `minigames/rock_large.png` | 32x32 | Transparent; 1 |
| `minigames/ice_patch.png` | 32x32 | Transparent; 1 |
| `minigames/wire_board.png` | 320x180 | Opaque; 1 |
| `minigames/air_module_cutaway.png` | 320x180 | Opaque; 1 |
| `minigames/leak_marker.png` | 32x32 | Transparent; 1 |
| `minigames/patch_sticker.png` | 32x32 | Transparent; 1 |

### 11.10 Real photos (Section 12.5, P1)

About 10 to 12 files in `photos/`, WebP 960x540, each with an entry in `photos.json`: `id`, `file`, `subject`, `camera`, `sol`, `earthDate`, `credit`, `sourceUrl`, `altText`, `caption`, `source` ("saved" for bundled release images). Credit format example: "NASA/JPL-Caltech". The suggested subject list is in 12.5.

### 11.11 Audio

**Audio paths:** the following `music/`, `sfx/` and `ambient/` paths are relative to `public/assets/audio/`. Keep these filenames; they are not separate top-level public directories.

**Music (MP3, seamless loops, 60 to 120 s each, P0 unless noted)**

| File | Mood | Used in |
|---|---|---|
| `music/title.mp3` | hopeful, curious | Title, Plan phase (P1) |
| `music/calm_day.mp3` | calm, light | Sols with calm_day |
| `music/golden_dawn.mp3` | warm, wondering | Sol 1, finale dawn |
| `music/dusk_night.mp3` | lullaby, soft piano | Sols 2 and 5 |
| `music/dust_storm.mp3` | uneasy, slow drum | Sol 3, finale storm |
| `music/solar_storm.mp3` | pulsing synth | Sol 6 |
| `music/alarm.mp3` | tense, ticking | Sol 7, Sol 8 |
| `music/cold_night.mp3` | quiet piano | Sol 9 |
| `music/finale.mp3` | building, heroic | Sol 10 |
| `music/victory.mp3` | warm, joyful | Success ending |
| `music/gentle_end.mp3` | soft, kind | Gentle ending |
| `music/report.mp3` | calm, thoughtful | Debrief and report (P1) |

**Ambient (loops)**: `ambient/mars_wind.mp3`, `ambient/habitat_hum.mp3`, `ambient/dust_wind.mp3`, `ambient/radio_static.mp3`.

**Sound effects (short, mono)**

| Group | Files |
|---|---|
| Interface | `sfx/click.mp3`, `back.mp3`, `card_open.mp3`, `typewriter_tick.mp3`, `meter_up.mp3`, `meter_down.mp3`, `meter_low.mp3` (soft warning), `caution.mp3`, `skip.mp3` |
| Movement and arrival | `sfx/footsteps_loop.mp3`, `arrive_ping.mp3`, `rover_engine_loop.mp3` |
| Events | `sfx/geiger_loop.mp3` (speeds up), `alarm_soft_loop.mp3`, `siren_soft.mp3`, `hiss_loop.mp3`, `spark_zap.mp3`, `meteor_whoosh.mp3`, `impact_small.mp3`, `shelter_door.mp3`, `wrench_tink.mp3`, `plant_chime.mp3` |
| Communication | `sfx/radio_send.mp3`, `radio_receive.mp3`, `countdown_tick.mp3` |
| Characters | `sfx/robo_beep_a.mp3`, `robo_beep_b.mp3`, `robo_beep_c.mp3`, `curiosity_beep.mp3` |
| Results | `sfx/success_jingle.mp3`, `minigame_done.mp3`, `fireworks_pop.mp3`, `victory_fanfare.mp3`, `gentle_chime.mp3` |
| Plan phase (P1) | `sfx/cargo_add.mp3`, `cargo_remove.mp3`, `launch.mp3`, `budget_full.mp3` |

No voice acting is needed. Robo uses short beeps, and read-aloud (P2) uses the browser's speech synthesis.

### 11.12 Fonts (self-host so it works offline; check each license)
- Body: a rounded, readable sans (for example Nunito, SIL Open Font License).
- Headings and title: a pixel display font (for example Pixelify Sans or Silkscreen, Open Font License).
- Burmese (P2): Noto Sans Myanmar (Open Font License).

### 11.13 Teacher pack and marketing files
- `teacher/lesson_plan.pdf` (1 to 2 pages), `discussion_questions.pdf`, `vocabulary.pdf`, `mission_log.pdf` (printable worksheet), `certificate_template.pdf`. Plus the print stylesheets for the in-game Mission Album and certificate.
- `docs/screenshots/` (5 or more), hero banner 1200x630, team logo (SVG and PNG), favicon (32x32 and 192x192), social card, thumbnail for the video.
- 30-second video (or 7 slides): storyboard, script, captions file, final MP4 (1080p).

### 11.14 AI image workflow (organizers allow AI; disclose it)
1. Write a style guide first: palette (11.1), pixel size, outline rule, lighting direction. Reuse the same style words in every prompt.
2. Generate **layers**, not one big picture: an empty landscape, then each building on a plain background, then characters, then overlays.
3. Clean up: remove backgrounds, snap to the palette, downscale with nearest-neighbor to the base pixel size, trim and slice sprites, export PNG.
4. Draw small characters (Commander, Robo) by hand or heavily edit them, so animation frames stay consistent.
5. Never put text in generated images.
6. Log every asset in `asset-preparation/asset-log.md` (tool, date, prompt, edits, license). List AI use in the README.
7. Photos are never AI-generated. They are real NASA images with credit.
8. Style rules, character briefs, prompt templates and the cleanup script are in 11.15.

### 11.15 Art style bible and prompt templates

**Style rules (every asset)**
- **View:** 3/4 elevated world view, about 30 degrees, like the team mockup. Task art follows its intended use: Rover Drive is true top-down; repair task backings are front-facing.
- **Light:** from the top left. Shadows fall to the bottom right, short, one flat shadow color.
- **Outline and shading:** 1 px selective outline (a darker shade of the object color, not pure black). Three shading steps per material (light, base, dark). No gradients (except the sky layers), no anti-aliasing, no dithering noise.
- **Palette:** starter swatches in 11.1; agree any added shades (including skin/hair and Robo) once and record them. Preserve a cohesive semi-pixel finish.
- **Pixel size:** everything is drawn on the 480x270 grid and scaled by whole numbers. Never mix pixel sizes.
- **Mood:** friendly, bright, a little cartoon. Rounded shapes, nothing sharp or scary. Damage is shown as sparks and smoke only.
- **Readability:** strong silhouettes, high contrast against the ground, clear tap sizes.
- **No text, logos or brand marks** (no NASA logo) inside images.

**Character briefs**

| Character | Look | Colors | Notes |
|---|---|---|---|
| Commander | Child-sized astronaut, round helmet, dark visor, small backpack | White suit, orange stripes | No face shown, so any kid can be the Commander. 24x32 px |
| Robo | Original friendly mechanical helper; approve silhouette/face before five portraits and map sheets | Palette chosen with the team; purple accents are possible | Approve the original design; do not trace Pinterest art |
| Kai | Engineer, visor up, tool belt, wrench | White suit, blue stripes | Cheerful and practical |
| Mei | Gardener, seedling or watering can, green gloves | White suit, green stripes | Calm and caring |
| Dr. Thiri | Mission Control scientist in a headset, transparent upper-body portrait | Dark teal jacket | Friendly, portrait only |
| Curiosity | The real rover's shape: six wheels, tall mast with camera head, robotic arm | Metal grey, dark panels | Faithful to the real rover. Beeps only |

**Master prompt (paste first, then add the item line)**
> Friendly 2D semi-pixel art, task-appropriate view, Mars outpost game for children, limited palette of rust orange, butterscotch, dusty pink, panel blue and off-white, 1 pixel dark outline, 3-step flat shading, light from the top left, no anti-aliasing, no text, no logos, friendly and bright, clean silhouette, [ITEM LINE], plain flat background, single object centered.

**Item line examples**
- Environment: "empty Mars ground in Gale Crater, wide dirt paths linking six spots, rocks and small craters, no buildings, 16:9"
- Building: "greenhouse dome with glass panels and green plants inside, warm glow, front and top visible"
- Character sheet: "astronaut child, white suit with orange stripes, dark visor, walk cycle, 4 frames, facing right, same size in every frame"
- Overlay: "tileable semi-transparent orange dust texture, soft horizontal wind streaks"
- UI: do not generate; build responsive components in code.
- Mini-game: use the catalog's backing/object views; no painted interactive leak spots in the cutaway.
- Cargo icon: "crate icon holding [item], 48x48 pixel icon, strong outline"

**Optional cleanup example (`tools/pixelize.py`)**: a draft technique for opaque/binary-alpha assets only, not an existing implemented tool. The example is not appropriate for partial-alpha frost/hiss; preserve their alpha separately. Inspect results manually. `tools/palette.png` would be a small image with one swatch per agreed palette color.
```python
from PIL import Image
import sys
src, out, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
img = Image.open(src).convert("RGBA").resize((w, h), Image.Resampling.NEAREST)
pal = Image.open("tools/palette.png").convert("P", palette=Image.ADAPTIVE, colors=24)
q = img.convert("RGB").quantize(palette=pal, dither=0).convert("RGBA")
q.putalpha(img.getchannel("A").point(lambda a: 255 if a > 127 else 0))
q.save(out)
```
Set `colors=` to the number of swatches in `palette.png`. Remove plain backgrounds before running it, so transparency is kept. Draw the Commander and Robo by hand or heavily edit them, so animation frames stay consistent.

---

## 12. NASA data layer and photos

### 12.1 What we use
- **DONKI (Space Weather Database of Notifications, Knowledge, Information):** solar flares, coronal mass ejections and energetic particle events. Used for the Sol 6 storm, the mission solar level and its Real Mars card.
- **Gale Crater conditions from Curiosity:** real night temperature and radiation values for Sols 2, 6 and 9 cards. Get the values from the Nov 13 resources or NASA pages and embed a small curated set in `galeData.json`.
- **Curiosity and other NASA photos** for the Real Mars cards (12.5).
- **Optional:** OSDR astronaut research findings for one extra fact card.

### 12.2 DONKI access (as far as we know; verify on api.nasa.gov)
- Endpoints include `/DONKI/FLR` (flares), `/DONKI/CME`, `/DONKI/SEP` and `/DONKI/notifications`, with `startDate`, `endDate` and `api_key` parameters.
- Get a free API key at api.nasa.gov. `DEMO_KEY` has strict rate limits.

### 12.3 Rules
1. **Never invent data.** Every number, event or photo in a Real Mars card must come from NASA.
2. **Source labels:** observations show Live/Cached/Saved status; bundled images show Saved photo. P0 ships `donkiArchive.json` (10 to 15 real past events with date, type or class and source link). The Real-Sky integration adds live observations through `/api/sky`; it does not make the bundled photos live.
3. **Server side only:** the NASA key stays in the serverless function. The function caches responses (about an hour) and returns JSON. On any error the browser uses its cached copy or the archive.
4. **Attribution:** show the source name and link on each card and on the Sources page. List all datasets and photos in the README with why each was used.
5. **Game vs real:** where the game simplifies reality (for example, ice closer than in real life, or a game-sized solar storm), say so on the card.
6. **Fact check:** every item marked `[CHECK]` in the Story Script must be confirmed on a NASA page and credited.

### 12.4 Mapping a real solar event to gameplay
Convert the real event to a sky level (7.8). Only the solar encounter uses the matching authored variant and bounded effects, and the card text says: "This was based on a real solar event NASA saw on [date and class]."

### 12.5 Real photos for the Real Mars cards
Where possible use Curiosity photos from Gale (Mastcam, Navcam, MAHLI, Mars Hand Lens Imager, and the like). The subjects below are **search briefs**, not confirmed files. Find a matching real photo on NASA's image sites, check the usage guidelines, and record the camera, sol, Earth date and credit. For the confirmed public release, ship curated saved images with the site; live photo fetching is outside scope. Other NASA mission images or clearly labeled diagrams can be used when they explain the topic better than a Curiosity photo.

| Sol | Photo-reference alias (not a replacement real-moment ID) | Suggested subject | Notes |
|---|---|---|---|
| 1 | `rm_gale` | A wide Curiosity view of Mount Sharp | Matches the Gale facts |
| 2 | `rm_moons_night` | A Curiosity sunset or twilight sky image | Pairs with night temperature data |
| 3 | `rm_dust` | A hazy dusty sky or a dust devil image from Gale | Pairs with the 2018 dust storm fact |
| 4 | `rm_soil_water` | A Curiosity drill hole or soil scoop image | Water locked in soil |
| 5 | `rm_signal_delay` | Earth seen as a bright star in the Martian sky, or Curiosity's antenna | Signal delay fact |
| 6 | `rm_solar_event` | A solar image from NASA's solar observatories, or a Curiosity self-portrait | Pairs with the DONKI event |
| 7 | `rm_wheels` | Curiosity's worn wheels | Maintenance fact |
| 8a | `rm_leak` | A space station photo (not Mars) | Space station leaks |
| 8b | `rm_craters` | A fresh impact crater photographed by a Mars orbiter | Meteor fact |
| 9 | `rm_cold` | A frosty or wintry Mars image, or Curiosity at dusk | Heat for cold nights |
| 10 | `rm_artemis` | An Artemis or lunar outpost concept image | NASA's long-term plans |

The aliases in this search-brief table are photo references, not authoritative replacements for existing `realMomentId` values. For example, preserve `rm_dust_2018` in the event example; link its real-moment entry explicitly to the chosen photo entry. Do not rename IDs based on this table.

Each photo needs alt text, a one-line caption and its exact published credit. All photos in the confirmed release show "Saved photo". Keep camera/capture dates separate from NASA observation and fetch dates. Do not force an image into a 16:9 crop if that removes important evidence; use a fitted frame when needed.

### 12.6 Confirmed public-release photo implementation and backup plan

**Build before release:** select images from official NASA sources, verify the related facts, review each image's credit/restrictions, download permitted copies, optimize for the web, and bundle them under `public/assets/photos/`. Target roughly 10-12 relevant images initially; the 13 scene versions do not require 13 unique photographs.

- `photos.json`: image ID, local file, subject, image type (photo/diagram/illustration), available camera/mission/sol/capture date, exact credit, source URL, alt text, caption and saved-source label. Leave unavailable fields absent rather than inventing metadata.
- `realMoments.json`: concise sourced facts linked to event/variant IDs and photo IDs. All three solar versions may share an accurate image; their observation details come from the frozen sky snapshot, not the photo metadata.
- Photo-card component: load text immediately, reserve image space, lazy-load images without blocking Continue, provide alt text, and handle failures without a broken-image icon or repeated fallback loop.
- Sources page: list image and fact references. Retain attribution in the card; use expandable details for metadata so children can focus on the discovery.
- Mission Album: collect encountered card IDs for review after the mission. Browser storage persists them when available; an in-memory store keeps the current session usable otherwise.
- No photo API, photo API key or database is required. The host serves these files alongside the game; NASA/Gemini server functions remain separate.
- Review [NASA media usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) and each source's specific credit/restrictions. Do not assume all third-party content on NASA pages has the same permissions or imply NASA endorses this game. Record source, edits and usage notes in the asset log. An official starting point is [Curiosity raw images](https://mars.nasa.gov/msl/multimedia/raw-images/?mission=msl).

| Failure | Backup and player experience |
|---|---|
| NASA image site or API unavailable | Bundled images are served by our host; gameplay does not request the NASA image service |
| Local image missing or fails to load | Show a designed placeholder and a friendly photo-unavailable line; retain the fact, credit, source and Continue |
| Slow image download | Show the fact and controls immediately; keep the reserved image area stable |
| Original NASA source URL stops working | Saved image and attribution still work; check source links before release and repair later |
| Browser storage unavailable/corrupt | Use a session-only in-memory album; game and cards remain usable |
| NASA Real-Sky request fails | Its cached/archive fallback operates independently; photo cards still work |
| Connection lost | Only already downloaded/cached files are available unless explicit offline caching is implemented |

**Offline requirement:** bundling files alone is not an offline guarantee. To meet the existing offline-play target, implement and test explicit versioned caching of the game shell, content, placeholders and required photos (for example through a service worker). The first visit still requires a connection. Check a previously loaded mission in airplane mode, with missing-image and disabled-storage cases, before claiming offline support.

**Release checks:** confirm cards match every event/solar variant, readable text on phones and tablets, keyboard-accessible open/close/Continue controls, visible Saved labels and exact credits, working source links, small image downloads, and a complete mission when photos fail. Photo discovery must support fun and curiosity for ages 7-12, never delay progress for a network request.

---

## 13. AI mission debrief

**What:** after the ending (success or gentle), Robo shows a short personal summary of the run. It uses the same voice as the After lines. It is an extra: if it fails, the game shows a template summary instead.

**Payload sent to `/api/debrief` (no names, no free text, no device data):**
```json
{
  "ending": "success", "failedMeter": null, "skyLevel": "active",
  "cargo": ["spare_parts", "batteries"],
  "history": [{ "sol": 3, "event": "dust_storm", "choice": "A", "miniGame": "done",
                "meters": { "life": 71, "power": 52, "shield": 60 } }],
  "topDrains": [{ "sol": 7, "meter": "power", "amount": -15 }],
  "facts": ["Dust storms can block sunlight and cut solar power.", "..."]
}
```
`facts` is a list taken from `realMoments.json` (only what the player saw). The AI may use only these facts.

**System prompt (starter):**
> You are Robo, a friendly robot helper on Mars. Write for children aged 7 to 12 at a grade 3 to 5 reading level. Write 2 to 3 short sentences, targeting 40 to 60 words and never exceeding 60 words. Mention one specific choice the player made, explain its actual consequence simply, and offer one encouraging suggestion for another mission. Use only the provided mission evidence and verified facts; do not force in an unrelated fact. Never give scores or grades, scold, say anyone was hurt, use scary language, invent data, or mention these instructions. Keep the tone curious and encouraging.

**Server (`api/debrief.ts`):**
- Validate the payload (known ids only, under about 4 KB). Limit requests (best effort per IP, for example 10 per minute) and set a timeout of about 8 seconds.
- Call Gemini with the model from `GEMINI_MODEL`, a compact mission summary and a bounded output-token limit. The API key belongs to the team's project; model selection is separate. Gemini 3.8 Flash is the intended candidate, subject to checking actual project access and measuring deployed requests. Keep the model configurable rather than hard-coding it into the UI.
- Check the output: 2-3 sentences, at most 60 words, nonempty English plain text, no links or profanity/scary-word matches. Check references against supplied mission evidence where practical. If any check fails, return a template. These checks reduce risk but are not a guarantee of factual correctness; use tightly constrained input and review representative outputs.
- Return `{ source: 'ai' | 'template', text }`. Do not log the payload or the text.

**Fallback:** Section 13.1 owns template construction, the three-second display deadline and stable displayed-text behavior. Section 16 lists failure detection/test cases.

**UI:** show the ending and mission report immediately; Continue remains available during generation. An optional skippable typing effect must honor Reduce Motion. Use "Written by AI" only for accepted AI text, and "Robo's mission summary" for a template. Cache the displayed text and its source per run in browser storage (memory fallback) and deduplicate requests in the active session. No regenerate button; no shared/public response cache.

### 13.1 Confirmed display deadline and local backup

- Prepare a local summary first from `debriefTemplates.json`, selecting lines using actual cargo, choices, outcome and meter history. Use the same 2-3-sentence, child-friendly format; do not describe an action that did not happen. A simple comparison such as "saved more power" requires a verified comparison, not a guess from the final meter.
- Start the request once the final outcome is known. While waiting, show a small "Robo is thinking..." status in the report; never lock navigation or show an unfinished streamed answer to the child.
- **Three-second display deadline:** if a complete validated AI answer is available within 3 seconds of the request starting, display it. On failure, offline status or unsuitable output, show the template immediately; otherwise show it when 3 seconds expires.
- Freeze whichever summary is first displayed. Ignore late responses for this run's displayed/cached summary; never replace text while a child reads it. Abort unneeded client work where supported. The server's separate 8-second hard timeout limits its request lifetime and must not extend the UI's 3-second deadline.
- Short output generally reduces generation work, but 3 seconds is our UI policy, not a promised Gemini response time. Measure multiple requests through the deployed server, including slow/error cases, before tuning the deadline. No measured latency is claimed yet.
- Example template structure: a real choice observation -> its verified consequence -> a friendly next-time suggestion. Praise exploration and reasoning, not a numerical grade. Both success and gentle endings receive a useful summary.
- Required writing: short templates for each cargo/choice pattern we reference, all three solar variants, success and failed-meter outcomes, plus safe generic lines when evidence is insufficient. Compose from these; do not write a separate full summary for every possible combination.

### 13.2 Debrief asset needs

No new generated image, animation sheet or scene is required for the debrief. Reuse the approved `characters/robo_*.png` expression portraits and frontend card styling and the mission report layout. The thinking expression can reuse the neutral portrait; a text status is sufficient. Keep the real AI text and source labels as HTML, never text baked into an image. This feature mainly needs authored templates, UI code and the server function.

---

## 14. Teacher pack and Classroom mode

**Printables (in `public/teacher/` and linked from the Teachers screen):**
1. **Lesson plan (1 to 2 pages):** three learning goals (power is shared, radiation needs shielding, messages take time to cross space), a 20 to 30 minute plan, setup steps, vocabulary, extension ideas.
2. **Discussion questions:** two per sol (for example "Why did covering the panels cost power today but save more tomorrow?").
3. **Vocabulary list:** sol, radiation, shield, solar panel, signal delay, dust storm, launch weight, cargo, in kid-friendly words.
4. **Mission log worksheet:** prediction -> choice -> result, with sol, meters before/after and "Why?" fields. Preserve the confirmed prediction/reflection element.
5. **Mission Album:** the in-game Real Mars cards seen, printable with print CSS.
6. **Junior Commander certificate:** the supplied artwork is printable from Learn without a completion gate or preview watermark; the commander's name is typed on the page and is not saved anywhere.

**Classroom mode** (Settings toggle, saved in `localStorage`):
- Bigger text and a projector-friendly layout.
- A "Pause for discussion" screen after each sol that shows that sol's question and a Continue button.
- Optional teacher notes overlay with the key idea and suggested answers for each sol.
- Sound defaults to off, and Reduce Motion defaults to on.

Format: print-ready HTML pages (print CSS) and pre-made PDFs. Check readability and alt text.

---

## 15. Storage and settings

### 15.1 Confirmed autosave and Continue

- No database/accounts are required. Save on the same browser/device with `localStorage`, wrapped in try/catch and validated on load. Clearing site data or closing private browsing may erase progress; cross-device resume is outside scope.
- Use a versioned save envelope containing save-schema version, content version, run ID, current durable game state, fixed sol sequence, selected event variants, frozen NASA snapshot, cargo, meters, flags, pending effects, history, current event/choice and phase/checkpoint. Never store secret API keys.
- Save after durable transitions: confirmed launch/cargo, sol-start effects, committed choice result, night upkeep, and ending. Track which effects have been applied. Reloading must not apply solar generation, choice costs, bonuses, delayed effects or upkeep twice.
- Continue restores the latest valid checkpoint without querying new NASA conditions or changing the fixed order. A save made during transient walking can restore to WALK_SELECT; a mini-game can restart that same uncommitted task with no new cost/bonus. Persist the selected choice and its pre-result state for that restart. Already committed results resume after the commit.
- Provide the stable in-game Continue action for dialogue/cards independently of title-screen Continue. Discussion pauses likewise advance only when the teacher presses Continue.
- Validate IDs, ranges and schema/content compatibility before showing Continue. An invalid/incompatible save gets a friendly restart message, never an app crash or silent reinterpretation under new rules. Do not promise restoring old content versions without a migration.
- If persistent storage is unavailable, maintain the current run in memory and give a short Settings/save-status explanation that it will not be remembered after closing. Do not show a misleading saved-progress promise. Active-session duplicate-request/bonus guards must still work.
- Completed runs open their report in the current session and may remain in last-run history; they do not show as unfinished Continue saves. Start New needs no separate confirmation card; its Plan notice explains that launch replaces unfinished progress, and Back keeps it.
- Verification: close/reopen after launch, walking, mini-game, result and night; verify identical conditions/state and no duplicate effects. Test blocked storage, corrupt save, incompatible version and Back from a new plan preserving the old save, and replacement only on launch.

### 15.2 Storage keys

`localStorage` keys (wrap in try/catch and handle storage being unavailable):
- `mms.settings`: sound, reduceMotion, textSize, classroomMode
- `mms.lastRun`: fixed schedule, contentVersion, frozen sky snapshot, current state, history, ending
- `mms.activeRun`: versioned unfinished run/checkpoint used by Continue (15.1)
- `mms.album`: ids of Real Mars cards seen
- `mms.cargo.last`: the last cargo plan
- `mms.sky.<date>`: cached NASA response with observation date, fetch time and source
- `mms.debrief.<hash>`: cached debrief text
- `mms.firstPlay`: whether the tutorial hint was shown

No accounts, no tracking, no personal data. Server functions store nothing.

---

## 16. Fallbacks and error handling

**Principle:** no outside service is needed to finish a mission. Every external dependency has a fallback, the player never sees a technical error, and every label tells the truth ("Saved" or "Live", "Robo's mission summary" or "Written by AI").

### 16.1 Fallback table

| Part | What can go wrong | How we detect it | Fallback | What the player sees | How to test |
|---|---|---|---|---|---|
| `/api/sky` (live NASA DONKI) | NASA down, rate limit (429), key missing, timeout over 4 s, bad or empty JSON | HTTP status, timeout, schema check in `sky.ts` | 1) cached copy in `localStorage` under 48 hours old, 2) saved `donkiArchive.json` event chosen by the date hash (same date gives the same event) | The single mission still starts. The Sky badge and Real Mars card say "Saved NASA data" | `?fail=sky` (development only) |
| NASA data shape changes | Fields renamed or missing | Schema validation (for example with zod) in the function and again in `sky.ts` | Same as above | Same | Unit test with a malformed sample |
| Run reproducibility | New NASA responses or time zones change an existing run | Save fixed sequence, content version, current branch/state and frozen NASA snapshot | Restore the saved run | Conditions remain stable during the mission | Retry/restore determinism test |
| `/api/debrief` (Gemini) | Timeout over 8 s, error, quota, rate limit, safety block, empty answer, output fails the filter (too long, link, blocked word, not English) | Status code and the output filter in the function | The **template debrief** from `debriefTemplates.json`. Build it locally first and show it immediately if a validated AI answer is not ready within 3 s; ignore late AI text once the template is displayed | A summary always appears. The "Written by AI" label shows only when the AI text passed the filter. Otherwise the label is "Robo's mission summary" | `?fail=ai` and filter unit tests |
| Gemini key or model name wrong | Configuration error | Function returns 500 | Same template | Same | Deploy check with a bad key |
| Real photos | File missing or fails to load | `onError` on the image | Pixel-art placeholder frame with the caption, fact and credit | The card stays readable, with no broken-image icon | `?fail=photos` |
| Photo license doubt | Not sure a photo may be used | Review in `asset-log.md` | Swap it for another NASA image or an illustration | n/a | Checklist |
| Audio | Autoplay blocked, file fails, device muted | Rejected `play()` promise, load errors | Start muted and show "Tap to turn on sound" once. Skip missing files silently | The game works silently | Test with autoplay blocked |
| `localStorage` | Disabled (private mode), full, or corrupt | try/catch around every access | In-memory store for the session, default settings | The game plays. Progress and album are not remembered across sessions. No error shown | Disable storage in a test |
| Mini-games | Component error, input trouble, player does not want it | An error boundary around each mini-game. The Skip button is always visible | Treat it as `skipped` and continue to the After card | Robo says "No problem. Let's keep going!" | Throw an error in a test |
| Whole app crash | Unhandled exception | Root error boundary | Restore the last state snapshot and show a friendly screen | "Robo lost the signal for a moment! Tap to try again." Never a blank page | Throw an error in a test |
| Content errors | Missing text key, bad event data | `npm run validate` in the build | The build fails. At runtime a missing key shows a safe default line and is logged in development only | n/a | Validator test |
| Slow network | Cold start, slow functions | Timeouts: sky 4 s, debrief 8 s | Use saved sky input before the mission starts; freeze it for the run. For debrief follow the 3-second deadline and never replace displayed text | No blocking spinner; sky fallback target about 2 s, debrief deadline 3 s | Network throttling |
| Offline | No network at all | Fetch errors, `navigator.onLine` | After explicit offline caching is implemented and the first load completes, the game uses cached files plus saved sky/template debrief | "Saved" labels | Airplane mode |

### 16.2 Rules for every fallback
- **Never block the game.** Show usable content immediately; sky uses a saved fallback promptly (target about 2 seconds), and AI debrief uses the separate 3-second display deadline in 13.1. Navigation is never locked while either request runs.
- **Never fake it.** A fallback says what it is ("Saved NASA data", "Robo's mission summary").
- **Never show raw errors** (no stack traces, HTTP codes or technical words) to kids. One friendly line in Robo's voice.
- **Logging:** console only in development. In production, log counts only, never payloads or generated text.
- **Failures must be testable:** development-only switches `?fail=sky`, `?fail=ai`, `?fail=photos` and `?offline=1` force each failure, and are disabled in production builds.
- **Order of trust:** for data, live then cached then saved. For text, AI then template.

### 16.3 Kid-safe fallback messages (keys in `story.json`)
- Sky failure: no message (silent fallback with a "Saved" label).
- Debrief pending: "Robo is thinking..." in the report, with Continue available. At 3 seconds show the template unless validated AI text has already been displayed; keep displayed text stable.
- Photo missing: "Photo not available. Here is the fact instead!"
- Crash: "Robo lost the signal for a moment! Tap to try again."
- Mini-game error or skip: "No problem. Let's keep going!"

### 16.4 When the player's mission fails (not a technical failure)

Section 7.6 is authoritative for warning thresholds, checks, gentle ending, optional Emergency Reserve, "What happened?" and retry behavior. "Try again" starts a new mission; "Try this sol again" retains the original mission input. Section 15 owns durable Continue behavior. Mini-games have only `done` or `skipped` outcomes. All three solar versions must have viable paths and are tested under Section 17.

---

## 17. Testing

1. **Unit tests (Vitest):**
   - Meters clamp 0 to 100; flags; pending effects apply on the right sol.
   - Win and gentle ending checks, warnings at 30 and 15, caution before a risky choice.
   - Sol 7 surcharge, Sol 8 branch, cargo adjustments, mini-game bonus (done and skipped).
   - Loadout modifiers and the budget limit.
   - Assert the exact fixed ten-sol sequence, all three Sol 6 variants and the Sol 8 `quickPatch` branch. Verify no gameplay scheduling randomness and unchanged NASA input on Continue/sol retry.
   - Sky level mapping, all three authored solar versions, Plan advice and bounded meter effects.
   - "Try this sol again" restores the right state.
2. **Simulation script (`scripts/simulate.ts`):**
   - 1,000 random-choice playthroughs and 1,000 sensible playthroughs per solar variant, always in the fixed order. A simulator-only seed may reproduce choice sampling; it must not enter gameplay state or reorder events. Starter target: random play succeeds about 30 to 50 percent, sensible play about 85 percent or more.
   - Every legal cargo loadout: the best loadout may win at most about 15 percentage points more than the average loadout.
   - Mission with each sky level: no level may be unwinnable.
3. **Fallback tests (full table in Section 16):** `/api/sky` fails, `/api/debrief` fails, offline, missing keys, a malformed AI answer, a photo that fails to load. The game must still play.
4. **AI safety tests:** outputs with links, long text, or blocked words must be replaced by the template.
5. **Manual checklist:**
   - Full playthrough on desktop, a tablet and a phone, with all three solar variants and saved-data fallback
   - Every event, every choice, both Sol 8 versions, both endings, all four mini-games (done and skipped), and Rover Drive with obstacle blocking enabled/disabled
   - Wrong-spot tap shows the hint; skip walk works
   - Reduce Motion works; Classroom mode and print pages work
   - Offline (airplane mode) still loads and plays with saved data and template debrief
   - No text overflows on small screens
6. **Judge path (1 minute):** Start, Plan phase (Balanced pack), Sol 1, one walk event, one After card, one Real Mars card with photo. This must work without reading instructions.

---

## 18. Deployment and submission

- Deploy on Vercel (or Netlify) with the two functions. Set `NASA_API_KEY`, `GEMINI_API_KEY` and `GEMINI_MODEL` as environment variables. The public link must open without login.
- Set cache headers on `/api/sky` (about one hour, with stale-while-revalidate). Do not cache `/api/debrief`.
- Public GitHub repository with README: how to play in one minute, what kids learn, datasets and photos used and why, credits, **AI-use disclosure** (assets, debrief, and any code help), and a short judges' note. Do not commit keys.
- The Space Apps submission needs: project description, link to the game, repository link, data sources, and a short video (about 30 seconds) or slides (up to 7). Confirm the latest limits.
- English text for the global submission.
- Submit before the Nov 15, 6:00 PM deadline, with a buffer. Local support helps only until 6:00 PM.

---

## 19. Build plan for Codex

Run one phase at a time. After each phase run `npm run lint`, `npm test`, `npm run validate` and `npm run build`, and play it before moving on. Give Codex this file plus `docs/story-script.md`. Start coding only when Section "READ FIRST" allows it.

### Before the event (allowed: assets and planning; code only if the organizers confirm)

1. **Freeze the style:** palette (11.1), style bible and master prompt (11.15), character briefs.
2. **Make a style test sheet:** one building, one character and one overlay; preview them with frontend UI styling rather than generating a UI-frame image. Place them in a mockup scene and check they look like one game before making the rest.
3. **Produce assets by priority tag:** all required scene layers, buildings and core characters first, then cargo and mini-game assets from Section 11. Implement UI/icons/photo frames in frontend code; optional polish remains optional.
4. **Photos:** collect real NASA photos from the search briefs in 12.5. Record camera, sol, Earth date, credit, source link and usage notes in a draft `photos.json` and in `asset-log.md`.
5. **Audio:** choose or generate music, ambience and sound effects (11.11), match their loudness, and record each license or prompt.
6. **Fonts:** download open-license fonts and keep their license files.
7. **Text:** finish `docs/story-script.md` (all sols, plus Plan phase lines, NASA observation briefing, mini-game lines, cargo callbacks, debrief templates, glossary and discussion questions) and `docs/facts.md` (every fact with its source). Do the fact checks.
8. **Teacher pack:** write and design the printables (11.13, Section 14).
9. **Accounts and keys:** get the NASA API key (api.nasa.gov), the Gemini key and a hosting account (for example Vercel). Never put keys in any repository.
10. **Paper design:** measure the spot rectangles on the final scene art, write the cargo and balance numbers, and plan the mini-game layouts.
11. **Storage:** keep everything in a local folder or your own private repository. **Do not push to the official repository before Nov 14.**

On Nov 14, after the event starts: open the official repository, make the first commit (assets and docs), then start Phase 0.

### Rules for Codex (paste at the start)
- Game logic stays in `src/engine` as pure TypeScript with no React imports.
- Follow the content and gameplay-balance ownership rules in Section 6. Do not hard-code player-facing copy in components.
- Every extra feature sits behind `src/features.ts` and has a working fallback. All flags off means the base game works.
- Minimal dependencies. No accounts, no analytics, no storing player data on a server.
- API keys only in serverless functions and environment variables.
- Follow the safety rules in 10.5 (no fast flashing) and write for ages 7 to 12.
- Small commits.

### Base game (P0)
- **Phase 0: scaffold.** Vite + React + TypeScript, Tailwind, ESLint, Prettier, Vitest, the folder structure in Section 6, `features.ts`, placeholder files. Done when dev, test and build work.
- **Phase 1: engine.** Sections 7.1 to 7.6 and 8: types, balance, reducer, fixed schedule (7.5), failure handling and snapshots; simulator-only randomness if needed. Vitest tests for every rule. Done when a headless run completes all 10 sols with scripted choices and both endings are reachable.
- **Phase 2: scene and flow.** Title menu, versioned validated autosaves/Continue and responsive frontend UI. Scene screen with placeholder boxes: HUD, six spots from `spots.json`, walking Commander, narration card, choices, After card, Real Mars card (text only), warnings, "What happened?" screen. Done when a full 10-sol game is playable with placeholders.
- **Phase 3: content.** Convert `docs/story-script.md` into `story.json`, `glossary.json`, `realMoments.json` using the keys in `events.json`. Do not change the wording. Run the validator.
- **Phase 4: data layer.** `donkiArchive.json`, `galeData.json` (the team provides real values), the Sources screen, "Saved" and "Live" labels.
- **Phase 5: art, mood and sound.** Use the Section 11 manifest; build UI frames in frontend code. Swap placeholders for real assets, implement the mood presets as overlay layers, add sound and the Reduce Motion setting.

### Standout features (P1, each behind a flag)
- **Phase 6: Real photos.** `photos.json`, `PhotoFrame`, photo in each Real Mars card with credit, alt text and the Saved photo label, and a Sources page entry for each photo.
- **Phase 7: Plan phase.** `cargo.json`, `loadout.ts`, the cargo bay screen, `ifCargo` effects in events, cargo callbacks in dialogue, and the loadout balance check in the simulator.
- **Phase 8: Mini-games.** The four components in 7.9 with Skip, tap and keyboard routes where specified, and Rover Drive's obstacle-blocking fallback setting, the bonus applied in RESULT, and `history` storing `done` or `skipped`.
- **Phase 9: NASA Real-Sky integration.** `api/sky.ts`, `sky.ts` and `mission.ts`; frozen mission input, Plan guidance, three solar versions, source badge, fixed-order/variant tests, cached/saved fallbacks and retry determinism. No mode-selection screen.
- **Phase 10: AI debrief.** `api/debrief.ts` with the payload checks, the prompt in Section 13, the output filter and the template fallback, the Debrief screen with the "Written by AI" label, and the AI safety tests.
- **Phase 11: Teacher pack.** The Teachers screen, Classroom mode, discussion questions in the "Pause for discussion" screen, and the print pages and PDFs.
- **Phase 12: Report and album.** Mission Report with meter graph, Mission Album, Commander style, and the optional Emergency Reserve.

### Finish
- **Phase 13: test, tune, deploy.** Run the simulator and the fallback tests (Section 16), tune the numbers, run the manual checklist, set environment variables, deploy, and test the public link on a phone.
- **Phase 14: submission.** README (with the AI disclosure and Data section), judges' note, screenshots, the 30-second video or 7 slides, and the data note. Submit early.

---

## 20. Team roles (four people)

| Role | Owns |
|---|---|
| Coding lead | Phases 0 to 2, 7, 13 (engine, scene flow, cargo, final tuning) |
| Coding and data | Phases 4, 6, 9, 10 (data layer, photos, sky and debrief functions) |
| Design and graphics | Section 11 assets, spot coordinates, mood overlays, mini-game art, UI polish, video visuals |
| Data and storytelling | Story Script text, glossary, photos and fact checks, teacher pack, debrief templates, README data note, video script |

Everyone: play-test with one kid or a younger sibling if possible, and write down what confuses them.

---

## 21. Risks and fixes

| Risk | Fix |
|---|---|
| Pre-event work breaks the event rules | Follow the READ FIRST section. Assets are allowed if nothing is pushed to the official repository before Nov 14. Get code permission in writing |
| Prepared assets pushed too early | Keep them local or in a private repository, with a dated asset log, until Nov 14 |
| NASA or the AI service fails during judging | Fallbacks in Section 16, tested offline |
| Too many features | Feature flags, P0 first, cut from the bottom of P1 |
| NASA API fails or is rate limited | Cached copy, then saved archive, always labeled |
| AI writes something wrong or unsuitable | Only provided facts, strict prompt, output filter, template fallback, disclosure |
| AI cost or abuse | Rate limit, payload limits, per-run cache, no free-text input |
| Photo license or mismatch | Real NASA photos only, credit and source on every card, check usage guidelines |
| Generated art is inconsistent | One style guide and palette, layer-based generation, hand-draw characters, asset log |
| Stormy solar version unfair | Bounded authored solar effects, simulator check per sky level |
| Cargo has a dominant best pick | Downside per item, simulator check across all loadouts |
| Mini-games distract or exclude | Skip always available, small bonus, no timers, tap alternatives |
| Judges have little time | One-minute judge path, clear README, short video |
| Wrong fact | Fact-check every [CHECK] item and credit sources |

---

## 22. Compliance checklist

- [ ] Organizers confirmed assets (done, as relayed) and code (still to confirm in writing) before Nov 14
- [ ] Assets kept local or private, nothing pushed to the official repository before Nov 14, asset log complete, first official commit made on Nov 14 after the event starts
- [ ] AI permission confirmed in writing, including images, audio, text and code, with disclosure rules
- [ ] No game code written early unless confirmed
- [ ] All assets are original, AI-generated and disclosed, openly licensed, or properly credited (asset log complete)
- [ ] NASA logo not used unless brand guidelines allow it
- [ ] NASA images and data credited and checked against media usage guidelines
- [ ] NASA observations show Live/Cached/Saved status; bundled photos say "Saved photo" correctly
- [ ] AI-written text is labeled in the game and in the README
- [ ] No personal data collected from kids; no free text sent to the AI; no keys in the repository
- [ ] Teacher pack and game text checked for reading level and accuracy
- [ ] Submission text is in English
- [ ] Submitted before the deadline with a buffer

---

## Appendix: reading level and tone check
- Bubble length: one or two short sentences.
- Explain each new term once, in context.
- No scolding, no "wrong" labels, no scores.
- The crew is always safe in the gentle ending.
- Real facts only, each with a source. Mark the game's simplifications.
