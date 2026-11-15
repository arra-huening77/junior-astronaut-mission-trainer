/// <reference types="node" />
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import photos from './photos.json';
import moments from './realMoments.json';
import { getMediaCatalog, parseMediaCatalog } from './media-catalog';
import { createSol01Scene } from '../engine/scenes/sol01-touchdown';
import { createSol02Scene } from '../engine/scenes/sol02-first-night';
import { createSol03Scene } from '../engine/scenes/sol03-dust-warning';
import { createSol04Scene } from '../engine/scenes/sol04-ice-hunt';
import { createSol05Scene } from '../engine/scenes/sol05-calling-earth';
import { createSol06Scene } from '../engine/scenes/sol06-solar-encounter';
import { createSol07Scene } from '../engine/scenes/sol07-equipment-failure';
import { createSol08Scene } from '../engine/scenes/sol08-leak-or-meteors';
import { createSol09Scene } from '../engine/scenes/sol09-cold-night';
import { createSol10Scene } from '../engine/scenes/sol10-finale';

describe('runtime photo and real-moment catalog', () => {
  it('covers the existing card IDs in all thirteen authored versions', () => {
    const catalog = getMediaCatalog();
    const scenes = [
      createSol01Scene(),
      createSol02Scene(),
      createSol03Scene(),
      createSol04Scene(),
      createSol05Scene(),
      ...(['calm', 'active', 'stormy'] as const).map((level) =>
        createSol06Scene(level),
      ),
      createSol07Scene(),
      createSol08Scene(),
      createSol08Scene(['quickPatch']),
      createSol09Scene(),
      createSol10Scene(),
    ];
    expect(scenes).toHaveLength(13);
    for (const scene of scenes)
      for (const step of scene.steps) {
        if (step.type !== 'real_card') continue;
        expect(
          catalog.realMoments[step.realMomentId]?.eventId,
          step.realMomentId,
        ).toBe(scene.eventId);
      }
  });
  it('links every fact to the ledger and every photo to an actual JPEG', () => {
    const catalog = getMediaCatalog();
    const ledger = readFileSync(
      new URL('../../docs/facts.md', import.meta.url),
      'utf8',
    );
    for (const moment of Object.values(catalog.realMoments)) {
      for (const id of [
        moment.factId,
        ...Object.values(moment.variants ?? {}).map((v) => v.factId),
      ])
        expect(ledger).toContain(`**${id}**`);
    }
    for (const photo of Object.values(catalog.photos)) {
      const bytes = readFileSync(
        new URL(`../../public${photo.src}`, import.meta.url),
      );
      expect([...bytes.subarray(0, 3)]).toEqual([255, 216, 255]);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        photo.sha256,
      );
      expect(photo.caption + photo.altText).not.toMatch(/\[(?:DATA|CHECK)/);
    }
  });
  it('labels the lunar concept as an illustration and does not invent its capture date', () => {
    const photo = getMediaCatalog().photos['sol10-exploration-future'];
    expect(photo.imageType).toBe('illustration');
    expect(photo.savedLabel).toBe('Saved illustration');
    expect(photo.captureDate).toBeUndefined();
  });
  it('keeps the solar image separate from frozen mission observations', () => {
    const card = getMediaCatalog().realMoments.rm_solar_event;
    expect(Object.keys(card.variants!)).toEqual(['calm', 'active', 'stormy']);
    expect(card.contextNote).toContain('frozen mission snapshot');
    expect(card).not.toHaveProperty('observedAt');
  });
  it('rejects dangling references, invalid dates and incorrect media labels', () => {
    expect(() =>
      parseMediaCatalog(photos, {
        ...moments,
        rm_gale: { ...moments.rm_gale, photoId: 'missing' },
      }),
    ).toThrow();
    expect(() =>
      parseMediaCatalog(
        {
          ...photos,
          'sol1-gale-crater': {
            ...photos['sol1-gale-crater'],
            captureDate: '2026-02-30',
          },
        },
        moments,
      ),
    ).toThrow();
    expect(() =>
      parseMediaCatalog(
        {
          ...photos,
          'sol10-exploration-future': {
            ...photos['sol10-exploration-future'],
            savedLabel: 'Saved photo',
          },
        },
        moments,
      ),
    ).toThrow();
  });
});
