import { describe, expect, it } from 'vitest';
import { createMission } from '../engine/state';
import { launchMission } from '../engine/resources';
import { validateScene } from '../engine/scene-registry';
import { buildSceneForState, missionTextLookup } from './mission-timeline';

function launched() {
  return launchMission(
    createMission({
      missionDate: '2026-11-14',
      contentVersion: 'mission-v1',
      sky: {
        level: 'active',
        source: 'saved',
        fetchedAt: '2026-11-14T00:00:00Z',
      },
    }),
    [],
  );
}

describe('mission timeline', () => {
  it('builds a valid Sol 1 scene and resolves Sol 2 copy', () => {
    const scene = buildSceneForState(launched());
    expect(scene.eventId).toBe('touchdown');
    expect(() => validateScene(scene)).not.toThrow();
    expect(missionTextLookup('first_night.narration.1')).toMatch(/Sun is going down/);
  });

  it('builds solar variant scenes from frozen sky level', () => {
    const state = launched();
    state.sol = 6;
    state.schedule[5] = 'solar_storm';
    const scene = buildSceneForState(state);
    expect(scene.eventId).toBe('solar_storm');
    expect(scene.variant).toBe('active');
    expect(() => validateScene(scene)).not.toThrow();
  });
});
