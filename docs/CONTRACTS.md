# Shared implementation contracts — Gate A, version 1

Owner: Member 1. This is the handoff for Member 2 (backend/adapters), Member 4 (UI) and Member 3 (content). Read the confirmed README before coding. Types describe interfaces; they are not a claim that runtime validation, saving or gameplay is finished.

The lead has explicitly chosen to work on `main` in this checkout. Preserve file ownership and separate working folders. Independent folders do not eliminate shared-remote conflicts: coordinate before pushes, pull/integrate incoming changes without overwriting local work, and never force-push shared main. No other agent should edit this same working directory.

## Files to consume read-only

| File                        | Contract                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/engine/types.ts`       | Existing event/choice/cargo/meter/spot/flag IDs, state, effects, authored event/choice/cargo shapes, committed result. |
| `src/engine/scene-types.ts` | Timeline steps, keyed text/After branches, speaker/expression pairs, presentation callbacks and mini-game props.       |
| `src/engine/contracts.ts`   | NASA/AI wire formats and durable save/session retry types.                                                             |
| `src/engine/schedule.ts`    | Fixed slots; call `eventForSol(sol, flags)` to resolve the repair-dependent Sol 8.                                     |
| `src/engine/balance.ts`     | Existing starter constants; no new tuning or numbers.                                                                  |

Request a shared-contract change from Member 1 instead of inventing a second type locally. Normalized API/body input still needs runtime validation by Member 2; TypeScript types alone do not validate a network response.

## Member 4 — presentation and mini-games

- Build within assigned UI/style paths, not `App.tsx`, configuration or the engine. Use a preview harness agreed with Member 1.
- `SceneStep` contains keys and cues, not literal dialogue. Resolve text from `story.json`; confirmed writing originates in `docs/story-script.md`. Don't author a competing story in components.
- Robo expressions: neutral/explaining/concerned/cheering/thinking. Crew: neutral/concerned/happy. The speaker/expression union rejects mixing these sets.
- Each timeline step has an ID. Return its ID in `SceneInput` so the scene player can reject stale/duplicate callbacks. Only the engine applies gameplay effects.
- Dialogue waits for an advance input; walking/effect presentation reports completion when appropriate. Respect Skip and Reduce Motion. Scene player implementation follows after this contract handoff.
- `MiniGameProps` has `id`, `instructionKey`, `reduceMotion`, `onResult('done' | 'skipped')`. Only Rover Drive accepts `obstacleBlocking`; its component defaults it to true. Component reports one result; engine also guards repeat callbacks.
- Bonuses are event-owned: Rover Drive gives **+2 Life**; the other three give **+2 Power**. Never award any bonus inside a UI component. Earlier blanket "+2 Power" workflow prose is corrected to match the authoritative README.
- Scene/world display uses logical asset size; sheet slicing uses physical size from the export manifest. Current Commander/crew frame cells are physically 96x128 and logically 24x32.

## Member 2 — backend and browser adapters

- Own `api/**`, `src/services/sky.ts`, `src/services/debrief.ts`, `src/engine/sky.ts` and corresponding tests. Do not implement storage or change general engine contracts.
- `GET /api/sky?date=YYYY-MM-DD` returns `SkyResponse`: query `date`, `level`, `event` (an observation or null), `source` (`live`, `cache`, `saved`) and `fetchedAt`. Optional query-window fields distinguish observation coverage from fetch time.
- `SkyEvent` includes id/type/observedAt/sourceUrl and optional classType. Never invent a solar event just to fill an object. A null event needs a verified observation-window explanation for a calm classification; network failure is not evidence of calm conditions. An unavailable feed uses a verified cached/archive snapshot.
- `GameState.sky` is the frozen compact snapshot; its optional event fields support a calm observation window without fabricating an event. Mission initialization belongs to Member 1. Continue must not re-query or replace the snapshot.
- `POST /api/debrief` consumes `DebriefRequest`. Wire history uses **event/choice**, while engine history uses **eventId/choiceId**; the lead's payload builder maps those names. No player names/free text/device data.
- `DebriefResponse` is `{ source: 'ai' | 'template', text }`. Server deadline is 8 seconds; browser deadline is 3 seconds with stable local fallback. Do not log payloads or replies. Model is configured by `GEMINI_MODEL` after verifying access.
- API keys remain server-side. `npm run dev` is Vite frontend only; `npm run dev:vercel` is the one-app local function runner once handlers exist. No additional Express server.

## Member 3 — content

- Preserve IDs and writing meaning. `story.json` owns dialogue/UI/After keys; `events.json` owns choices/effects. Timelines reference them rather than duplicating text or balance values.
- Each event has A/B/C choices in that order. Cargo conditional effects remain in event data. Solar variants replace their reference effects; they do not stack.
- Keep Sol 6's three versions together and Sol 8's two branches together. Request ownership of a timeline before coding it.
- Verify facts and record source URLs/dates/units/location before shipping. Never expose `[CHECK]` or `[DATA]` markers as verified facts. This bootstrap does not complete fact-checking.

## Storage boundary — Member 1

`SaveEnvelope` has schemaVersion=1, contentVersion, runId, savedAt, checkpoint and state, plus an optional scene cursor. State is **after** that checkpoint's transition: loading must not apply its effects again. Known durable boundaries are launch, sol_start, choice_result, night and ending.

Selected choice and mini-game result can be captured in the cursor so uncommitted tasks can restart without costs/bonuses. The storage implementation must validate envelope/content compatibility, IDs, dates and meter ranges before accepting a save. Completed runs don't appear as unfinished Continue missions.

`SolStartSnapshot` is session-only and separate from the durable save. No database or schedule seed. Runtime guard implementations and duplicate-effect protection belong to the next engine/storage task, not to these types alone.

## Current checkpoint

Bootstrap and contracts are the current task. API handlers, core scene UI, full engine resolution, save implementation, scene player and playable Sol 1 are not claimed complete. The next Member 1 milestone is pure engine/storage + the scene player and Sol 1 timeline, integrated with Member 4's presentation.

## Gate A verification — November 14

The pre-existing starter was preserved and its missing development dependencies installed. React remains 18.3.1; Vite 8, Tailwind 4, Vitest 5, TypeScript 6 and ESLint 10 are installed. Use Node 24; the package engine also lists supported Node 22/26 ranges.

- `npm install`: completed, with a lockfile.
- `npm run lint`: passed.
- `npm test`: 9 tests passed (starter rendering and fixed-order/repair-branch routing). These are not full engine tests.
- `npm run build`: passed, including TypeScript compilation.
- `npm run format:check`: passed; imported planning docs/assets are deliberately outside automatic formatting.
- `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`: started; HTML, transformed React entry and Tailwind stylesheet returned HTTP 200. No full gameplay/browser playthrough is claimed.
- `npm audit --omit=dev`: no production dependency vulnerabilities.

Development dependency audit still reports 41 findings (23 moderate, 18 high), including the local Vercel/lint toolchain. A compatible tar override removed the critical finding. The local Vercel CLI is pinned to 65.2.0; minimatch/tar overrides are documented in package.json and need review when updating the toolchain. This checkpoint is suitable for development, not a declaration of release security approval. No forced audit downgrade was run. Deployment smoke testing and API handlers are still pending.

No push or commit was performed for this implementation task. Next: Member 1 implements effect resolution, cargo, save/retry guards and the scene player/Sol 1 timeline. Member 2 and Member 4 can consume these contracts in separate working folders after this checkpoint is shared.

## Resource-engine follow-up

Cargo validation, passive modifiers, authored choice rules, resource transitions and ending checks are now implemented. See [ENGINE_HANDOFF.md](ENGINE_HANDOFF.md) for function names and exact phase/idempotency semantics. This is an additive Member 1 implementation; UI/backend interfaces are unchanged. Browser save/retry restoration, the scene player and playable Sol 1 remain next.

## Storage/retry follow-up

Validated browser saves, session memory fallback, overwrite/stale-save protection and memory-only sol-start retry are now implemented. See [STORAGE_HANDOFF.md](STORAGE_HANDOFF.md). SaveEnvelope now includes the runId already required by the README; NASA/AI wire formats are unchanged. The scene player will supply its step-registry validator and connect these modules to the UI.

Scene runner implemented: see docs/SCENE_PLAYER_HANDOFF.md for one-shot cues/checkpoints, optional visit tokens, risk confirmation and UI/storage integration. Authored Sol 1 and visible integration remain outstanding.

Sol 1 integration: src/engine/scenes/sol01-touchdown.ts selects one applicable cargo callback; src/content/story.json contains the approved prologue/tutorial wording. Temporary src/App.tsx consumes /api/sky, persists the latest cursor and restores Continue without a new lookup. Content version is sol1-v1. Member 2's validated browser adapter should replace the temporary response checks; Member 4's presentation should replace the semantic markup, keeping engine changes centralized. No fake sky data or final photo claims are included.
