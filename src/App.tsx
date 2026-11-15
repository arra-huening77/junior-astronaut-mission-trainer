import { features } from './features';
import { useRef, useState } from 'react';
import {
  resolveText as text,
  resolveRealCard,
  resolveAlbum,
} from './content/mission-content';
import { createMission } from './engine/state';
import { beginNextSol, launchMission, meterZone } from './engine/resources';
import { validateLoadout } from './engine/loadout';
import { resolveMissionScene } from './engine/mission';
import { createRetrySession } from './engine/retry';
import {
  resumeScene,
  sceneView,
  sendSceneInput,
  stampSceneInput,
  startScene,
} from './engine/scene-player';
import type { SceneOptions, SceneTransition } from './engine/scene-player';
import type { SceneInput } from './engine/scene-types';
import type { CargoId, GameState, MoodId } from './engine/types';
import { createMissionStorage, createSaveEnvelope } from './services/storage';
import type { DurableTransition } from './engine/contracts';
import { registerBundledDonkiArchive } from './content/donkiArchive';
import {
  clearMissionSkyFreeze,
  fetchSkyForMission,
  freezeMissionSkySnapshot,
} from './services/sky';
import { useClassroomSettings } from './services/classroom-settings';
import {
  ScenePresenter,
  type ResolvedSceneContent,
} from './ui/components/ScenePresenter';
import { SceneStage } from './ui/components/SceneStage';
import { MISSION_SPOTS } from './ui/components/outpostLayout';
import { scenePresentation } from './ui/mission-presentation';
import type { SceneLayerFlags } from './ui/components/types';
import { alertForMood } from './ui/presentation/eventAlert';
import { PlanScreen } from './ui/screens/PlanScreen';
import { PrologueScreen } from './ui/screens/PrologueScreen';
import { SceneScreen } from './ui/screens/SceneScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { SourcesScreen } from './ui/screens/SourcesScreen';
import { TeachersScreen } from './ui/screens/TeachersScreen';
import { TitleScreen, type TitleAction } from './ui/screens/TitleScreen';
import { MissionAlbumScreen } from './ui/screens/MissionAlbumScreen';
import { CertificatePrint } from './ui/screens/teacher/CertificatePrint';
import { ClassroomPause } from './ui/screens/teacher/ClassroomPause';
import { MissionReport } from './ui/screens/MissionReport';
import { useMissionAudio } from './ui/use-mission-audio';
import { useRoboAudio } from './ui/use-robo-audio';

// Remain compatible with already saved Sol 1 runs; the envelope/schema is unchanged.
const VERSION = 'sol1-v1';
type AppPhase = 'title' | 'plan' | 'scene' | 'report';
type Overlay =
  'teachers' | 'sources' | 'settings' | 'album' | 'certificate' | null;

/** Member 4 mood wash. Classes live on the overlay tint, not the old mission-mood root. */
function moodTintClass(mood: MoodId | undefined): string | undefined {
  switch (mood) {
    case 'dust_storm':
      return 'ui-mood--dust';
    case 'solar_storm':
    case 'finale_storm':
      return 'ui-mood--solar';
    case 'alarm_amber':
      return 'ui-mood--amber';
    case 'alarm_red':
      return 'ui-mood--red';
    case 'cold_night':
      return 'ui-mood--cold';
    case 'meteors':
      return 'ui-mood--meteors';
    case 'dusk_night':
      return 'ui-mood--dusk';
    case 'golden_dawn':
    case 'finale_dawn':
      return 'ui-mood--dawn';
    default:
      return undefined;
  }
}

/** sky_* art for the weather crossfade. Hazard moods use dusk rather than a flat day plate. */
function skyForMood(mood: MoodId | undefined): SceneLayerFlags['sky'] {
  switch (mood) {
    case 'dusk_night':
    case 'cold_night':
      return 'night';
    case 'dust_storm':
      return 'dust';
    case 'golden_dawn':
    case 'finale_dawn':
      return 'dawn';
    case 'solar_storm':
    case 'alarm_amber':
    case 'alarm_red':
    case 'meteors':
    case 'finale_storm':
      return 'dusk';
    default:
      return 'day';
  }
}

export default function App() {
  const [storage] = useState(() =>
    createMissionStorage({ contentVersion: VERSION }),
  );
  const [retry] = useState(createRetrySession);
  const [saved, setSaved] = useState(() => storage.loadActive());
  const [lastRun, setLastRun] = useState(() => storage.loadLastRun());
  const [phase, setPhase] = useState<AppPhase>('title');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [plan, setPlan] = useState<GameState>();
  const [transition, setTransition] = useState<SceneTransition>();
  const current = useRef<SceneTransition | undefined>(undefined);
  const [runId, setRunId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const starting = useRef(false);
  const [allowReplace, setAllowReplace] = useState(false);
  const { settings, setClassroom, updateSettings, saveWarning } =
    useClassroomSettings();
  const options: SceneOptions = {
    reduceMotion: settings.reduceMotion,
    classroomMode: settings.classroomMode,
    miniGames: features.miniGames,
  };
  const playback = transition?.playback;
  const state = phase === 'plan' ? plan : playback?.game;
  const reportState = playback?.game.ending
    ? playback.game
    : lastRun.kind === 'ready'
      ? lastRun.save.state
      : undefined;
  const materialState =
    phase === 'report'
      ? reportState
      : (state ?? (saved.kind === 'ready' ? saved.save.state : reportState));
  const scene = playback ? resolveMissionScene(playback.game) : undefined;
  const view = playback && scene ? sceneView(scene, playback) : undefined;
  const step = view?.step;
  const presentation =
    scene && playback ? scenePresentation(scene, playback) : undefined;
  useMissionAudio(
    phase === 'scene' && !overlay ? transition : undefined,
    settings.soundEnabled,
  );
  useRoboAudio(
    phase === 'scene' && !overlay ? transition : undefined,
    step,
    settings.soundEnabled,
    runId,
  );

  function persist(next: SceneTransition, id: string, replace = false) {
    const state = next.playback.game;
    const checkpoint: DurableTransition =
      state.phase === 'ENDED'
        ? 'ending'
        : state.phase === 'NIGHT'
          ? 'night'
          : ['RESULT', 'REAL_CARD'].includes(state.phase)
            ? 'choice_result'
            : 'sol_start';
    const result = storage.save(
      createSaveEnvelope({
        runId: id,
        state,
        cursor: next.playback.cursor,
        checkpoint,
        savedAt: new Date().toISOString(),
      }),
      { replaceUnfinished: replace },
    );
    setSaved(storage.loadActive());
    setLastRun(storage.loadLastRun());
    setStatus(
      result.kind !== 'saved'
        ? 'This progress could not be saved. Keep this page open.'
        : result.mode === 'memory'
          ? 'Progress is kept in this tab only because browser storage is unavailable.'
          : '',
    );
    return result.kind === 'saved';
  }
  function install(next: SceneTransition, id = runId) {
    if (
      next.playback.status === 'complete' &&
      next.playback.game.phase === 'NIGHT' &&
      next.playback.game.sol < 10
    ) {
      const game = beginNextSol(next.playback.game);
      const following = startScene(resolveMissionScene(game), game, {
        ...options,
        visitBase: next.playback.visit + 1,
      });
      persist(following, id);
      capture(following, id);
      next = following;
    }
    current.current = next;
    setTransition(next);
    if (next.playback.status === 'ended') setPhase('report');
  }
  function capture(next: SceneTransition, id: string) {
    const start = next.checkpoints.find((c) => c.checkpoint === 'sol_start');
    if (start) retry.capture(id, start.state, start.cursor);
  }
  async function start() {
    if (starting.current) return;
    starting.current = true;
    setLoading(true);
    setStatus('Reading NASA observations…');
    try {
      registerBundledDonkiArchive();
      clearMissionSkyFreeze();
      const date = new Date().toISOString().slice(0, 10);
      const result = await fetchSkyForMission({ queryDate: date });
      if (!result.ok) throw new Error('Sky unavailable');
      const mission = createMission({
        missionDate: date,
        contentVersion: VERSION,
        sky: result.snapshot,
      });
      freezeMissionSkySnapshot(mission.sky!);
      setPlan(mission);
      setRunId(crypto.randomUUID());
      setAllowReplace(saved.kind === 'ready');
      setOverlay(null);
      setPhase('plan');
      setStatus('');
    } catch {
      setStatus(
        'NASA observations and saved fallback are unavailable. Please try again. Your saved mission is unchanged.',
      );
    } finally {
      starting.current = false;
      setLoading(false);
    }
  }
  function launch(cargo: CargoId[]) {
    if (!plan || !validateLoadout(cargo).valid || starting.current) return;
    const game = launchMission(plan, cargo);
    const next = startScene(resolveMissionScene(game), game, options);
    if (!persist(next, runId, allowReplace)) return;
    retry.clear();
    capture(next, runId);
    install(next);
    setPlan(undefined);
    setAllowReplace(false);
    setPhase('scene');
  }
  function restore() {
    if (saved.kind !== 'ready') return;
    try {
      const next = resumeScene(
        resolveMissionScene(saved.save.state),
        saved.save,
        { ...options, visitBase: (current.current?.playback.visit ?? 0) + 1 },
      );
      if (next.playback.game.sky)
        freezeMissionSkySnapshot(next.playback.game.sky);
      retry.clear();
      setRunId(saved.save.runId);
      install(next, saved.save.runId);
      setPhase('scene');
      setOverlay(null);
      setStatus('');
    } catch {
      setStatus('This save cannot be opened with the current mission content.');
    }
  }
  function input(value: SceneInput) {
    const previous = current.current;
    if (!previous) return;
    const next = sendSceneInput(
      resolveMissionScene(previous.playback.game),
      previous.playback,
      value,
      options,
    );
    if (next.feedback) {
      setStatus('Tap the glowing destination. Robo will help you find it!');
      return;
    }
    if (next.playback === previous.playback) return;
    persist(next, runId);
    install(next);
  }
  // Stamp the frame that created the callback, not whichever frame is current when it fires.
  const onSceneInput = playback
    ? (value: SceneInput) => input(stampSceneInput(playback, value))
    : () => {};
  function retrySol() {
    const previous = current.current?.playback;
    if (!previous) return;
    const snapshot = retry.restore(runId, previous.game);
    if (!snapshot) return;
    const result = storage.save(
      createSaveEnvelope({
        runId,
        state: snapshot.state,
        cursor: snapshot.cursor,
        checkpoint: 'sol_start',
        savedAt: new Date().toISOString(),
      }),
      { retrySol: true },
    );
    if (result.kind !== 'saved') {
      setStatus('This sol could not be retried. You can start a new mission.');
      return;
    }
    const next = startScene(
      resolveMissionScene(snapshot.state),
      snapshot.state,
      { ...options, visitBase: previous.visit + 1 },
    );
    persist(next, runId);
    install(next);
    setPhase('scene');
  }
  function titleAction(action: TitleAction) {
    if (action === 'start') {
      void start();
      return;
    }
    if (action === 'continue') {
      restore();
      return;
    }
    setOverlay(action);
  }
  const content: ResolvedSceneContent = {
    text: view?.textKey
      ? text(view.textKey)
      : step?.type === 'mini_game'
        ? text(
            `minigame.${step.gameId}.${step.gameId === 'rover_drive' && !features.roverObstacleBlocking ? 'waypoints' : 'hint'}`,
          )
        : undefined,
    choices: view?.choices?.map((c) => ({
      id: c.id,
      label: text(c.labelKey),
      caution: view.caution?.choiceId === c.id,
      disabled: !!view.caution,
    })),
    realCard:
      step?.type === 'real_card' && state
        ? resolveRealCard(step.realMomentId, state)
        : undefined,
  };
  const closeOverlay = () => setOverlay(null);
  if (overlay === 'teachers')
    return (
      <TeachersScreen
        classroomMode={settings.classroomMode}
        onClassroomModeChange={setClassroom}
        albumIds={materialState?.albumIds}
        missionCompleted={materialState?.ending === 'success'}
        onClose={closeOverlay}
      />
    );
  if (overlay === 'settings')
    return (
      <SettingsScreen
        values={settings}
        onChange={updateSettings}
        saveStatus={saveWarning}
        onClose={closeOverlay}
      />
    );
  if (overlay === 'sources') return <SourcesScreen onClose={closeOverlay} />;
  if (overlay === 'album')
    return (
      <MissionAlbumScreen
        cards={materialState ? resolveAlbum(materialState) : []}
        onClose={closeOverlay}
      />
    );
  if (overlay === 'certificate')
    return (
      <div className="tn-shell">
        <div className="tn-main">
          <button className="no-print" onClick={closeOverlay}>
            Back to report
          </button>
          <CertificatePrint
            missionCompleted={reportState?.ending === 'success'}
          />
        </div>
      </div>
    );
  if (phase === 'report' && reportState)
    return (
      <MissionReport
        game={reportState}
        canRetrySol={!!retry.restore(runId, reportState)}
        onRetrySol={retrySol}
        onRetryMission={() => void start()}
        onOpenAlbum={() => setOverlay('album')}
        onOpenCertificate={() => setOverlay('certificate')}
        onClose={() => setPhase('title')}
      />
    );
  if (phase === 'plan' && plan)
    return (
      <PlanScreen
        soundEnabled={settings.soundEnabled}
        reduceMotion={settings.reduceMotion}
        skyLevel={plan.solarVariant}
        skyStatus={plan.sky!.source}
        observationDate={plan.sky?.observedAt?.slice(0, 10)}
        onBack={() => {
          setPlan(undefined);
          setPhase('title');
        }}
        onLaunch={launch}
        replacesSavedMission={allowReplace}
      />
    );
  if (phase === 'scene' && playback && state && scene) {
    const prologue =
      step?.type === 'narration' && step.textKey.startsWith('prologue.');
    return (
      <div
        className={`app-scene ${settings.classroomMode ? 'app-scene--classroom' : ''} mission-text--${settings.textSize}`}
      >
        {prologue ? (
          <PrologueScreen
            key={step.id}
            reduceMotion={settings.reduceMotion}
            lines={[text(step.textKey)]}
            finalLabel={
              step.textKey === 'prologue.6' ? 'Begin Sol 1' : 'Continue'
            }
            onComplete={() =>
              onSceneInput({ type: 'advance', stepId: step.id })
            }
            onSkip={() => {
              const previous = current.current;
              if (!previous || previous.playback.visit !== playback.visit)
                return;
              let next = previous;
              for (let i = 0; i < 6; i++) {
                const at = sceneView(scene, next.playback)?.step;
                if (
                  at?.type !== 'narration' ||
                  !at.textKey.startsWith('prologue.')
                )
                  break;
                next = sendSceneInput(
                  scene,
                  next.playback,
                  stampSceneInput(next.playback, {
                    type: 'advance',
                    stepId: at.id,
                  }),
                  options,
                );
              }
              persist(next, runId);
              install(next);
            }}
          />
        ) : (
          <SceneScreen
            meters={state.meters}
            sol={state.sol}
            phaseLabel={
              skyForMood(presentation?.mood) === 'night' ? 'Night' : 'Day'
            }
            reduceMotion={settings.reduceMotion}
            eventAlert={alertForMood(presentation?.mood)}
            onLearn={() => setOverlay('teachers')}
            onSettings={() => setOverlay('settings')}
            onHelp={() =>
              setStatus(
                'Tap Continue to read, choose one action, or tap the glowing building. Every mini-game has Skip.',
              )
            }
          >
            {playback.status === 'complete' && (
              <div className="ui-game__stage">
                <SceneStage
                  layers={{
                    ...presentation!.layers,
                    sky: 'night',
                    extraPanels: state.cargo.includes('solar_extra'),
                    batteryBox: state.cargo.includes('batteries'),
                    shieldPlating: state.cargo.includes('shield_plating'),
                  }}
                  spots={MISSION_SPOTS}
                  hotspotsEnabled={false}
                  commander={presentation!.commander}
                  settings={settings}
                  showBuildings
                  moodTintClassName="ui-mood--dusk"
                  onSelectSpot={() => {}}
                />
              </div>
            )}
            {view && step ? (
              <>
                <ScenePresenter
                  key={`${state.sol}:${step.id}:${playback.visit}`}
                  step={step}
                  initialWalking={view.walking}
                  reduceMotion={settings.reduceMotion}
                  onInput={onSceneInput}
                  roverObstacleBlocking={features.roverObstacleBlocking}
                  content={content}
                  eventEffects={presentation!.cues}
                  cameraPan={transition?.cues.some(
                    (c) => c.type === 'camera' && c.cueKey.includes('pan'),
                  )}
                  spots={MISSION_SPOTS}
                  layers={{
                    ...presentation!.layers,
                    sky: skyForMood(presentation!.mood),
                    extraPanels: state.cargo.includes('solar_extra'),
                    batteryBox: state.cargo.includes('batteries'),
                    shieldPlating: state.cargo.includes('shield_plating'),
                  }}
                  settings={settings}
                  showBuildings
                  commanderStart={presentation!.commander}
                  moodTintClassName={moodTintClass(presentation!.mood)}
                />
                {step.type === 'classroom_pause' && (
                  <div className="mission-classroom">
                    <ClassroomPause
                      sol={state.sol}
                      question={text(step.questionKey)}
                      onContinue={() =>
                        onSceneInput({ type: 'advance', stepId: step.id })
                      }
                    />
                  </div>
                )}
              </>
            ) : null}
          </SceneScreen>
        )}
        {view?.caution && step && (
          <div
            className="app-caution"
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm resource use"
          >
            <p>
              That would use all our{' '}
              {view.caution.failedMeter === 'life'
                ? 'Life Support'
                : view.caution.failedMeter === 'power'
                  ? 'Power'
                  : 'Shielding'}
              . Are you sure?
            </p>
            <button
              onClick={() =>
                onSceneInput({
                  type: 'confirm_choice',
                  stepId: step.id,
                  choiceId: view.caution!.choiceId,
                })
              }
            >
              Choose this
            </button>
            <button
              onClick={() =>
                onSceneInput({ type: 'cancel_choice', stepId: step.id })
              }
            >
              Go back
            </button>
          </div>
        )}
        <p className="app-meter-readout" aria-live="polite">
          Life Support: {state.meters.life} · Power: {state.meters.power} ·
          Shielding: {state.meters.shield}
        </p>
        {status && (
          <p role="status" className="mission-status">
            {status}
          </p>
        )}
        <div className="mission-warnings" role="status">
          {(['life', 'power', 'shield'] as const).map((meter) => {
            const zone = meterZone(state.meters[meter]);
            return zone === 'low' || zone === 'danger' ? (
              <p key={meter}>{text(`warning.${meter}.${zone}`)}</p>
            ) : null;
          })}
        </div>
        <div className="mission-tools no-print">
          <button onClick={() => setOverlay('album')}>Mission Album</button>
          <button onClick={() => setPhase('title')}>Exit</button>
        </div>
      </div>
    );
  }
  return (
    <>
      <TitleScreen
        canContinue={saved.kind === 'ready'}
        reduceMotion={settings.reduceMotion}
        onAction={titleAction}
      />
      {lastRun.kind === 'ready' && (
        <button
          className="mission-last-report"
          onClick={() => {
            current.current = undefined;
            setTransition(undefined);
            setPhase('report');
          }}
        >
          View last mission report
        </button>
      )}
      {(loading || status) && (
        <p role="status" className="mission-status">
          {status || 'Reading NASA observations…'}
        </p>
      )}
      {saved.kind !== 'ready' && saved.kind !== 'empty' && (
        <p role="status">
          Your saved mission is incompatible or damaged. You can start a new
          mission.
        </p>
      )}
    </>
  );
}
