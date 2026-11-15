import { describe, expect, it } from 'vitest';
import { createMission } from './state';
import { launchMission, beginNextSol } from './resources';
import { resolveMissionScene, missionRegistry } from './mission';
import {
  startScene,
  sendSceneInput,
  sceneView,
  stampSceneInput,
  resumeScene,
} from './scene-player';
import {
  resolveText,
  resolveRealCard,
  resolveAlbum,
} from '../content/mission-content';
import { createSaveEnvelope } from '../services/storage';
import { choiceDrains, debriefPayload } from './mission-evidence';
import {
  parseDebriefRequest,
  assertPayloadSize,
} from '../../api/_lib/debriefValidate';
import type { ChoiceId, SkyLevel } from './types';

function mission(level: SkyLevel) {
  return launchMission(
    createMission({
      missionDate: '2026-11-14',
      contentVersion: 'sol1-v1',
      sky: { level, source: 'saved', fetchedAt: '2026-11-14T00:00:00Z' },
    }),
    ['solar_extra', 'batteries', 'greenhouse_kit', 'water_recycler'],
  );
}
export function playMission(
  level: SkyLevel,
  repair: ChoiceId,
  mini: 'done' | 'skipped',
  classroom: boolean,
) {
  let game = mission(level),
    pauses = 0;
  const options = {
    miniGames: true,
    classroomMode: classroom,
    reduceMotion: true,
  };
  const events: string[] = [],
    games: string[] = [];
  for (let sol = 1; sol <= 10; sol++) {
    const scene = resolveMissionScene(game);
    events.push(scene.eventId);
    let t = startScene(scene, game, options);
    for (
      let guard = 0;
      guard < 100 && t.playback.status === 'playing';
      guard++
    ) {
      const view = sceneView(scene, t.playback)!;
      const step = view.step;
      if (view.textKey)
        expect(resolveText(view.textKey)).not.toMatch(/\[(DATA|CHECK)/);
      if (step.type === 'classroom_pause') {
        pauses++;
        expect(resolveText(step.questionKey)).toBeTruthy();
      }
      if (step.type === 'real_card')
        expect(
          resolveRealCard(step.realMomentId, t.playback.game).photoSrc,
        ).toMatch(/^\/assets\/photos\//);
      let input;
      if (step.type === 'walk')
        input = {
          type: 'select_spot' as const,
          stepId: step.id,
          spotId: step.target,
        };
      else if (step.type === 'mini_game') {
        games.push(step.gameId);
        input = {
          type: 'mini_game_result' as const,
          stepId: step.id,
          result: mini,
        };
      } else if (step.type === 'choice') {
        for (const choice of view.choices!)
          expect(resolveText(choice.labelKey)).toBeTruthy();
        input = {
          type: 'choose' as const,
          stepId: step.id,
          choiceId:
            sol === 7 ? repair : sol === 2 ? ('B' as const) : ('A' as const),
        };
      } else input = { type: 'advance' as const, stepId: step.id };
      const next = sendSceneInput(
        scene,
        t.playback,
        stampSceneInput(t.playback, input),
        options,
      );
      expect(next.playback).not.toBe(t.playback);
      t = next;
    }
    game = t.playback.game;
    expect(game.history).toHaveLength(sol);
    // Night restore must not apply any cost again or refetch a different variant.
    const save = createSaveEnvelope({
      runId: 'test-run',
      state: game,
      cursor: t.playback.cursor,
      checkpoint: game.ending ? 'ending' : 'night',
      savedAt: '2026-11-14T01:00:00Z',
    });
    const restored = resumeScene(scene, save, options);
    expect(restored.playback.game).toEqual(game);
    expect(restored.playback.status).toBe(sol === 10 ? 'ended' : 'complete');
    if (sol < 10) {
      expect(game.ending).toBeUndefined();
      game = beginNextSol(game);
    }
  }
  expect(game.ending).toBe('success');
  expect(game.albumIds).toHaveLength(10);
  expect(pauses).toBe(classroom ? 10 : 0);
  return { game, events, games };
}
describe('complete fixed mission integration', () => {
  for (const level of ['calm', 'active', 'stormy'] as const)
    for (const repair of ['A', 'B'] as const)
      for (const mini of ['done', 'skipped'] as const)
        for (const classroom of [false, true]) {
          it(`${level}, repair ${repair}, tasks ${mini}, classroom ${classroom}`, () => {
            const { game, events, games } = playMission(
              level,
              repair,
              mini,
              classroom,
            );
            expect(events).toEqual([
              'touchdown',
              'first_night',
              'dust_storm',
              'ice_hunt',
              'calling_earth',
              'solar_storm',
              'equipment_failure',
              repair === 'B' ? 'leak' : 'meteors',
              'cold_night',
              'finale',
            ]);
            expect(games).toContain(
              repair === 'B' ? 'patch_leak' : 'repair_wires',
            );
            expect(game.sky?.level).toBe(level);
            expect(resolveAlbum(game).at(-1)?.mediaLabel).toBe(
              'Saved illustration',
            );
            const payload = debriefPayload(game);
            expect(() => parseDebriefRequest(payload)).not.toThrow();
            expect(() => assertPayloadSize(payload)).not.toThrow();
          });
        }
  it('validates all thirteen versions against their real text and photos', () => {
    const base = mission('calm');
    for (const level of ['calm', 'active', 'stormy'] as const)
      for (const flags of [[], ['quickPatch']] as const)
        for (let sol = 1; sol <= 10; sol++) {
          const state = {
            ...base,
            sol: sol as typeof base.sol,
            solarVariant: level,
            flags: [...flags],
          };
          const scene = missionRegistry(state).resolve(state);
          for (const step of scene.steps) {
            if ('textKey' in step)
              expect(() => resolveText(step.textKey)).not.toThrow();
            if ('questionKey' in step)
              expect(() => resolveText(step.questionKey)).not.toThrow();
            if (step.type === 'real_card')
              expect(() =>
                resolveRealCard(step.realMomentId, state),
              ).not.toThrow();
          }
        }
  });
  it('uses actual choice costs rather than attributing initial meters or night costs to choices', () => {
    const { game } = playMission('active', 'A', 'skipped', false);
    const first = choiceDrains(game).filter((d) => d.sol === 1);
    expect(first).toEqual([
      {
        sol: 1,
        eventId: 'touchdown',
        choiceId: 'A',
        meter: 'power',
        amount: 5,
      },
    ]);
  });
});
