import { describe, expect, it } from 'vitest';
import { DEFAULT_CUE_PRESENTATION, foldCues } from './cues';
import { alertForMood } from './eventAlert';
import { primaryMeterWarning } from './meterWarnings';

describe('cue presentation', () => {
  it('maps mood cues to sky and tint classes', () => {
    const next = foldCues(
      [
        {
          type: 'mood',
          mood: 'cold_night',
          stepId: 'cold.mood',
          eventId: 'cold_night',
        },
      ],
      DEFAULT_CUE_PRESENTATION,
    );
    expect(next).toMatchObject({
      mood: 'cold_night',
      sky: 'night',
      frost: true,
      tintClassName: 'ui-mood--cold',
    });
  });
});

describe('event alerts', () => {
  it('builds dust storm alert copy', () => {
    expect(alertForMood('dust_storm')).toMatchObject({
      title: 'DUST STORM ALERT!',
      tone: 'dust',
    });
  });

  it('skips calm moods', () => {
    expect(alertForMood('calm_day')).toBeNull();
    expect(alertForMood('golden_dawn')).toBeNull();
    expect(alertForMood(null)).toBeNull();
  });
});

describe('meter warnings', () => {
  it('prefers empty over low', () => {
    const warning = primaryMeterWarning({ life: 25, power: 0, shield: 60 });
    expect(warning).toMatchObject({ id: 'power', zone: 'empty' });
  });

  it('returns null when all meters are healthy', () => {
    expect(primaryMeterWarning({ life: 80, power: 70, shield: 60 })).toBeNull();
  });
});
