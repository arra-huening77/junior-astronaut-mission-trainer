# Team project structure

This repository now has a runnable React/Vite/TypeScript/Tailwind starter and Gate A shared contracts. The engine, storage/retry, scene player and a Sol 1 app-entry integration are implemented; the complete game and API handlers remain outstanding. Empty folders contain `.gitkeep` so Git can retain them when explicitly committed. This structure does not change the event's coding-start requirements in README.md.

## Frontend: `src/`

The project uses one repository and one deployment. `src/` is the frontend; a second folder named `frontend/` is not necessary.

| Folder | Responsibility |
|---|---|
| `src/engine/` | Pure TypeScript contracts, fixed routing, cargo validation/modifiers, authored effect rules and resource/result/night/ending transitions are implemented. Validated save/retry modules also exist; validated scene progression and the approved Sol 1 timeline are implemented; the remaining timelines and complete presentation flow are next. No React imports. |
| `src/content/` | Authored JSON: events, dialogue, facts, cargo, photos, glossary, discussion questions and local debrief templates. Add real content later; no fake NASA data. |
| `src/services/` | Browser calls to `/api/sky` and `/api/debrief`, fallbacks and local save/storage handling. |
| `src/ui/screens/` | Title, Plan, prologue, scene, report, Learn, Teachers, Sources and Settings. |
| `src/ui/components/` | Responsive meters, dialogue, choices, hotspots, cards and shared controls. |
| `src/ui/minigames/` | Cover Panels, Rover Drive, Repair Wires and Patch Leak. |
| `src/styles/` | Shared responsive styles, visual effects, reduced motion and print styles. |

The root contains the Vite/React/TypeScript starter configuration and frontend entry files `src/main.tsx`, `src/App.tsx` and `src/features.ts`. It runs a clearly labeled Sol 1 development integration with temporary semantic controls. Starting requires a valid `/api/sky` response; no invented NASA fixture is bundled. Member 4 replaces the temporary presentation with assigned components. See the Local development section in `README.md` for install, test and build commands.

## Backend: `api/`

`api/` is the backend server-function directory for the planned deployment. Do not create a second Express server or separate backend package unless the architecture is intentionally changed.

- Planned `api/sky.ts`: fetch/validate NASA observations, classify solar input, cache, return source/date metadata, keep NASA key secret.
- Planned `api/debrief.ts`: validate compact mission input, call the configured Gemini model, validate output and enforce request/time limits. Browser provides the local three-second fallback.
- Those implementation files are not created yet. Keys are entered into a local ignored `.env` and hosting environment settings. `.env.example` contains empty configuration names only.
- No database, login or server-stored player progress is planned. Continue Mission uses browser storage.

## Runtime public files: `public/`

`public/assets/` holds approved files the deployed game serves: `bg/`, `buildings/`, `characters/`, `cargo/`, `minigames/`, `overlays/`, `photos/`, `icons/`, `fonts/`, and `audio/`.

`public/assets/audio/` contains `sfx/`, `music/` and `ambient/`. Runtime code should use these paths consistently; older shorthand audio paths in the planning spec must be normalized during implementation.

`public/teacher/` holds finished printable/downloadable teacher materials. Public files are accessible to visitors: never place keys, private notes or unclear-rights references here.

## Preparation and documentation

- `asset-preparation/references/`: source/style references; not automatically shipped to players.
- `asset-preparation/bg/`: terrain, mountain and sky drafts/originals.
- `asset-preparation/buildings/`: structures, vehicles and scene-upgrade drafts/originals.
- `asset-preparation/characters/`: Robo, Commander, crew portraits and sprite sources.
- `asset-preparation/cargo/`: cargo icon drafts/originals.
- `asset-preparation/minigames/`: task objects, backings and sprite sources.
- `asset-preparation/overlays/`: frost and small effect drafts/originals.
- `asset-preparation/photos/`: real NASA photo sources and prepared copies.
- `asset-preparation/audio/`: audio drafts and source files.
- Organize by asset category, not member. There are no separate working, approved or style-test folders. Review samples inside their category; use clear draft/version filenames.
- `asset-preparation/asset-log.md`: prompt/author/tool/date, edits, source, license and credits.
- `docs/story-script.md`: editable v2.1 with all thirteen prepared scene versions and supporting writing. `docs/facts.md`: verification ledger still awaiting the claim-by-claim research pass. Neither file is implemented game code.
- `AGENTS.md` and `docs/TEAM_WORKFLOW.md`: AI entry instructions, member roles, task boundaries and dependency gates. Member asset briefs and duplicate source PDFs are intentionally excluded from this clean handoff.
- `asset-preparation/references/setting-reference.jpg`: team setting/style reference; not a runtime NASA photograph.
- `docs/PREPARATION_IMPORT.md` and `docs/preparation-import.json`: accurate import provenance.

Preserved artwork sources and the sixty-two prepared runtime PNGs are included. The seven Robo masters are included as sources; their runtime exports still need a deliberate integration pass. Audio files and curated NASA photos are not supplied yet. Review assets in the preparation area first, then place the final runtime exports directly into the matching `public/assets/` path. That is the single destination for finished game assets. Do not ship every draft/source image. Reconcile audio/image licenses before publishing.

## Validation work

- `scripts/`: future content validation and balance simulation utilities.
- `tests/`: shared integration/flow checks where useful. Engine tests can live beside their modules, as described in README.md.
- `tmp/`: local intermediate files, ignored by Git.

## What teammates should do now

Artists can work in their preparation folders using the separate briefs. Writers can fill the script/fact documents. When coding is permitted, implement the scaffold and core engine before connecting real UI/assets. Keep frontend and API work on coordinated branches or avoid editing the same files simultaneously. Nothing in this skeleton fetches external data or needs an API key to inspect.

The app bootstrap is in place, but the game and API handlers are not implemented. Continue with the permitted engine/contracts work before connecting gameplay or external services. No files are pushed automatically; keep private references, working drafts and secrets out of commits.
