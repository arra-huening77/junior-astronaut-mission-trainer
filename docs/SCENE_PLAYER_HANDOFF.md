# Scene-player handoff — Member 1

Implemented in `src/engine/scene-player.ts` and `scene-registry.ts`. This is the pure runner; the visible app still needs an authored Sol 1 and UI integration. Test timelines are fixtures, not approved runtime content.

## Integration sequence

1. Launch with the existing engine, then resolve the matching authored scene with the registry. Solar selection uses frozen mission input; Sol 8 uses the repair flag. Missing content throws explicitly.
2. Call `startScene` once after sol-start effects. Its `sol_start` checkpoint retains the initial BRIEFING state: give this to the existing memory-only retry session.
3. Render `sceneView`. Dialogue/narration/After/card wait for Advance; walking waits for the correct spot and arrival (Advance can skip an in-progress walk). Reduced motion completes walking immediately.
4. Pass `stampSceneInput(visiblePlayback, input)` from each view callback to `sendSceneInput`. Preserve a monotonically increasing `visitBase` across retries/restores to reject callbacks from a prior view of the same step. Old consumers can still send step IDs alone, but they cannot distinguish visits to the same ID.
5. Replace the playback with the returned value. Consume that transition's cues and checkpoints once; do not replay old outboxes on React renders. Cue metadata includes event ID, step ID and solar variant. The renderer resolves assets/audio and handles missing optional media.
6. Persist the latest visible game/cursor with `createSaveEnvelope` and the existing storage service. Use `sol_start` before the choice, `choice_result` for RESULT/REAL_CARD, `night` for NIGHT and `ending` for ENDED. Persist walking/task selection too; `resumeScene` uses the existing Continue normalization so walking restarts at destination selection and unfinished tasks restart without a bonus. Never re-launch or regenerate a restored sol.
7. When playback is `complete`, call `beginNextSol` once and start its authored scene. `mission_end` announces the engine outcome; navigate to the report when playback is `ended`, allowing authored success epilogue dialogue after the final night. Failure stops immediately before normal After/card flow.

## Options and inputs

- `miniGames`: enable attached tasks; false/omitted skips without the completion bonus. Both `done` and `skipped` resolve through the existing engine exactly once.
- `classroomMode`: enables authored discussion pauses within the same mission.
- `reduceMotion`: instant destination arrival.
- Risky choices set `playback.caution` without applying costs. UI sends `confirm_choice` or `cancel_choice` with the originating step ID (and stamped visit).
- Wrong destinations return `feedback: wrong_spot`; the UI supplies a friendly hint.

Registry validation rejects missing targets, loops, unreachable steps, wrong fixed-sol IDs, mismatched choice/After routes, attached mini-game mismatches and missing result/card/night progression. It does not verify scientific claims, translations, media paths or content-key existence; those remain content/integration validation work.

## Verified checkpoint

89 project tests pass, including movement, reduced motion, stale callbacks, three choice routes, optional classroom pause, done/skipped/disabled mini-games, immediate-failure confirmation and committed result/night recovery. Actual browser UI, all ten authored timelines and backend integration are still outstanding.

## Sol 1 app integration

The approved Sol 1 timeline and prologue are now in src/engine/scenes/sol01-touchdown.ts and src/content/story.json. src/App.tsx is temporary Member 1 integration markup, not the final presentation. It checks /api/sky, plans cargo, runs the tutorial and saves/restores the cursor. Continue does not refetch sky. It stops after Sol 1 NIGHT without claiming mission success. Camera/audio/effect cues are authored but not rendered yet; the card invitation collects rm_gale but scientific/photo content still needs integration. Retry, low-meter warning presentation and later sols remain to connect. All 93 project tests pass, including actual React tutorial traversal, result Continue and failure of the replacement lookup preserving the old save.

## Sol 6 timeline checkpoint

createSol06Scene(variant, cargo) in src/engine/scenes/sol06-solar-encounter.ts authors calm, active and stormy versions of the existing solar_storm event. Pass state.solarVariant and state.cargo from the frozen mission; the factory performs no lookup or sampling. Runtime text is in src/content/sol06-solar-encounter.json and uses the existing variant-specific choice/After keys in events.json. No effect numbers were changed. Register the three versions with createSceneRegistry when the full mission is wired; merge this text dictionary in the central resolver at that point. All versions collect rm_solar_event, with observation details from the saved mission snapshot; unresolved Real Mars scientific/photo content is not invented in this file. There is no interactive walk or mini-game. Detector/music/effect cues are authored IDs for the presentation layer, not claims that audio/animations are already connected. The shield-plating callback appears only when packed. Twenty Sol 6 tests cover nine choices, routing/content, frozen selection, research pauses, Continue, classroom discussion and RESULT/NIGHT failures. Full project: 206 tests pass. Frontend integration remains separate.

## Sol 7 timeline checkpoint

createSol07Scene(cargo, flags) in src/engine/scenes/sol07-equipment-failure.ts consumes the mission cargo and flags. Separate approved runtime text is in src/content/sol07-equipment-failure.json. ignoredFlicker selects the earlier Sol 5 callback; spare_parts selects Kai's cargo line. Neither timeline callback applies costs: events.json remains the only owner of the -5 ignored-flicker adjustment, +5 spare-parts adjustment, quickPatch flag and solarPenalty. Walk target is solar. Only A includes repair_wires; done awards the existing +2 Power once, skipped/disabled still performs the normal full repair without that bonus. The repaired effect, success jingle and Kai's post-fix line follow RESULT and never play if it ends the mission. B selects the Sol 8 leak through quickPatch; A/C select meteors. All branches collect rm_wheels and reach classroom pause/night. Real photo/fact content and frontend/media/task components remain separate integration work. Twenty-one Sol 7 tests pass; full project 227 tests pass. No balance changes or frontend edits.

## Sol 8 timeline checkpoint

createSol08Scene(flags) in src/engine/scenes/sol08-leak-or-meteors.ts selects leak only for quickPatch; otherwise it selects meteors. It remains one fixed Sol 8 slot and ignores the solar variant. Approved runtime text lives in src/content/sol08-leak-or-meteors.json. Register both versions and merge this dictionary when wiring the full mission. Leak walks to air; only leak A has patch_leak. Done awards the existing +2 Power once; Skip/disabled applies the normal choice without an added penalty. Leak C applies only the existing Life +3 before ordinary night upkeep; noScience never subtracts earned Science. The drip cue is decorative, not an extra drain. Backup oxygen sets usedBackupO2 through events.json only. Meteors has no walk or mini-game. Branch cards use rm_leak and rm_craters; verified scientific/photo content remains separate. Twenty-five focused tests cover all choices, greenhouse upkeep, repair-driven selection, task completion/Skip, Continue, classroom pauses and RESULT/NIGHT failures. No balance or frontend changes.

## Sol 10 finale checkpoint

createSol10Scene() in src/engine/scenes/sol10-finale.ts authors the fixed finale; runtime text is in src/content/sol10-finale.json. Existing finale A/B/C effects are unchanged. The normal RESULT, matching After, rm_artemis invitation and classroom pause precede NIGHT. Only the successful final-night path reaches rumble stop, golden dawn, sunrise, success music, supply-ship light, fireworks, Dr. Thiri's delayed reply and Robo's mission-complete line. No walk or mini-game is added. Render the epilogue while playback.status is playing even though game.phase is ENDED; navigate to the report only when playback.status is ended. mission_end is an outcome cue, not immediate report navigation. A restored completed save goes to its report without replaying celebration or upkeep. Twenty-one focused tests cover all choices, cargo upkeep, immediate and exact-zero final-night failures, simultaneous failures, classroom pause, Continue and session-only retry with plantsSuffered preserved. Real NASA photo/fact content and actual media playback remain separate integration work. Sol 10 was not wired into App and no Member 4 files were edited.


## Full mission integration — November 14, 2026

This checkpoint supersedes the earlier Sol 1-only integration notes above. Member 1 now owns the assembled app routing. `src/engine/mission.ts` registers all thirteen authored versions and resolves the fixed ten-sol order with frozen sky and the earlier repair flag. `src/content/mission-content.ts` merges the existing per-sol text dictionaries; `facts.json` transcribes the existing `docs/facts.md` ledger, rather than claiming a new scientific verification pass.

`App.tsx` connects Title, Plan, the authored prologue (shown once), all sols, night Continue, all four mini-games, real NASA cards, album, ending report, AI/template debrief and certificate. Mini-game completion awards stay exclusively in the engine. `features.roverObstacleBlocking` defaults to true; false uses the same Rover component with the approved waypoint instruction. Classroom presentation persists in `mms.settings`, uses larger text with reduced motion and sound off by default, and waits at every authored discussion pause. Teacher Pack has one navigation area and an explicit Back to game action. Its isolated preview returns to `/`, not another component preview.

Continue resolves the saved sol/branch and preserves the NASA snapshot. Sol-start retry snapshots stay in memory; a reopened mid-sol session does not pretend to have one. Success presentation runs only after final NIGHT survives. The report uses actual engine-reconstructed choice costs, labels its graph as after-choice values and shows final meters separately. Photos carry actual image type, credits and sources; saved illustrations are never labeled as photographs. Solar observation dates and source remain separate from the illustrative saved photo.

Validation covers all solar levels, both Sol 8 branches, completed/skipped tasks, classroom on/off, save restoration across every night, full React playthroughs, failure/retry and final-night failure. An isolated headless Chrome run completed all ten sols with ten discussion pauses and zero JavaScript exceptions; desktop/mobile Teacher Pack screenshots were checked. These are local integration results, not evidence of a deployed website or successful live NASA/Gemini service call. Audio uses existing files and is optional; full art/effect choreography, audio rights review and child playtesting remain release checks. Static downloadable Teacher PDFs are not created by this integration; the existing HTML print layouts remain available.

Do not replace this app with the former Sol 1-only shell when continuing UI polish. Preserve local Teacher Pack edits and the shared mission contracts. No gameplay costs, event IDs, scene order or authored choices were changed.
