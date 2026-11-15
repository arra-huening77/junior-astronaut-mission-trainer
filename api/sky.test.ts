// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildSkyResponse } from './_lib/buildSkyResponse';
import {
  donkiWindowForQueryDate,
  fetchDonkiObservations,
} from './_lib/donkiClient';
import {
  clearDonkiCache,
  readDonkiCache,
  writeDonkiCache,
} from './_lib/skyCache';
import { handleSkyGet } from './_lib/handleSkyGet';
import { SkyApiError } from './_lib/skyErrors';

describe('donkiWindowForQueryDate', () => {
  it('covers seven UTC days ending on the query date', () => {
    const window = donkiWindowForQueryDate('2026-11-14');
    expect(window.windowEnd).toBe('2026-11-14');
    expect(window.windowStart).toBe('2026-11-07');
  });
});

describe('buildSkyResponse', () => {
  it('returns calm with null event when DONKI lists are empty (successful classification)', () => {
    const window = donkiWindowForQueryDate('2026-11-14');
    const body = buildSkyResponse(
      '2026-11-14',
      window,
      { flares: [], cmes: [], seps: [] },
      'live',
      '2026-11-14T00:00:00.000Z',
    );
    expect(body.level).toBe('calm');
    expect(body.event).toBeNull();
    expect(body.source).toBe('live');
    expect(body.windowStart).toBe(window.windowStart);
  });

  it('maps a qualifying flare into SkyEvent metadata', () => {
    const window = donkiWindowForQueryDate('2026-11-14');
    const body = buildSkyResponse(
      '2026-11-14',
      window,
      {
        flares: [
          {
            flrID: 'flare-1',
            classType: 'X1.0',
            peakTime: '2026-11-10T12:00Z',
            link: 'https://api.nasa.gov/DONKI/view/FLR/1',
          },
        ],
        cmes: [],
        seps: [],
      },
      'live',
      '2026-11-14T01:00:00.000Z',
    );
    expect(body.level).toBe('stormy');
    expect(body.event).toMatchObject({
      id: 'flare-1',
      type: 'FLR',
      observedAt: '2026-11-10T12:00Z',
      classType: 'X1.0',
    });
  });
});

describe('handleSkyGet', () => {
  const originalKey = process.env.NASA_API_KEY;

  beforeEach(() => {
    clearDonkiCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.NASA_API_KEY;
    else process.env.NASA_API_KEY = originalKey;
  });

  it('rejects invalid date without calling NASA', async () => {
    const result = await handleSkyGet({ date: 'not-a-date' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.body.error).toBe('invalid_date');
    }
  });

  it('returns config_missing when NASA_API_KEY is absent', async () => {
    delete process.env.NASA_API_KEY;
    const result = await handleSkyGet({ date: '2026-11-14' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(503);
      expect(result.body.error).toBe('config_missing');
    }
  });

  it('returns live SkyResponse when NASA returns valid JSON arrays', async () => {
    process.env.NASA_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      }),
    );

    const result = await handleSkyGet({ date: '2026-11-14' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body.source).toBe('live');
      expect(result.body.level).toBe('calm');
      expect(result.body.date).toBe('2026-11-14');
    }
    expect(vi.mocked(fetch)).toHaveBeenCalled();
  });

  it('serves cache within TTL without a second NASA fetch', async () => {
    process.env.NASA_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
    vi.stubGlobal('fetch', fetchMock);

    await handleSkyGet({ date: '2026-11-14' });
    const result = await handleSkyGet({ date: '2026-11-14' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.body.source).toBe('cache');
  });

  it('maps NASA rate limiting to rate_limited', async () => {
    process.env.NASA_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({}),
      }),
    );

    const result = await handleSkyGet({ date: '2026-11-14' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
      expect(result.body.error).toBe('rate_limited');
    }
  });

  it('maps malformed JSON list to malformed_response', async () => {
    process.env.NASA_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ not: 'an array' }),
      }),
    );

    const result = await handleSkyGet({ date: '2026-11-14' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.body.error).toBe('malformed_response');
  });
});

describe('fetchDonkiObservations timeout', () => {
  it('maps overall abort to nasa_timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      }),
    );

    await expect(
      fetchDonkiObservations(
        { windowStart: '2026-11-01', windowEnd: '2026-11-14' },
        'test-key',
        25,
      ),
    ).rejects.toMatchObject({ code: 'nasa_timeout', httpStatus: 504 });
  });
});

describe('fetchDonkiObservations', () => {
  it('throws when NASA returns a non-array body', async () => {
    process.env.NASA_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => null,
      }),
    );

    await expect(
      fetchDonkiObservations(
        { windowStart: '2026-11-01', windowEnd: '2026-11-14' },
        'test-key',
        1000,
      ),
    ).rejects.toBeInstanceOf(SkyApiError);
  });
});

describe('skyCache', () => {
  it('expires entries after TTL', () => {
    clearDonkiCache();
    const key = 'a:b';
    writeDonkiCache(key, { flares: [] }, 0);
    const entry = readDonkiCache(key, 60 * 60 * 1000 + 1);
    expect(entry).toBeUndefined();
  });
});
