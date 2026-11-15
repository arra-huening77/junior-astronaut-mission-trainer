import { describe, expect, it } from 'vitest';
import { createMission } from '../engine/state';
import { resolveMissionScene } from '../engine/mission';
import type { ScenePlayback } from '../engine/scene-player';
import type { GameState, HistoryEntry, Sol } from '../engine/types';
import { MISSION_SPOTS, OUTPOST_PATH_START } from './components/outpostLayout';
import { scenePresentation } from './mission-presentation';

function game(sol: Sol, history: HistoryEntry[]): GameState {
  return {
    ...createMission({
      missionDate: '2026-11-15',
      contentVersion: 'sol1-v1',
      sky: {
        level: 'calm',
        source: 'saved',
        fetchedAt: '2026-11-15T00:00:00Z',
      },
    }),
    sol,
    phase: 'BRIEFING',
    history,
  };
}

function entry(sol: Sol, eventId: HistoryEntry['eventId']): HistoryEntry {
  return {
    sol,
    eventId,
    choiceId: 'A',
    meters: { life: 80, power: 80, shield: 80 },
  };
}

function position(state: GameState, stepId?: string) {
  const scene = resolveMissionScene(state);
  const playback: ScenePlayback = {
    game: state,
    cursor: { eventId: scene.eventId, stepId: stepId ?? scene.entryStepId },
    visit: 1,
    status: 'playing',
  };
  return scenePresentation(scene, playback).commander;
}

const habitat = {
  x: MISSION_SPOTS.habitat.stand[0],
  y: MISSION_SPOTS.habitat.stand[1],
};
const solar = {
  x: MISSION_SPOTS.solar.stand[0],
  y: MISSION_SPOTS.solar.stand[1],
};
const firstSols = [entry(1, 'touchdown'), entry(2, 'first_night')];

describe('commander position between sols', () => {
  it('starts a new mission on the lane', () => {
    expect(position(game(1, []))).toEqual(OUTPOST_PATH_START);
  });

  it('keeps the habitat position on Sol 2, including restored state', () => {
    const saved = JSON.parse(
      JSON.stringify(game(2, firstSols.slice(0, 1))),
    ) as GameState;
    expect(position(saved)).toEqual(habitat);
    expect(position(saved, 'first_night.choice')).toEqual(habitat);
  });

  it('carries the position across a sol without walking and waits for the next click', () => {
    const state = game(3, firstSols);
    expect(position(state)).toEqual(habitat);
    expect(
      position({ ...state, phase: 'WALK_SELECT' }, 'dust_storm.walk'),
    ).toEqual(habitat);
  });

  it('moves to the new destination once walking starts', () => {
    expect(
      position({ ...game(3, firstSols), phase: 'WALKING' }, 'dust_storm.walk'),
    ).toEqual(solar);
  });

  it('starts the following sol at the most recent walking destination', () => {
    expect(position(game(4, [...firstSols, entry(3, 'dust_storm')]))).toEqual(
      solar,
    );
  });
});
