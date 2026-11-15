import { useEffect, useRef } from 'react';
import type { SceneTransition } from '../engine/scene-player';
import type { SceneStep } from '../engine/scene-types';
import type { Meters } from '../engine/types';

/** Existing recordings; keep filenames and the original mission audio untouched. */
export const ROBO_SOUNDS = {
  hello: '1. The Happy Hello! (When the game starts or the.opus',
  goodJob: 'Say Good Job!  A very cute, tiny robot saying h.opus',
  curious: 'The Curious Sound (When presenting a choice to t.opus',
  uhOh: 'The Uh Oh! Sound (When a meter goes down - keep.opus',
  thinking: 'The Typing or Thinking Sound (When text is on.opus',
} as const;
type RoboSound = keyof typeof ROBO_SOUNDS;
const DURATION: Record<RoboSound, number> = {
  hello: 1600,
  goodJob: 2200,
  curious: 1200,
  uhOh: 1300,
  thinking: 650,
};
const VOLUME: Record<RoboSound, number> = {
  hello: 0.16,
  goodJob: 0.24,
  curious: 0.16,
  uhOh: 0.07,
  thinking: 0.06,
};
const METERS = ['life', 'power', 'shield'] as const;

/** Presentation only: committed resources determine feedback, never the choice letter. */
export function roboResourceSound(
  before: Meters,
  after: Meters,
): RoboSound | null {
  if (METERS.some((meter) => after[meter] < before[meter])) return 'uhOh';
  if (METERS.some((meter) => after[meter] > before[meter])) return 'goodJob';
  return null;
}

/** A separate quiet voice channel; does not change existing music or SFX playback. */
export function useRoboAudio(
  transition: SceneTransition | undefined,
  step: SceneStep | undefined,
  enabled: boolean,
  runId: string,
) {
  const memory = useRef({
    runId,
    greeted: false,
    lastUhOhAt: -Infinity,
    seen: new Set<string>(),
    meters: null as Meters | null,
  });
  const stepId = step?.id;
  const stepType = step?.type;
  const isRobo = !!step && 'speaker' in step && step.speaker === 'robo';

  useEffect(() => {
    if (memory.current.runId !== runId) {
      memory.current = {
        runId,
        greeted: false,
        lastUhOhAt: -Infinity,
        seen: new Set(),
        meters: null,
      };
    }
    if (!transition) return;
    const { game, cursor, visit } = transition.playback;
    const key = `${game.sol}:${cursor.eventId}:${stepId ?? cursor.stepId}:${visit}`;
    const previous = memory.current.meters;
    memory.current.meters = { ...game.meters };
    if (!enabled) {
      memory.current.seen.add(key);
      return;
    }
    if (memory.current.seen.has(key) || typeof Audio === 'undefined') return;

    const result = transition.cues.find((cue) => cue.type === 'choice_result');
    let sound: RoboSound | null =
      result?.type === 'choice_result'
        ? roboResourceSound(result.result.before, result.result.after)
        : previous
          ? roboResourceSound(previous, game.meters)
          : null;
    // Finishing a task deserves encouragement even when its choice costs power.
    if (result?.type === 'choice_result' && result.result.miniGame === 'done') {
      sound = 'goodJob';
    }
    // Resource costs are frequent; don't sigh at every consecutive meter change.
    if (sound === 'uhOh' && Date.now() - memory.current.lastUhOhAt < 12000) {
      sound =
        result?.type === 'choice_result' &&
        !game.ending &&
        METERS.some(
          (meter) => result.result.after[meter] > result.result.before[meter],
        )
          ? 'goodJob'
          : null;
    }
    if (!sound && isRobo && !memory.current.greeted) sound = 'hello';
    if (!sound && stepType === 'choice') sound = 'curious';
    if (
      !sound &&
      (stepType === 'dialogue' ||
        stepType === 'narration' ||
        stepType === 'after')
    )
      sound = 'thinking';
    if (!sound) return;

    const sequence: RoboSound[] = [sound];
    // A useful repair can cost power and improve another supply. Acknowledge both,
    // without classifying A/B/C as right or wrong or overlapping the robot clips.
    if (
      sound === 'uhOh' &&
      result?.type === 'choice_result' &&
      !game.ending &&
      METERS.some(
        (meter) => result.result.after[meter] > result.result.before[meter],
      )
    )
      sequence.push('goodJob');
    let audio: HTMLAudioElement | undefined;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Schedule after commit: StrictMode's rehearsal cleanup cancels this before playback.
    let offset = 0;
    for (const selected of sequence) {
      timers.push(
        setTimeout(() => {
          memory.current.seen.add(key);
          if (selected === 'hello') memory.current.greeted = true;
          if (selected === 'uhOh') memory.current.lastUhOhAt = Date.now();
          audio?.pause();
          clearTimeout(stopTimer);
          audio = new Audio(
            `/assets/audio/${encodeURIComponent(ROBO_SOUNDS[selected])}`,
          );
          audio.volume = VOLUME[selected];
          audio.loop = false;
          void audio.play()?.catch(() => {
            /* Autoplay refusal must never block play. */
          });
          stopTimer = setTimeout(() => audio?.pause(), DURATION[selected]);
        }, offset),
      );
      offset += DURATION[selected] + 100;
    }

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(stopTimer);
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    };
  }, [transition, stepId, stepType, isRobo, enabled, runId]);
}
