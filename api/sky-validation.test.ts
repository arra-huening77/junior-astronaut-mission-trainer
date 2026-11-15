// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseQueryDate } from './_lib/donkiClient';
import { isObservationTimestamp } from '../src/engine/observation-time';

describe('NASA boundary dates', () => {
  it.each(['2026-02-30', '2025-02-29', '2026-13-01', '2026-00-10'])(
    'rejects impossible calendar date %s',
    (date) => {
      expect(() => parseQueryDate(date)).toThrow();
    },
  );
  it('accepts actual leap days', () => {
    expect(parseQueryDate('2024-02-29')).toBe('2024-02-29');
  });
  it.each([
    '2026-11-14T12:00Z',
    '2026-11-14T12:00:00.000Z',
    '2026-11-14T12:00:00+06:30',
  ])('accepts timestamp %s', (timestamp) => {
    expect(isObservationTimestamp(timestamp)).toBe(true);
  });
  it.each([
    '2026-02-30T12:00Z',
    '2026-11-14T24:00Z',
    '2026-11-14T12:60Z',
    '2026-11-14T12:00',
    'yesterday',
  ])('rejects timestamp %s', (timestamp) => {
    expect(isObservationTimestamp(timestamp)).toBe(false);
  });
});
