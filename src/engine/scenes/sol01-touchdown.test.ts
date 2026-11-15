import { describe, expect, it } from 'vitest';
import story from '../../content/story.json';
import { createSol01Scene } from './sol01-touchdown';
import { validateScene } from '../scene-registry';
import { getEventRules } from '../rules';

describe('approved Sol 1 timeline', () => {
  it('has valid fixed routing and a real text entry for every authored line', () => {
    const scene = createSol01Scene(['solar_extra']);
    expect(() => validateScene(scene)).not.toThrow();
    const keys = scene.steps.flatMap((step) =>
      'textKey' in step
        ? [step.textKey]
        : 'questionKey' in step
          ? [step.questionKey]
          : [],
    );
    keys.push(
      ...getEventRules('touchdown').choices.flatMap((c) => [
        c.labelKey,
        c.afterKey,
      ]),
    );
    for (const key of keys) {
      expect(story).toHaveProperty(key);
      expect((story as Record<string, string>)[key]).not.toMatch(
        /\[(CHECK|DATA)/,
      );
    }
  });
  it('selects at most one applicable cargo callback without changing choice rules', () => {
    for (const cargo of [
      [],
      ['solar_extra'],
      ['water_recycler'],
      ['greenhouse_kit'],
      ['solar_extra', 'water_recycler'],
    ] as const) {
      const scene = createSol01Scene(cargo);
      expect(() => validateScene(scene)).not.toThrow();
      const callbacks = scene.steps.filter((s) =>
        s.id.startsWith('touchdown.cargo.'),
      );
      expect(callbacks.length).toBe(cargo.length ? 1 : 0);
      expect(scene.steps.filter((s) => s.type === 'choice')).toHaveLength(1);
    }
  });
});
