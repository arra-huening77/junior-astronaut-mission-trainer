# Cargo and resource engine — Member 1 handoff

This checkpoint adds pure calculations and authored rules. It does not yet implement the scene player, browser saves/retry restoration, report UI or a playable Sol 1. The visible app is still the starter screen. No backend/UI-owner files are changed by this task.

## Entry points

| File                      | Public entry points                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/engine/loadout.ts`   | `getCargoCatalog()`, `validateLoadout(selection)`, `createLoadout(selection)`                                                       |
| `src/engine/state.ts`     | `createMission({ missionDate, contentVersion, sky })`                                                                               |
| `src/engine/rules.ts`     | `getEventRules(id)`, `rulesForSky(event, level)`, `parseEventRules(unknown)`                                                        |
| `src/engine/resources.ts` | `launchMission`, `previewChoice`, `resolveChoice`, `encounterRealMoment`, `finishNight`, `beginNextSol`, `meterZone`, `failedMeter` |

The functions consume the Gate A shared types. No external packages, React, storage, network calls, clock lookups or random values are used by these calculations. Supply the validated frozen sky snapshot from the service and a UTC mission date; engine test fixtures are not application NASA data.

## Data ownership

- `src/content/cargo.json`: eight confirmed package weights and passive modifiers, plus content keys and icon paths. An empty modifiers object is intentional for supplies whose benefits are conditional event adjustments.
- `src/content/events.json`: rules for the eleven existing event IDs and three solar variants, producing thirteen playable versions. The base solar row is the stormy reference; runtime solar choices always use the selected variant instead.
- This checkpoint's event records are **rules-only**, typed by `EventRules`. Timeline/mood/fact metadata and real text still need the content/scene task. Keys are references, not completed dialogue. Do not invent scientific copy to fill them.
- `balance.ts` still owns starter meters, passive defaults, thresholds and cargo budget. The confirmed plants loss of 3 is now named `plantsLifeLoss` there.
- Before others edit cargo/event rules, coordinate ownership with Member 1. Member 3 can supply approved text/metadata without independently tuning the numerical effects.

## Transition semantics for the future scene player

1. `createMission` returns PLAN with base meters and a copied frozen input. It does not apply cargo or generate power.
2. `launchMission(plan, cargo)` validates the unique package selection and budget, applies starting bonuses, then runs the first sol start atomically. Its result is BRIEFING. Save the resulting state as a durable launch/sol-start checkpoint without repeating either calculation on reload.
3. The scene player advances presentation to CHOICE or MINIGAME; this module does not play dialogue or animation.
4. `previewChoice` is pure and does not enqueue penalties in the real state. By default it assumes no optional completion bonus, so a risky-choice warning does not promise the child will complete a task.
5. `resolveChoice(state, choiceId, optionalGameResult)` applies the chosen authored variant, cargo conditions, existing-flag adjustments and optional bonus as one batch, then clamps, records history and checks failure. Return value is `{ state, result }`; duplicate commits return the same input state and `result: null`.
6. If the state is ENDED/gentle, skip normal success/After/card sequences and use the safe ending presentation. Otherwise show the matching After text, then call `encounterRealMoment(state, verifiedCardId)` as the invitation is encountered. It records the card whether or not its photo is opened and enters REAL_CARD.
7. `finishNight` accepts REAL_CARD and returns NIGHT **after** upkeep. Repeating it on NIGHT does nothing. A zero meter ends the mission. Sol 10 success occurs only after this check.
8. `beginNextSol` accepts committed NIGHT, increments the sol and consumes due pending costs, generation and the Sol 10 plants consequence, then enters BRIEFING. It cannot advance past Sol 10 or apply the same sol start twice to its own returned state.

Callbacks should use the current reducer state and originating step ID, not a stale captured copy. Phase/history guards prevent replay against committed state; durable save validation and scene-cursor guards are still required in the next task. Do not represent the current resource guards as a completed reload/retry implementation.

## Important details

- All pure transitions clone before changing state; caller-owned inputs, cargo and sky are not modified. There is no new sky lookup during the mission.
- Pending sol-start costs, generation and plant costs are combined before the final clamp. This avoids turning a negative interim total into extra generated power. Failure checks remain at RESULT and NIGHT as specified.
- Mini-game bonuses: Rover Drive +2 Life; the other three +2 Power. `skipped` keeps the ordinary choice costs with no additional penalty. A feature-disabled task may omit a result and earns no bonus. An active MINIGAME must report done/skipped.
- Spare parts and the earlier flicker adjustment apply once to every Sol 7 choice; rover fuel affects only the long Sol 4 trip; radio booster affects only Sol 5 A. Permanent cargo modifiers stay unchanged afterward.
- `noScience` never deducts existing Science. Leak C is Life +3 followed by ordinary upkeep, not a second hard-coded Life -2. Finale effects with a zero value mean no change, not setting a meter to zero.
- The quick-patch branch resolves when Sol 8 begins. Its actual ID is then recorded in the fixed schedule and history.
- When several meters empty together, failure uses their largest actual clamped drop; an exact tie uses life, power, shield order. No randomness is introduced.
- The optional Emergency Reserve feature is not enabled/implemented in this checkpoint. No automatic rescue is silently applied.

## Validation

The tests cover loadout boundaries, duplicate/unknown cargo, modifiers, immutable inputs, one-time choice/bonus/upkeep, conditional cargo, solar replacement, future penalties, leak branch, Science pauses, zero finale deltas, immediate/final-night failures, invalid rule data and complete ten-sol missions in each solar variant. These establish representative viable paths, not the full balance acceptance target. Exhaustive loadout simulation and child playtesting remain separate work.

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build`. Next implementation work is the versioned storage/retry layer followed by the scene player and authored Sol 1 timeline; frontend/backend owners consume the existing shared contracts.
