import { StrictMode, type PropsWithChildren } from 'react';
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createMission } from '../engine/state';
import type { SceneTransition } from '../engine/scene-player';
import type { SceneStep } from '../engine/scene-types';
import { ROBO_SOUNDS, roboResourceSound, useRoboAudio } from './use-robo-audio';

const tracks: FakeAudio[] = [];
class FakeAudio {
  volume = 1;
  loop = false;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  removeAttribute = vi.fn();
  load = vi.fn();
  constructor(public src: string) {
    tracks.push(this);
  }
}
function transition(
  meters = { life: 65, power: 65, shield: 60 },
  visit = 1,
): SceneTransition {
  const game = createMission({
    missionDate: '2026-11-14',
    contentVersion: 'test',
    sky: {
      level: 'calm',
      source: 'saved',
      fetchedAt: '2026-11-14T00:00:00Z',
    },
  });
  game.meters = meters;
  return {
    playback: {
      game,
      cursor: { eventId: 'touchdown', stepId: 'hello' },
      visit,
      status: 'playing',
    },
    cues: [],
    checkpoints: [],
  };
}
const hello: SceneStep = {
  id: 'hello',
  type: 'narration',
  speaker: 'robo',
  expression: 'explaining',
  textKey: 'hello',
};
beforeEach(() => {
  tracks.length = 0;
  vi.useFakeTimers();
  vi.stubGlobal('Audio', FakeAudio);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const flush = () =>
  act(() => {
    vi.advanceTimersByTime(0);
  });
it('references five existing recordings without renaming or replacing assets', () => {
  for (const filename of Object.values(ROBO_SOUNDS)) {
    expect(existsSync(resolve('public/assets/audio', filename))).toBe(true);
  }
});
it('plays hello once under StrictMode and does not replay on a duplicate transition', () => {
  const initial = transition();
  const wrapper = ({ children }: PropsWithChildren) => (
    <StrictMode>{children}</StrictMode>
  );
  const { rerender } = renderHook(
    ({ value }) => useRoboAudio(value, hello, true, 'run'),
    {
      initialProps: { value: initial },
      wrapper,
    },
  );
  flush();
  expect(tracks).toHaveLength(1);
  expect(decodeURIComponent(tracks[0].src)).toContain(ROBO_SOUNDS.hello);
  rerender({ value: { ...initial } });
  flush();
  expect(tracks).toHaveLength(1);
});
it('plays curiosity when a choice appears, and stops immediately when muted', () => {
  const choice: SceneStep = {
    id: 'choice',
    type: 'choice',
    eventId: 'touchdown',
    nextByChoice: { A: 'a', B: 'b', C: 'c' },
  };
  const value = transition();
  const { rerender } = renderHook(
    ({ enabled }) => useRoboAudio(value, choice, enabled, 'run'),
    { initialProps: { enabled: true } },
  );
  flush();
  expect(decodeURIComponent(tracks[0].src)).toContain(ROBO_SOUNDS.curious);
  rerender({ enabled: false });
  expect(tracks[0].pause).toHaveBeenCalled();
  rerender({ enabled: true });
  flush();
  expect(tracks).toHaveLength(1);
});
it('uses actual committed meter changes, with gentle concern taking precedence for a tradeoff', () => {
  const before = { life: 65, power: 65, shield: 60 };
  expect(roboResourceSound(before, { ...before, life: 70 })).toBe('goodJob');
  expect(roboResourceSound(before, { ...before, power: 60 })).toBe('uhOh');
  expect(roboResourceSound(before, { ...before, life: 70, power: 60 })).toBe(
    'uhOh',
  );
  expect(roboResourceSound(before, before)).toBeNull();
});
it('plays a single quiet thinking burst on subsequent dialogue and stops it after 650ms', () => {
  const first = transition();
  const { rerender } = renderHook(
    ({ value, step }) => useRoboAudio(value, step, true, 'run'),
    {
      initialProps: { value: first, step: hello },
    },
  );
  flush();
  rerender({
    value: transition(first.playback.game.meters, 2),
    step: { ...hello, id: 'explain' },
  });
  flush();
  expect(tracks[0].pause).toHaveBeenCalled();
  expect(decodeURIComponent(tracks[1].src)).toContain(ROBO_SOUNDS.thinking);
  expect(tracks[1].volume).toBe(0.06);
  act(() => {
    vi.advanceTimersByTime(650);
  });
  expect(tracks[1].pause).toHaveBeenCalled();
});
it('keeps muted scenes silent', () => {
  renderHook(() => useRoboAudio(transition(), hello, false, 'run'));
  flush();
  expect(tracks).toHaveLength(0);
});

it('limits Uh Oh to once per twelve seconds without shortening its playback', () => {
  const base = { life: 65, power: 65, shield: 60 };
  const { rerender } = renderHook(
    ({ value }) => useRoboAudio(value, undefined, true, 'run'),
    {
      initialProps: { value: transition(base) },
    },
  );
  flush();
  rerender({ value: transition({ ...base, power: 60 }, 2) });
  flush();
  expect(tracks).toHaveLength(1);
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(tracks[0].pause).not.toHaveBeenCalled();
  rerender({ value: transition({ ...base, power: 55 }, 3) });
  flush();
  expect(tracks).toHaveLength(1);
  act(() => {
    vi.advanceTimersByTime(11000);
  });
  rerender({ value: transition({ ...base, power: 50 }, 4) });
  flush();
  expect(tracks).toHaveLength(2);
});

it('acknowledges a committed cost and gain in sequence without overlapping clips', () => {
  const value = transition();
  value.cues = [
    {
      type: 'choice_result',
      eventId: 'touchdown',
      stepId: 'result',
      result: {
        eventId: 'touchdown',
        choiceId: 'A',
        afterKey: 'touchdown.A.after',
        before: { life: 60, power: 70, shield: 60 },
        after: { life: 65, power: 65, shield: 60 },
      },
    },
  ];
  renderHook(() => useRoboAudio(value, hello, true, 'run'));
  flush();
  expect(decodeURIComponent(tracks[0].src)).toContain(ROBO_SOUNDS.uhOh);
  expect(tracks[0].volume).toBe(0.07);
  act(() => {
    vi.advanceTimersByTime(1400);
  });
  expect(tracks[0].pause).toHaveBeenCalled();
  expect(decodeURIComponent(tracks[1].src)).toContain(ROBO_SOUNDS.goodJob);
  expect(tracks[1].volume).toBe(0.24);
});

it.each(['done', 'skipped'] as const)(
  'uses completion feedback for a %s mini-game despite its resource cost',
  (miniGame) => {
    const value = transition();
    value.cues = [
      {
        type: 'choice_result',
        eventId: 'equipment_failure',
        stepId: 'repair.result',
        result: {
          eventId: 'equipment_failure',
          choiceId: 'A',
          miniGame,
          afterKey: 'equipment_failure.A.after',
          before: { life: 65, power: 70, shield: 60 },
          after: { life: 65, power: 62, shield: 60 },
        },
      },
    ];
    renderHook(() => useRoboAudio(value, undefined, true, 'run'));
    flush();
    expect(decodeURIComponent(tracks[0].src)).toContain(
      miniGame === 'done' ? ROBO_SOUNDS.goodJob : ROBO_SOUNDS.uhOh,
    );
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(tracks).toHaveLength(1);
  },
);
