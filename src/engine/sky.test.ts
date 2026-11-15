import { describe, expect, it } from 'vitest';

import {
  FAST_CME_SPEED_KM_S,
  SkyClassificationError,
  classifySkyFromDonki,
  classifySkyLevel,
  validateDonkiObservationSet,
} from './sky';

const validEmpty = {
  flares: [] as unknown[],
  cmes: [] as unknown[],
  seps: [] as unknown[],
};

describe('validateDonkiObservationSet', () => {
  it('requires all three DONKI arrays', () => {
    expect(validateDonkiObservationSet({})).toBe('missing_channels');
    expect(validateDonkiObservationSet({ flares: [] })).toBe(
      'missing_channels',
    );
  });

  it('rejects non-array channels', () => {
    expect(
      validateDonkiObservationSet({ flares: [], cmes: {}, seps: [] }),
    ).toBe('invalid_shape');
  });
});

describe('classifySkyFromDonki', () => {
  it('classifies X-class flare as stormy with metadata', () => {
    const result = classifySkyFromDonki({
      ...validEmpty,
      flares: [
        {
          flrID: '2024-01-01T12:00:00-FLR-001',
          classType: 'X2.1',
          peakTime: '2024-01-01T12:05Z',
          link: 'https://api.nasa.gov/DONKI/FLR/1',
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.level).toBe('stormy');
    expect(result.primaryEvent?.observationType).toBe('FLR');
    expect(result.qualifyingEvents).toHaveLength(1);
  });

  it('classifies M-class flare as active', () => {
    const result = classifySkyFromDonki({
      ...validEmpty,
      flares: [{ classType: 'M3.4', peakTime: '2024-02-02T08:00Z' }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.level).toBe('active');
  });

  it('classifies energetic particle (SEP) event as stormy', () => {
    const result = classifySkyFromDonki({
      ...validEmpty,
      seps: [
        {
          sepID: '2024-03-03T00:00:00-SEP-001',
          eventTime: '2024-03-03T14:22Z',
          instruments: [{ displayName: 'ACE/EPAM' }],
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.level).toBe('stormy');
  });

  it('classifies fast CME as active', () => {
    const result = classifySkyFromDonki({
      ...validEmpty,
      cmes: [
        {
          speed: FAST_CME_SPEED_KM_S + 250,
          time21_5: '2024-04-04T10:00Z',
          link: 'https://x',
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.level).toBe('active');
  });

  it('returns calm when valid data has no qualifying events', () => {
    const result = classifySkyFromDonki({
      flares: [{ classType: 'C1.0', peakTime: '2024-05-01T00:00Z' }],
      cmes: [
        { speed: FAST_CME_SPEED_KM_S - 100, time21_5: '2024-05-02T00:00Z' },
      ],
      seps: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.level).toBe('calm');
    expect(result.primaryEvent).toBeUndefined();
    expect(result.qualifyingEvents).toHaveLength(0);
  });

  it('returns calm for an empty valid observation window', () => {
    const result = classifySkyFromDonki(validEmpty);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.level).toBe('calm');
  });

  it('does not return calm for missing channels', () => {
    const result = classifySkyFromDonki({});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('missing_channels');
  });

  it('does not return calm for invalid channel shapes', () => {
    const result = classifySkyFromDonki({ flares: [], cmes: 'bad', seps: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('invalid_shape');
  });

  it('skips malformed array entries without throwing when channels are valid', () => {
    const result = classifySkyFromDonki({
      flares: [null, 42, 'invalid', {}, { classType: '' }],
      cmes: [],
      seps: [[]],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.level).toBe('calm');
  });

  it('picks the highest severity when multiple observations differ', () => {
    const result = classifySkyFromDonki({
      flares: [{ classType: 'M1.0', peakTime: '2024-06-01T00:00Z' }],
      cmes: [
        { speed: FAST_CME_SPEED_KM_S + 50, time21_5: '2024-06-02T00:00Z' },
      ],
      seps: [{ sepID: 'sep-1', eventTime: '2024-06-03T12:00Z' }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.level).toBe('stormy');
    expect(result.qualifyingEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('deduplicates identical qualifying records', () => {
    const flare = {
      flrID: 'dup',
      classType: 'M1.0',
      peakTime: '2024-07-01T00:00Z',
    };
    const result = classifySkyFromDonki({
      flares: [flare, { ...flare }],
      cmes: [],
      seps: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.qualifyingEvents).toHaveLength(1);
  });

  it('does not treat fictional game payloads as NASA observations', () => {
    const result = classifySkyFromDonki({
      flares: [{ id: 'dust_storm', eventId: 'dust_storm', severity: 'high' }],
      cmes: [],
      seps: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.level).toBe('calm');
  });
});

describe('classifySkyLevel', () => {
  it('returns SkyLevel for valid input', () => {
    expect(classifySkyLevel(validEmpty)).toBe('calm');
  });

  it('throws for unavailable input instead of calm', () => {
    expect(() => classifySkyLevel({})).toThrow(SkyClassificationError);
  });
});
