import {
  encounterRealMoment,
  finishNight,
  previewChoice,
  resolveChoice,
} from './resources';
import { getEventRules, rulesForSky } from './rules';
import { prepareForContinue, readSave } from './save-validation';
import { validateScene } from './scene-registry';
import { eventForSol } from './schedule';
import type { DurableTransition, SaveEnvelope } from './contracts';
import type {
  ChoiceDefinition,
  ChoiceId,
  ChoiceResult,
  GameState,
  MeterId,
  MoodId,
  SpotId,
} from './types';
import type {
  SceneCursor,
  SceneDefinition,
  SceneInput,
  SceneStep,
} from './scene-types';

export interface SceneOptions {
  miniGames?: boolean;
  classroomMode?: boolean;
  reduceMotion?: boolean;
  visitBase?: number;
}
export interface ScenePlayback {
  game: GameState;
  cursor: SceneCursor;
  visit: number;
  status: 'playing' | 'complete' | 'ended';
  caution?: { choiceId: ChoiceId; failedMeter: MeterId };
}

interface CueBase {
  stepId: string;
  eventId: SceneDefinition['eventId'];
  variant?: SceneDefinition['variant'];
}
export type SceneCue = CueBase &
  (
    | { type: 'mood'; mood: MoodId }
    | { type: 'camera' | 'effect'; cueKey: string }
    | {
        type: 'audio';
        cueKey: string;
        channel: 'music' | 'ambient' | 'sfx';
        action: 'play' | 'stop';
      }
    | { type: 'walk'; target: SpotId; instant: boolean }
    | { type: 'choice_result'; result: ChoiceResult }
    | { type: 'mission_end'; ending: 'success' | 'gentle' }
  );
type SceneCuePayload = SceneCue extends infer T
  ? T extends CueBase
    ? Omit<T, keyof CueBase>
    : never
  : never;
export interface SceneCommit {
  checkpoint: DurableTransition;
  state: GameState;
  cursor: SceneCursor;
}
export interface SceneTransition {
  playback: ScenePlayback;
  cues: SceneCue[];
  checkpoints: SceneCommit[];
  feedback?: 'wrong_spot';
}

function stepAt(scene: SceneDefinition, position: SceneCursor): SceneStep {
  const step = scene.steps.find((step) => step.id === position.stepId);
  if (!step) throw new TypeError('Unknown current timeline step.');
  return step;
}

function assertContext(scene: SceneDefinition, state: GameState): void {
  if (
    scene.sol !== state.sol ||
    scene.eventId !== eventForSol(state.sol, state.flags) ||
    (scene.eventId === 'solar_storm' && scene.variant !== state.solarVariant)
  ) {
    throw new TypeError('Timeline does not match the frozen mission context.');
  }
}

function commit(
  transition: SceneTransition,
  checkpoint: DurableTransition,
): void {
  transition.checkpoints.push(
    structuredClone({
      checkpoint,
      state: transition.playback.game,
      cursor: transition.playback.cursor,
    }),
  );
}

function emit(
  transition: SceneTransition,
  scene: SceneDefinition,
  cue: SceneCuePayload,
): void {
  transition.cues.push({
    ...cue,
    stepId: transition.playback.cursor.stepId,
    eventId: scene.eventId,
    ...(scene.variant ? { variant: scene.variant } : {}),
  } as SceneCue);
}

function nextStep(transition: SceneTransition, next?: string): void {
  const state = transition.playback;
  delete state.caution;
  if (!next) {
    state.status = state.game.phase === 'ENDED' ? 'ended' : 'complete';
    return;
  }
  state.cursor.stepId = next;
  state.visit += 1;
}

/** Synchronous cues and engine commits run until the next child/teacher interaction. */
function settle(
  scene: SceneDefinition,
  transition: SceneTransition,
  options: SceneOptions,
): SceneTransition {
  const playback = transition.playback;
  for (let count = 0; count <= scene.steps.length; count++) {
    if (playback.status !== 'playing') return transition;
    const step = stepAt(scene, playback.cursor);
    if (step.type === 'scene')
      emit(transition, scene, { type: 'mood', mood: step.mood });
    else if (step.type === 'camera' || step.type === 'effect')
      emit(transition, scene, { type: step.type, cueKey: step.cueKey });
    else if (step.type === 'audio')
      emit(transition, scene, {
        type: 'audio',
        cueKey: step.cueKey,
        action: step.action,
        channel: step.channel,
      });
    else if (step.type === 'result') {
      const choice = playback.cursor.selectedChoiceId;
      if (!choice) throw new TypeError('RESULT requires the selected choice.');
      const result = resolveChoice(
        playback.game,
        choice,
        playback.cursor.miniGameResult,
      );
      playback.game = result.state;
      if (result.result) {
        emit(transition, scene, {
          type: 'choice_result',
          result: result.result,
        });
        commit(transition, playback.game.ending ? 'ending' : 'choice_result');
      }
      if (playback.game.ending === 'gentle') {
        playback.status = 'ended';
        emit(transition, scene, { type: 'mission_end', ending: 'gentle' });
        return transition;
      }
    } else if (step.type === 'night') {
      const previous = playback.game;
      playback.game = finishNight(previous);
      if (playback.game !== previous) {
        commit(transition, playback.game.ending ? 'ending' : 'night');
        if (playback.game.ending)
          emit(transition, scene, {
            type: 'mission_end',
            ending: playback.game.ending,
          });
      }
      if (playback.game.ending === 'gentle') {
        playback.status = 'ended';
        return transition;
      }
      // Success-only presentation after the final check may run; no new game effects.
    } else if (step.type === 'classroom_pause') {
      if (options.classroomMode) return transition;
    } else if (step.type === 'mini_game') {
      if (!options.miniGames) {
        playback.game.phase = 'CHOICE';
        delete playback.cursor.miniGameResult;
      } else {
        playback.game.phase = 'MINIGAME';
        return transition;
      }
    } else if (step.type === 'walk') {
      if (playback.game.phase !== 'WALKING')
        playback.game.phase = 'WALK_SELECT';
      return transition;
    } else if (step.type === 'choice') {
      playback.game.phase = 'CHOICE';
      return transition;
    } else if (step.type === 'real_card') {
      const previous = playback.game;
      playback.game = encounterRealMoment(previous, step.realMomentId);
      if (playback.game !== previous) commit(transition, 'choice_result');
      return transition;
    } else {
      // Keep RESULT/NIGHT/ENDED phases intact during their After/epilogue dialogue.
      if (
        ['BRIEFING', 'EVENT', 'WALK_SELECT', 'WALKING'].includes(
          playback.game.phase,
        )
      )
        playback.game.phase = 'EVENT';
      return transition;
    }
    nextStep(transition, step.next);
  }
  throw new TypeError('Timeline did not settle to an interaction.');
}

export function startScene(
  scene: SceneDefinition,
  game: GameState,
  options: SceneOptions = {},
): SceneTransition {
  validateScene(scene);
  assertContext(scene, game);
  if (
    game.phase !== 'BRIEFING' ||
    game.history.some((item) => item.sol === game.sol)
  )
    throw new TypeError(
      'A new scene starts after sol-start effects, before its choice.',
    );
  const cursor: SceneCursor = {
    eventId: scene.eventId,
    stepId: scene.entryStepId,
    ...(scene.variant ? { variant: scene.variant } : {}),
  };
  const transition: SceneTransition = {
    playback: {
      game: structuredClone(game),
      cursor,
      visit: options.visitBase ?? 0,
      status: 'playing',
    },
    cues: [],
    checkpoints: [],
  };
  commit(transition, 'sol_start');
  return settle(scene, transition, options);
}

function choose(
  scene: SceneDefinition,
  transition: SceneTransition,
  step: Extract<SceneStep, { type: 'choice' }>,
  id: ChoiceId,
): void {
  if (!['A', 'B', 'C'].includes(id))
    throw new TypeError('Unknown choice input.');
  transition.playback.cursor.selectedChoiceId = id;
  delete transition.playback.cursor.miniGameResult;
  nextStep(transition, step.nextByChoice[id]);
  assertContext(scene, transition.playback.game);
}

export function sendSceneInput(
  scene: SceneDefinition,
  previous: ScenePlayback,
  input: SceneInput,
  options: SceneOptions = {},
): SceneTransition {
  const ignored: SceneTransition = {
    playback: previous,
    cues: [],
    checkpoints: [],
  };
  if (
    previous.status !== 'playing' ||
    input.stepId !== previous.cursor.stepId ||
    (input.visit !== undefined && input.visit !== previous.visit)
  )
    return ignored;
  assertContext(scene, previous.game);
  const step = stepAt(scene, previous.cursor);
  const transition: SceneTransition = {
    playback: structuredClone(previous),
    cues: [],
    checkpoints: [],
  };
  const playback = transition.playback;
  if (step.type === 'choice') {
    if (input.type === 'choose') {
      if (!['A', 'B', 'C'].includes(input.choiceId))
        throw new TypeError('Unknown choice input.');
      const preview = previewChoice(playback.game, input.choiceId);
      if (preview.failedMeter) {
        playback.caution = {
          choiceId: input.choiceId,
          failedMeter: preview.failedMeter,
        };
        return transition;
      }
      choose(scene, transition, step, input.choiceId);
    } else if (
      input.type === 'confirm_choice' &&
      playback.caution?.choiceId === input.choiceId
    ) {
      choose(scene, transition, step, input.choiceId);
    } else if (input.type === 'cancel_choice' && playback.caution) {
      delete playback.caution;
      return transition;
    } else return ignored;
  } else if (step.type === 'walk') {
    if (input.type === 'select_spot' && playback.game.phase === 'WALK_SELECT') {
      if (input.spotId !== step.target)
        return { ...ignored, feedback: 'wrong_spot' };
      emit(transition, scene, {
        type: 'walk',
        target: step.target,
        instant: Boolean(options.reduceMotion),
      });
      if (!options.reduceMotion) {
        playback.game.phase = 'WALKING';
        return transition;
      }
    } else if (!(
      (input.type === 'walk_finished' || input.type === 'advance') &&
      playback.game.phase === 'WALKING'
    ))
      return ignored;
    playback.game.phase = 'EVENT';
    nextStep(transition, step.next);
  } else if (step.type === 'mini_game') {
    if (
      input.type !== 'mini_game_result' ||
      !['done', 'skipped'].includes(input.result)
    )
      return ignored;
    playback.cursor.miniGameResult = input.result;
    nextStep(transition, step.next);
  } else if (
    ['dialogue', 'narration', 'after', 'real_card', 'classroom_pause'].includes(
      step.type,
    ) &&
    input.type === 'advance'
  ) {
    nextStep(transition, step.next);
  } else return ignored;
  return settle(scene, transition, options);
}

/** Wrap UI callbacks with the visible frame's visit to reject late events from prior views. */
export function stampSceneInput(
  playback: ScenePlayback,
  input: SceneInput,
): SceneInput {
  return { ...input, visit: playback.visit };
}

export function sceneView(
  scene: SceneDefinition,
  playback: ScenePlayback,
):
  | {
      step: SceneStep;
      textKey?: string;
      choices?: readonly ChoiceDefinition[];
      caution?: ScenePlayback['caution'];
      walking?: boolean;
    }
  | undefined {
  if (playback.status !== 'playing') return undefined;
  const step = stepAt(scene, playback.cursor);
  const view: ReturnType<typeof sceneView> = { step };
  if (step.type === 'dialogue' || step.type === 'narration')
    view.textKey = step.textKey;
  if (step.type === 'after')
    view.textKey = rulesForSky(
      getEventRules(scene.eventId),
      playback.game.solarVariant,
    ).choices.find((item) => item.id === step.choiceId)!.afterKey;
  if (step.type === 'choice') {
    view.choices = rulesForSky(
      getEventRules(scene.eventId),
      playback.game.solarVariant,
    ).choices;
    if (playback.caution) view.caution = playback.caution;
  }
  if (step.type === 'walk') view.walking = playback.game.phase === 'WALKING';
  return view;
}

export function resumeScene(
  scene: SceneDefinition,
  save: SaveEnvelope,
  options: SceneOptions = {},
): SceneTransition {
  validateScene(scene);
  const checked = readSave(JSON.stringify(save), {
    contentVersion: save.contentVersion,
    isKnownCursor: (cursor) =>
      cursor.eventId === scene.eventId &&
      cursor.variant === scene.variant &&
      scene.steps.some((step) => step.id === cursor.stepId),
  });
  if (checked.kind !== 'ready')
    throw new TypeError('Cannot resume an invalid scene save.');
  const restored = prepareForContinue(checked.save);
  assertContext(scene, restored.state);
  const lastChoice = restored.state.history.at(-1)?.choiceId;
  let position = restored.cursor;
  if (!position) {
    const step =
      restored.state.phase === 'RESULT'
        ? scene.steps.find(
            (step) => step.type === 'after' && step.choiceId === lastChoice,
          )
        : restored.state.phase === 'REAL_CARD'
          ? scene.steps.find((step) => step.type === 'real_card')
          : restored.state.phase === 'NIGHT'
            ? scene.steps.find((step) => step.type === 'night')
            : scene.steps.find((step) => step.id === scene.entryStepId);
    if (!step) throw new TypeError('No safe scene resume point.');
    position = {
      eventId: scene.eventId,
      stepId: step.id,
      ...(scene.variant ? { variant: scene.variant } : {}),
      ...(lastChoice && restored.state.history.length === restored.state.sol
        ? { selectedChoiceId: lastChoice }
        : {}),
    };
  }
  const transition: SceneTransition = {
    playback: {
      game: restored.state,
      cursor: position,
      visit: options.visitBase ?? 0,
      status: restored.state.phase === 'ENDED' ? 'ended' : 'playing',
    },
    cues: [],
    checkpoints: [],
  };
  return settle(scene, transition, options);
}
