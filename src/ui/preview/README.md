# Member 4 UI preview harness

Consumes Gate A contracts from `src/engine/**` read-only. Does **not** edit `App.tsx`.

## Run

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

| Screen | URL |
|---|---|
| Scene HUD (Sol 1 fixture) | `/ui-preview.html` |
| Rover Drive | `?game=rover` |
| Cover Panels | `?game=panels` |
| Teachers | `?screen=teachers` |
| Report | `?screen=report` |
| Title | `?screen=title` |
| Plan | `?screen=plan` |
| Prologue | `?screen=prologue` |
| Album | `?screen=album` |

## Member 4 deliverables (ready for Member 1)

| Area | Import | Notes |
|---|---|---|
| Scene | `SceneScreen`, `ScenePresenter`, `SceneStage` | `showBuildings` + cargo layers (`extraPanels`, `batteryBox`, `shieldPlating`) |
| Mini-games | `RoverDrive`, `CoverPanels` | Report `done`/`skipped` once; engine awards bonus |
| Title flow | `TitleScreen`, `PlanScreen`, `PrologueScreen` | Start/Continue callbacks; Plan returns `CargoId[]` |
| Menu | `LearnScreen`, `SourcesScreen`, `SettingsScreen` | Settings persistence owned by App |
| End | `ReportScreen`, `MissionAlbumScreen` | History/ending from engine; album cards resolved by parent |
| Teachers | `TeachersScreen` | Printables + Classroom pause demo |
| Barrel | `src/ui/screens/index.ts` | Screen exports |

## Sol 1 wiring sketch

```tsx
import { ScenePresenter } from '../ui/components/ScenePresenter';
import { SceneScreen } from '../ui/screens';

<SceneScreen meters={state.meters} sol={state.sol} reduceMotion={…}>
  <ScenePresenter
    step={currentStep}
    reduceMotion={…}
    onInput={scenePlayer.handleInput}
    content={resolvedContent}
    spots={spots}
    layers={{
      sky: 'dawn',
      solar: 'clean',
      extraPanels: state.cargo.includes('solar_extra'),
      batteryBox: state.cargo.includes('batteries'),
      shieldPlating: state.cargo.includes('shield_plating'),
    }}
    settings={…}
    showBuildings
  />
</SceneScreen>
```

Gameplay backdrop is `bg/sky_*` (dawn/day/dusk/night/dust) from mood cues. Engine alone mutates meters/flags. UI never awards mini-game bonuses.

## Blocked on others

| Need | Owner |
|---|---|
| `App.tsx` route wiring + save/Continue | Member 1 |
| `story.json` / timeline text keys | Member 3 |
| `realMoments.json` + real NASA photo files | Member 2 + 3 |
| Repair Wires / Patch Leak mini-games | Member 2 |
| `/api/sky` + `/api/debrief` live adapters | Member 2 |

## Scene checks

1. Buildings on/off over vista; cargo layers toggle with packed items
2. Narration → walk → dialogue → choice → after → real card
3. Reduce Motion; Skip walk; choice double-tap locked
4. Narrow width usable
