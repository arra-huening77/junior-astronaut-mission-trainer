// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  assertArchiveLevelsMatchClassifier,
  getBundledDonkiArchive,
  parseDonkiArchiveFile,
} from './donkiArchive';
import {
  pickArchivedResponse,
  registerDonkiArchive,
  resetSkyServiceState,
} from '../services/sky';

describe('donkiArchive.json', () => {
  it('parses structure and matches DonkiArchiveFile contract', () => {
    const archive = getBundledDonkiArchive();
    expect(archive.events.length).toBeGreaterThanOrEqual(10);
    expect(archive.events.length).toBeLessThanOrEqual(15);
    for (const entry of archive.events) {
      expect(entry.id).toMatch(/^(FLR|CME|SEP|\d{4}-\d{2}-\d{2}T)/);
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      if (entry.type === 'FLR') {
        expect(entry.classType).toBeDefined();
      }
      if (entry.type === 'CME') {
        expect(entry.classType).toMatch(/km\/s/i);
      }
    }
  });

  it('rejects invented or malformed archive payloads', () => {
    expect(() => parseDonkiArchiveFile({ events: [] })).toThrow();
    expect(() =>
      parseDonkiArchiveFile({
        events: [{ id: 'x', type: 'FLR', level: 'bogus' }],
      }),
    ).toThrow();
  });

  it('validates each event level against NASA classification rules', () => {
    assertArchiveLevelsMatchClassifier(getBundledDonkiArchive());
  });
});

describe('donkiArchive registration', () => {
  it('registers bundled archive and picks events with a stable date hash', () => {
    resetSkyServiceState();
    registerDonkiArchive(getBundledDonkiArchive());

    const first = pickArchivedResponse(
      '2026-11-14',
      Date.parse('2026-11-14T12:00:00.000Z'),
    );
    const second = pickArchivedResponse(
      '2026-11-14',
      Date.parse('2026-11-14T18:00:00.000Z'),
    );
    expect(first?.event?.id).toBe(second?.event?.id);
    expect(first?.source).toBe('saved');
    expect(first?.event?.sourceUrl).toMatch(/^https:\/\//);
  });
});
