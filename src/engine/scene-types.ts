import type {
  ChoiceId,
  EventId,
  MiniGameId,
  MiniGameResult,
  MoodId,
  SkyLevel,
  Sol,
  SpotId,
  TextKey,
} from './types';

export type RoboExpression =
  'neutral' | 'explaining' | 'concerned' | 'cheering' | 'thinking';
export type CrewExpression = 'neutral' | 'concerned' | 'happy';
export type SpeakerPortrait =
  | { speaker: 'robo'; expression: RoboExpression }
  | { speaker: 'kai' | 'mei' | 'thiri'; expression: CrewExpression };

interface StepBase {
  id: string;
  next?: string;
}

/** Timeline data references content keys; it never embeds dialogue or balance numbers. */
export type SceneStep =
  | (StepBase & { type: 'scene'; mood: MoodId })
  | (StepBase & SpeakerPortrait & { type: 'dialogue'; textKey: TextKey })
  | (StepBase & {
      type: 'narration';
      speaker: 'robo';
      expression: RoboExpression;
      textKey: TextKey;
    })
  | (StepBase & { type: 'walk'; target: SpotId })
  | (StepBase & { type: 'camera'; cueKey: string })
  | (StepBase & { type: 'effect'; cueKey: string })
  | (StepBase & {
      type: 'audio';
      channel: 'music' | 'ambient' | 'sfx';
      action: 'play' | 'stop';
      cueKey: string;
    })
  | (Omit<StepBase, 'next'> & {
      type: 'choice';
      eventId: EventId;
      nextByChoice: Record<ChoiceId, string>;
    })
  | (StepBase & { type: 'mini_game'; gameId: MiniGameId })
  | (StepBase & { type: 'result'; eventId: EventId })
  | (StepBase &
      SpeakerPortrait & { type: 'after'; eventId: EventId; choiceId: ChoiceId })
  | (StepBase & { type: 'real_card'; realMomentId: string })
  | (StepBase & { type: 'classroom_pause'; questionKey: TextKey })
  | (StepBase & { type: 'night' });

export interface SceneDefinition {
  eventId: EventId;
  sol: Sol;
  variant?: SkyLevel;
  entryStepId: string;
  steps: readonly SceneStep[];
}

export interface SceneCursor {
  eventId: EventId;
  variant?: SkyLevel;
  stepId: string;
  selectedChoiceId?: ChoiceId;
  miniGameResult?: MiniGameResult;
}

export type SceneInput = (
  | { type: 'advance'; stepId: string }
  | { type: 'choose'; stepId: string; choiceId: ChoiceId }
  | { type: 'confirm_choice'; stepId: string; choiceId: ChoiceId }
  | { type: 'cancel_choice'; stepId: string }
  | { type: 'select_spot'; stepId: string; spotId: SpotId }
  | { type: 'walk_finished'; stepId: string }
  | { type: 'mini_game_result'; stepId: string; result: MiniGameResult }
) & { visit?: number };

/** Consumers send the originating step ID so stale/double callbacks can be rejected. */
export interface ScenePresentationProps {
  step: SceneStep;
  reduceMotion: boolean;
  onInput: (input: SceneInput) => void;
}

export type MiniGameProps = {
  reduceMotion: boolean;
  instructionKey: TextKey;
  onResult: (result: MiniGameResult) => void;
} & (
  | { id: 'rover_drive'; obstacleBlocking?: boolean }
  | { id: Exclude<MiniGameId, 'rover_drive'> }
);
