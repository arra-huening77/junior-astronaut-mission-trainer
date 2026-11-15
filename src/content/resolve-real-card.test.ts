import { describe, expect, it } from 'vitest';
import {
  resolveAlbumCards,
  resolveAllRealCards,
  resolveRealCard,
} from './resolve-real-card';

describe('resolveRealCard', () => {
  it('resolves Sol 1 Gale card with bundled photo metadata', () => {
    const card = resolveRealCard('rm_gale');
    expect(card).toMatchObject({
      id: 'rm_gale',
      eventId: 'touchdown',
      title: 'Gale Crater',
      savedLabel: 'Saved photo',
      imageType: 'photo',
      photoSrc: '/assets/photos/sol1-gale-crater.jpg',
      photoCredit: 'NASA/JPL-Caltech/MSSS',
    });
    expect(card?.fact).toContain('154 km');
    expect(card?.photoAlt.length).toBeGreaterThan(10);
  });

  it('labels the Artemis card as a saved illustration', () => {
    const card = resolveRealCard('rm_artemis');
    expect(card?.savedLabel).toBe('Saved illustration');
    expect(card?.imageType).toBe('illustration');
  });

  it('swaps solar supporting facts by frozen sky level', () => {
    const calm = resolveRealCard('rm_solar_event', { skyLevel: 'calm' });
    const stormy = resolveRealCard('rm_solar_event', { skyLevel: 'stormy' });
    expect(calm?.fact).toContain('watch the Sun');
    expect(stormy?.fact).toContain('radiation');
  });

  it('resolves album IDs and the full catalog', () => {
    expect(resolveAlbumCards(['rm_gale', 'missing']).map((c) => c.id)).toEqual([
      'rm_gale',
    ]);
    expect(resolveAllRealCards().length).toBeGreaterThanOrEqual(11);
  });
});
