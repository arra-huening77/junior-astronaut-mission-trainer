// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { callGeminiDebrief } from './_lib/debriefGemini';
import { clearDebriefDedupe } from './_lib/debriefDedupe';
import { DebriefApiError } from './_lib/debriefErrors';
import { validateDebriefOutput } from './_lib/debriefOutput';
import { clearDebriefRateLimits } from './_lib/debriefRateLimit';
import { parseDebriefRequest } from './_lib/debriefValidate';
import { handleDebriefPost } from './_lib/handleDebriefPost';
import type { DebriefRequest } from '../src/engine/contracts';

const validPayload: DebriefRequest = {
  ending: 'success',
  failedMeter: null,
  skyLevel: 'active',
  cargo: ['spare_parts', 'batteries'],
  history: [
    {
      sol: 3,
      event: 'dust_storm',
      choice: 'A',
      miniGame: 'done',
      meters: { life: 71, power: 52, shield: 60 },
    },
  ],
  topDrains: [{ sol: 7, meter: 'power', amount: -15 }],
  facts: ['Dust storms can block sunlight and cut solar power.'],
};

const goodDebrief =
  'You covered the panels during the dust storm and saved some power. That helped the crew stay ready for the next sol. Next time, try a different cargo plan and see how it changes your choices.';

describe('parseDebriefRequest', () => {
  it('rejects arbitrary free-text fields', () => {
    expect(() =>
      parseDebriefRequest({ ...validPayload, player: 'Alex' }),
    ).toThrow(DebriefApiError);
  });

  it('rejects unknown event ids', () => {
    expect(() =>
      parseDebriefRequest({
        ...validPayload,
        history: [{ ...validPayload.history[0], event: 'invalid_event' }],
      }),
    ).toThrow(DebriefApiError);
  });
});

describe('validateDebriefOutput', () => {
  it('accepts valid child-friendly output', () => {
    const result = validateDebriefOutput(goodDebrief);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.text).toBe(goodDebrief);
  });

  it('rejects links and overly long output', () => {
    expect(
      validateDebriefOutput('http://bad.test. Now two short lines here?'),
    ).toMatchObject({
      ok: false,
    });
    expect(validateDebriefOutput(`${'word '.repeat(61)}A. B?`)).toMatchObject({
      ok: false,
    });
  });
});

describe('handleDebriefPost', () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  beforeEach(() => {
    clearDebriefDedupe();
    clearDebriefRateLimits();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
  });

  it('returns config error when Gemini env is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
    const result = await handleDebriefPost(validPayload, 'test-client', {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(503);
      expect(result.body.error).toBe('config_missing');
    }
  });

  it('rejects invalid payload', async () => {
    process.env.GEMINI_API_KEY = 'k';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    const result = await handleDebriefPost({ ending: 'win' }, 'client', {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.body.error).toBe('invalid_payload');
  });

  it('returns AI debrief on successful Gemini response', async () => {
    process.env.GEMINI_API_KEY = 'k';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: goodDebrief }] } }],
        }),
      }),
    );

    const result = await handleDebriefPost(validPayload, 'client', {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body.source).toBe('ai');
      expect(result.body.text).toBe(goodDebrief);
    }
  });

  it('returns template when output fails validation', async () => {
    process.env.GEMINI_API_KEY = 'k';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    const withLink =
      'You picked plan A and saved power. The crew stayed ready. See https://example.test for more.';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: withLink }] } }],
        }),
      }),
    );

    const result = await handleDebriefPost(validPayload, 'client', {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body.source).toBe('template');
      expect(result.body.text).toBe('');
    }
  });

  it('returns template on provider errors', async () => {
    process.env.GEMINI_API_KEY = 'k';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );

    const result = await handleDebriefPost(validPayload, 'client', {});
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.body.source).toBe('template');
  });

  it('deduplicates identical payloads within TTL', async () => {
    process.env.GEMINI_API_KEY = 'k';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: goodDebrief }] } }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await handleDebriefPost(validPayload, 'client-a', {});
    await handleDebriefPost(validPayload, 'client-b', {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('callGeminiDebrief timeout', () => {
  it('aborts slow provider calls', async () => {
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
      callGeminiDebrief(validPayload, 'key', 'gemini-2.0-flash', 25, fetch),
    ).rejects.toMatchObject({ code: 'debrief_unavailable', httpStatus: 504 });
  });
});
