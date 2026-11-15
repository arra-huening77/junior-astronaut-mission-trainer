# AI entry instructions — Mars Mission Survival

This is the clean team handoff repository. Read these instructions before editing. It contains imported planning/artwork/utilities, a runnable React/Vite starter and Gate A shared contracts. **Mission gameplay is not implemented yet.** Do not report a feature as implemented just because a document describes it.

## Start here

1. Read `README.md`, especially **CONFIRMED UPDATE**, for product rules, IDs and numbers.
2. Read `docs/TEAM_WORKFLOW.md` for member ownership, dependencies, checkpoints, task prompts and acceptance criteria. Then read `docs/CONTRACTS.md` for the implemented shared interfaces and current checkpoint. View `docs/team-workflow.svg` for the parallel lanes.
3. Read `docs/PROJECT_STRUCTURE.md` for paths. Frontend is `src/`; backend functions are `api/`. Do not create a second nested project or a `tuesday/` subfolder.
4. For scene work, read `docs/story-script.md` and `docs/facts.md`. Facts are not all verified. Source PDFs and member art briefs were intentionally excluded.
5. For artwork, read `asset-preparation/README.md` and `asset-preparation/export-manifest.json`. The setting reference is `asset-preparation/references/setting-reference.jpg`.
6. Read `docs/PREPARATION_IMPORT.md` to distinguish preparation from future implementation. Never rewrite Git history or timestamps to imply earlier work was created during the event.

If the human only says "ready to work," ask which member/task you are handling before editing. Read-only orientation can proceed. Begin implementation only on an explicitly assigned task when the human confirms the event's permitted coding start. The recorded 09:00 Asia/Rangoon plan is not proof of organizer permission.

## Roles and owned paths

| Role | Initial responsibility | Owned area |
|---|---|---|
| Member 1 — lead | Bootstrap/contracts, pure mission engine, scene player, full Sol 1 and integration | Shared configuration/lockfile, app wiring, general `src/engine/**`, storage; later delegates exact scene files. |
| Member 4 | Frontend components and outpost, later assigned mini-games/teacher UI | Assigned `src/ui/**` and specific styles; does not independently change app entry points. |
| Member 2 | NASA + AI functions and their browser adapters, later assigned mini-games/album | `api/**`, `src/services/sky.ts`, `src/services/debrief.ts`, solar classifier `src/engine/sky.ts`; not storage/general engine. |
| Member 3 | Verify facts, sources, real photos/captions and audio inventory; help with remaining content | Assigned `docs/**` and `src/content/**`. First Sol 1 runtime text conversion is Member 1's until handed over. |

Assignments can change through a recorded handoff. Own and troubleshoot your delivered feature. Do not transfer every bug to Member 1. Exact mini-game/album/Teacher Pack ownership is assigned in the workflow before work starts.

## Safe parallel work

- Each simultaneous coding agent needs a separate checkout and branch, including when Cursor and Codex run on the same computer. A separate chat alone does not isolate files.
- Member 1 explicitly chose `main` in this checkout on November 14. Respect that override; do not create a branch for this task. Other task owners choose their own checkout workflow. Coordinate shared-remote pushes and never overwrite local work or force-push. Do not switch the branch beneath another running agent.
- One active owner per file. Consume shared interfaces read-only. Request contract/config/dependency changes from Member 1; don't fix an integration error by silently changing someone else's files.
- Member 1 initially owns package files, lockfile, project configuration, app entry points, central registry and shared state/scene types.
- Bootstrap/contracts land first. Then engine/UI/backend/content run in parallel. Integrate and review Sol 1 before writing all other timelines.
- Backend work does not block an offline Sol 1. Clearly labeled fixtures may be used for development/testing; never present fixtures as live or verified NASA observations.
- Do not automatically push, merge or deploy; follow the human task owner's instructions. Preserve the existing repository and its origin.

## Product invariants

- Fixed ten-sol order; thirteen prepared versions. No randomized schedule or gameplay seed. An optional seed is only for reproducible simulator sampling.
- Exact IDs: `touchdown`, `first_night`, `dust_storm`, `ice_hunt`, `calling_earth`, `solar_storm`, `equipment_failure`, `leak` or `meteors`, `cold_night`, `finale`.
- Solar variant is frozen NASA input (`calm`, `active`, `stormy`). Sol 8 uses `quickPatch` from the earlier repair. Do not rename IDs or invent new events.
- Timeline files belong in `src/engine/scenes/`, one per sol. Sol 6 contains three variants; Sol 8 contains two branches. Timelines reference text/content keys; no competing copies of dialogue or effects.
- Approved writing: `docs/story-script.md`. Runtime text: `story.json`; balance/effects: README-owned `balance.ts`, `events.json`, `cargo.json`. Source facts/photos/templates have their own content files.
- All resource changes resolve through the engine exactly once. Respect RESULT/NIGHT/failure order, pending costs, cargo modifiers and final-night checks.
- Four skippable mini-games: Cover Panels, Rover Drive, Repair Wires, Patch Leak. No countdown or losing state. Preserve Rover obstacles and its `obstacleBlocking` fallback. Components return completion; the engine awards effects once.
- No database, login, cross-device save, Free Play, mode-selection screen, post-mission quiz or generated runtime story.
- Continue uses browser storage and preserves the frozen NASA snapshot. Memory-only sol retry is separate from durable Continue.
- NASA input is fetched once before Plan, with verified cached/saved fallback and source/date metadata. It does not forecast the fictional outpost's dust/cold events.
- AI is only an end-of-mission debrief, with local templates. Client display deadline 3 seconds; server timeout 8 seconds. Never replace a displayed fallback with a late response.
- NASA/Gemini secrets stay server-side in ignored local `.env` and hosting environment settings; never use `VITE_` for secret keys.
- NASA photos are real curated saved images, independently labeled from sky status. Do not expose draft markers or pretend generated art depicts real NASA observations.
- Teacher Pack retains its worksheet, lesson plan, discussion questions, vocabulary, album printing, certificate and classroom setting. No separate classroom game mode.

## Asset status and validation

- `public/assets/` contains 62 prepared runtime PNGs. `asset-preparation/` holds the preserved originals and export metadata; it is not all shipped to players.
- Seven Robo source images are present, but their runtime export/integration pass is still needed. No final audio files or curated NASA photos were supplied in this import. Don't claim those are ready.
- Physical PNG resolution differs from logical scene size. Read the manifest for frame slicing, logical dimensions and registration; larger files must not make characters larger in the world.
- Scripted transparency/registration work was already done in preparation. Plating fit, panel design mismatches, helmets and the reference-setting style still need explicit review/edits.
- The copied Python utilities predate this repository's import. They are optional artwork preparation/QA tools requiring Python and Pillow, not game implementation. `python scripts/prepare_assets.py --check` and `python scripts/check_asset_cleanup.py` validate the imported assets without redrawing them.
- A runnable React 18/Vite/Tailwind starter now exists. Use Node 24 (or the supported engine range in package.json). `npm ci`, `npm run dev`, `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` are available. API handlers/gameplay are still absent.

## Handoff before finishing a task

Report: changed files; consumed contracts; actual run/check results; manual test steps; configuration variable names only; known gaps; and exact integration needed from another owner. Keep commits reviewable and task-sized. Mark work ready only when the relevant behavior is exercised; label untested behavior honestly.
