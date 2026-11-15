import { useEffect, useState, type ReactNode } from 'react';
import type {
  SceneInput,
  ScenePresentationProps,
  SceneStep,
} from '../../engine/scene-types';
import type { SpotId } from '../../engine/types';
import { AfterCard } from './AfterCard';
import { Banner } from './Banner';
import { ChoicePanel } from './ChoicePanel';
import { DialogueBox } from './DialogueBox';
import { NarrationCard } from './NarrationCard';
import { RealMarsPopup } from './RealMarsPopup';
import { SceneStage } from './SceneStage';
import { CoverPanels } from '../minigames/CoverPanels';
import { RoverDrive } from '../minigames/RoverDrive';
import { RepairWires } from '../minigames/RepairWires';
import { PatchLeak } from '../minigames/PatchLeak';
import type {
  ChoiceOption,
  SceneLayerFlags,
  SpotLayout,
  UiSettings,
} from './types';

export type ResolvedSceneContent = {
  /** Already looked-up story text for the active step */
  text?: string;
  speakerName?: string;
  choices?: ChoiceOption[];
  realCard?: {
    title: string;
    fact: string;
    sourceLabel: string;
    sourceUrl?: string;
    photoSrc?: string;
    photoAlt?: string;
    photoCredit?: string;
    mediaLabel?: string;
    savedLabel?: string;
    photoSourceUrl?: string;
    photoCaption?: string;
    contextNote?: string;
    observationNote?: string;
    observationSourceUrl?: string;
  };
};

type ScenePresenterProps = ScenePresentationProps & {
  content: ResolvedSceneContent;
  spots: Record<SpotId, SpotLayout>;
  layers: SceneLayerFlags;
  settings: UiSettings;
  backdropSrc?: string;
  showBuildings?: boolean;
  commanderStart?: { x: number; y: number };
  moodTintClassName?: string;
  roverObstacleBlocking?: boolean;
  eventEffects?: readonly string[];
  cameraPan?: boolean;
  initialWalking?: boolean;
};

const SPEAKER_LABEL: Record<string, string> = {
  robo: 'Robo',
  kai: 'Kai',
  mei: 'Mei',
  thiri: 'Dr. Thiri',
};

/**
 * Maps a Gate A SceneStep to presentation controls.
 * Parent resolves text keys; this never applies meter/effects itself.
 * Wrap with SceneScreen for HUD chrome.
 */
export function ScenePresenter(props: ScenePresenterProps) {
  return <ScenePresenterFrame key={props.step.id} {...props} />;
}
function ScenePresenterFrame({
  step,
  reduceMotion,
  onInput,
  content,
  spots,
  layers,
  settings,
  backdropSrc,
  showBuildings,
  commanderStart = { x: 48, y: 68 },
  moodTintClassName,
  roverObstacleBlocking = true,
  eventEffects,
  cameraPan,
  initialWalking = false,
}: ScenePresenterProps) {
  const [commander, setCommander] = useState({
    ...commanderStart,
    pose: 'idle' as 'idle' | 'walk' | 'cheer' | 'concerned',
  });
  const [walking, setWalking] = useState(initialWalking);
  // CSS transitionend may not fire after a settings overlay or when the position is unchanged.
  useEffect(() => {
    if (!walking || step.type !== 'walk') return;
    const timer = window.setTimeout(
      () => onInput({ type: 'walk_finished', stepId: step.id }),
      reduceMotion ? 0 : 1800,
    );
    return () => window.clearTimeout(timer);
  }, [walking, step, onInput, reduceMotion]);
  const [realOpen, setRealOpen] = useState(step.type === 'real_card');

  function emit(input: SceneInput) {
    onInput(input);
  }

  function startWalk(spotId: SpotId) {
    if (step.type !== 'walk' || walking) return;
    if (spotId !== step.target) {
      emit({ type: 'select_spot', stepId: step.id, spotId });
      return;
    }
    const stand = spots[spotId].stand;
    setWalking(true);
    setCommander({ x: stand[0], y: stand[1], pose: 'walk' });
    emit({ type: 'select_spot', stepId: step.id, spotId });
  }

  function finishWalk() {
    if (step.type !== 'walk') return;
    setWalking(false);
    setCommander((c) => ({ ...c, pose: 'idle' }));
    emit({ type: 'walk_finished', stepId: step.id });
  }

  const activeSpot = step.type === 'walk' ? step.target : null;
  const dock = renderDock(step, content, {
    reduceMotion,
    soundEnabled: settings.soundEnabled,
    roverObstacleBlocking,
    walking,
    realOpen,
    setRealOpen,
    onAdvance: () => emit({ type: 'advance', stepId: step.id }),
    onChoose: (choiceId) => emit({ type: 'choose', stepId: step.id, choiceId }),
    onSkipMiniGame: () =>
      emit({ type: 'mini_game_result', stepId: step.id, result: 'skipped' }),
    onMiniGameResult: (result) =>
      emit({ type: 'mini_game_result', stepId: step.id, result }),
  });

  return (
    <>
      <div className="ui-game__stage">
        <SceneStage
          layers={layers}
          eventEffects={eventEffects}
          cameraPan={cameraPan}
          spots={spots}
          activeSpot={activeSpot}
          hotspotsEnabled={step.type === 'walk' && !walking}
          commander={commander}
          settings={{ ...settings, reduceMotion }}
          backdropSrc={backdropSrc}
          showBuildings={showBuildings}
          moodTintClassName={moodTintClassName}
          onSelectSpot={startWalk}
          onCommanderArrived={walking ? finishWalk : undefined}
          showSkipWalk={walking}
          onSkipWalk={() => {
            if (step.type !== 'walk') return;
            const stand = spots[step.target].stand;
            setCommander({ x: stand[0], y: stand[1], pose: 'idle' });
            finishWalk();
          }}
        />
      </div>
      <div
        className={`ui-game__dock${step.type === 'walk' ? ' ui-game__dock--instruction' : ''}`}
      >
        {dock}
      </div>
    </>
  );
}

function renderDock(
  step: SceneStep,
  content: ResolvedSceneContent,
  opts: {
    reduceMotion: boolean;
    soundEnabled: boolean;
    roverObstacleBlocking: boolean;
    walking: boolean;
    realOpen: boolean;
    setRealOpen: (open: boolean) => void;
    onAdvance: () => void;
    onChoose: (id: 'A' | 'B' | 'C') => void;
    onSkipMiniGame: () => void;
    onMiniGameResult: (result: 'done' | 'skipped') => void;
  },
): ReactNode {
  switch (step.type) {
    case 'narration':
      return (
        <NarrationCard
          text={content.text ?? ''}
          reduceMotion={opts.reduceMotion}
          continueLabel="Continue"
          onContinue={opts.onAdvance}
        />
      );
    case 'dialogue': {
      const portrait =
        step.speaker === 'robo'
          ? ({ speaker: 'robo', expression: step.expression } as const)
          : ({ speaker: step.speaker, expression: step.expression } as const);
      return (
        <DialogueBox
          {...portrait}
          reduceMotion={opts.reduceMotion}
          speakerName={
            content.speakerName ?? SPEAKER_LABEL[step.speaker] ?? step.speaker
          }
          text={content.text ?? ''}
          onContinue={opts.onAdvance}
        />
      );
    }
    case 'walk':
      return (
        <Banner
          tone="hint"
          message={
            opts.walking
              ? 'Commander is walking… use Skip walk if needed.'
              : `Tap the glowing ${step.target} spot.`
          }
        />
      );
    case 'choice':
      return (
        <div className="ui-game__dock-stack">
          <ChoicePanel
            roundId={step.id}
            options={content.choices ?? []}
            onChoose={opts.onChoose}
          />
        </div>
      );
    case 'after':
      return (
        <AfterCard
          text={content.text ?? ''}
          onContinue={opts.onAdvance}
          reduceMotion={opts.reduceMotion}
          soundEnabled={opts.soundEnabled}
        />
      );
    case 'real_card':
      return (
        <div className="ui-game__dock-stack">
          {content.realCard ? (
            <>
              {opts.realOpen && (
                <RealMarsPopup
                  card={content.realCard}
                  onClose={() => opts.setRealOpen(false)}
                />
              )}
            </>
          ) : (
            <Banner message="This learning card is unavailable. You can keep playing." />
          )}
          {(!opts.realOpen || !content.realCard) && (
            <button
              className="ui-btn ui-btn--cta"
              type="button"
              onClick={opts.onAdvance}
            >
              Continue
            </button>
          )}
        </div>
      );
    case 'classroom_pause':
      return null;
    case 'mini_game':
      if (step.gameId === 'repair_wires' || step.gameId === 'patch_leak') {
        const common = {
          reduceMotion: opts.reduceMotion,
          instructionKey: `minigame.${step.gameId}.hint`,
          instruction: content.text ?? '',
          onResult: opts.onMiniGameResult,
        };
        return (
          <div className="ui-game__dock-stack">
            {step.gameId === 'repair_wires' ? (
              <RepairWires {...common} id="repair_wires" />
            ) : (
              <PatchLeak {...common} id="patch_leak" />
            )}
          </div>
        );
      }
      if (step.gameId === 'rover_drive') {
        return (
          <div className="ui-game__dock-stack">
            <RoverDrive
              id="rover_drive"
              instructionKey="minigame.rover_drive.hint"
              instruction={
                content.text ??
                'Guide the rover to the ice. Use the D-pad, arrow keys, or GO.'
              }
              reduceMotion={opts.reduceMotion}
              obstacleBlocking={opts.roverObstacleBlocking}
              onResult={opts.onMiniGameResult}
            />
          </div>
        );
      }
      if (step.gameId === 'cover_panels') {
        return (
          <div className="ui-game__dock-stack">
            <CoverPanels
              id="cover_panels"
              instructionKey="minigame.cover_panels.hint"
              instruction={
                content.text ??
                'Tap each solar panel (or press 1–4) to pull a cover over it.'
              }
              reduceMotion={opts.reduceMotion}
              onResult={opts.onMiniGameResult}
            />
          </div>
        );
      }
      return (
        <div className="ui-game__dock-row">
          <Banner
            tone="hint"
            message={`Mini-game “${step.gameId}” stub — use Skip until the real task lands.`}
          />
          <button
            type="button"
            className="ui-btn"
            onClick={opts.onSkipMiniGame}
          >
            Skip
          </button>
        </div>
      );
    default:
      return null;
  }
}
