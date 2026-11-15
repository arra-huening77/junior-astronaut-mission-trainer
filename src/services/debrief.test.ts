// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DebriefRequest } from '../engine/contracts';
import {
  DEBRIEF_DISPLAY_DEADLINE_MS,
  DEBRIEF_LABEL_AI,
  DEBRIEF_LABEL_TEMPLATE,
  applyLateDebriefIfAllowed,
  debriefSessionKey,
  fetchDebriefForMission,
  getFrozenDebrief,
  parseDebriefResponse,
  registerDebriefTemplates,
  resetDebriefServiceState,
} from './debrief';

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

const goodAiText =
  'You covered the panels during the dust storm and saved some power. That helped the crew stay ready for the next sol. Next time, try a different cargo plan and see how it changes your choices.';

const memoryStorage = (): Storage => {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
};

describe('parseDebriefResponse', () => {
  it('accepts valid debrief wire payloads', () => {
    expect(
      parseDebriefResponse({ source: 'ai', text: goodAiText })?.source,
    ).toBe('ai');
  });

  it('rejects malformed bodies', () => {
    expect(parseDebriefResponse({ source: 'robot' })).toBeNull();
  });
});

describe('fetchDebriefForMission', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetDebriefServiceState();
    registerDebriefTemplates({
      choiceObservations: {
        '3_dust_storm_A':
          'You covered the panels during the dust storm to protect solar power.',
      },
      endings: {
        success:
          'You kept the outpost running through ten sols until the supply ship arrived.',
        gentle: {
          life: 'Life Support ran out, so the crew moved into the shelter to wait safely.',
          power:
            'Stored power ran out, so the crew waited safely in the shelter.',
          shield:
            'Protection ran too low, so the crew moved into the shelter to stay safe.',
        },
      },
      hints: {
        life: 'Next time, check how each choice affects air and water before sending the crew onward.',
        power:
          'Next time, compare repair and heating costs and plan which power supplies to bring.',
        shield:
          'Next time, compare shielding and shelter choices before continuing research during the solar encounter.',
        success:
          'On another mission, try a different cargo plan and explore how its tradeoffs change your choices.',
      },
      generic: {
        observation:
          "You made choices about the outpost's supplies and saw how each decision changed the mission.",
      },
    });
    vi.stubGlobal('window', { localStorage: memoryStorage() });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows validated AI text within the 3-second deadline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ source: 'ai', text: goodAiText }),
      }),
    );

    const pending = fetchDebriefForMission({
      payload: validPayload,
      displayDeadlineMs: 3_000,
    });
    await vi.advanceTimersByTimeAsync(50);
    const result = await pending;

    expect(result.source).toBe('ai');
    expect(result.label).toBe(DEBRIEF_LABEL_AI);
    expect(result.text).toBe(goodAiText);
  });

  it('falls back to the local template when the API is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
    );

    const pending = fetchDebriefForMission({ payload: validPayload });
    await vi.advanceTimersByTimeAsync(10);
    const result = await pending;

    expect(result.source).toBe('template');
    expect(result.label).toBe(DEBRIEF_LABEL_TEMPLATE);
    expect(result.text).toContain(
      'You covered the panels during the dust storm',
    );
  });

  it('uses the local template when the display deadline expires', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => fetchPromise),
    );

    const pending = fetchDebriefForMission({
      payload: validPayload,
      displayDeadlineMs: 3_000,
    });
    await vi.advanceTimersByTimeAsync(DEBRIEF_DISPLAY_DEADLINE_MS);
    const result = await pending;

    expect(result.source).toBe('template');
    resolveFetch({
      ok: true,
      status: 200,
      json: async () => ({ source: 'ai', text: goodAiText }),
    });
    await vi.runAllTimersAsync();

    const sessionKey = debriefSessionKey(validPayload);
    expect(getFrozenDebrief(sessionKey)?.source).toBe('template');
    expect(
      applyLateDebriefIfAllowed(sessionKey, { source: 'ai', text: goodAiText }),
    ).toBe(false);
  });

  it('rejects malformed AI output and uses the local template immediately', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          source: 'ai',
          text: 'http://evil.test Bad one liner',
        }),
      }),
    );

    const pending = fetchDebriefForMission({ payload: validPayload });
    await vi.advanceTimersByTimeAsync(20);
    const result = await pending;

    expect(result.source).toBe('template');
    expect(result.label).toBe(DEBRIEF_LABEL_TEMPLATE);
  });

  it('never replaces a frozen template with a late AI response', async () => {
    const sessionKey = debriefSessionKey(validPayload);
    resetDebriefServiceState();
    registerDebriefTemplates({
      choiceObservations: { '3_dust_storm_A': 'Observed dust choice.' },
      endings: {
        success: 'Success ending.',
        gentle: { life: 'L', power: 'P', shield: 'S' },
      },
      hints: {
        life: 'H1',
        power: 'H2',
        shield: 'H3',
        success: 'H4',
      },
      generic: { observation: 'Generic.' },
    });

    const pending = fetchDebriefForMission({
      payload: validPayload,
      displayDeadlineMs: 3_000,
    });
    await vi.advanceTimersByTimeAsync(DEBRIEF_DISPLAY_DEADLINE_MS);
    const shown = await pending;
    expect(shown.source).toBe('template');

    expect(
      applyLateDebriefIfAllowed(sessionKey, { source: 'ai', text: goodAiText }),
    ).toBe(false);
    expect(getFrozenDebrief(sessionKey)?.text).toBe(shown.text);
  });
});
