import type { DebriefResponse } from '../../src/engine/contracts';

import { callGeminiDebrief, requireGeminiConfig } from './debriefGemini';
import { DebriefApiError } from './debriefErrors';
import {
  fingerprintDebriefRequest,
  readDedupedDebrief,
  writeDedupedDebrief,
} from './debriefDedupe';
import {
  aiDebriefResponse,
  templateDebriefResponse,
  validateDebriefOutput,
} from './debriefOutput';
import { checkDebriefRateLimit } from './debriefRateLimit';
import { assertPayloadSize, parseDebriefRequest } from './debriefValidate';

export interface DebriefPostSuccess {
  ok: true;
  status: number;
  body: DebriefResponse;
}

export interface DebriefPostFailure {
  ok: false;
  status: number;
  body: { error: string; message?: string };
}

export type DebriefPostResult = DebriefPostSuccess | DebriefPostFailure;

const isProduction = (): boolean =>
  (process.env.VERCEL_ENV ?? process.env.NODE_ENV) === 'production';

function devLog(message: string): void {
  if (!isProduction()) {
    console.info(message);
  }
}

function shouldSimulateDebriefFail(
  query: Record<string, string | string[] | undefined>,
): boolean {
  if (query.fail !== 'ai') return false;
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development';
  return env === 'development' || env === 'preview';
}

export async function handleDebriefPost(
  body: unknown,
  clientKey: string,
  query: Record<string, string | string[] | undefined>,
  fetchImpl: typeof fetch = fetch,
): Promise<DebriefPostResult> {
  if (shouldSimulateDebriefFail(query)) {
    devLog('debrief: simulated fail switch');
    return { ok: true, status: 200, body: templateDebriefResponse() };
  }

  if (!checkDebriefRateLimit(clientKey)) {
    return { ok: false, status: 429, body: { error: 'rate_limited' } };
  }

  try {
    assertPayloadSize(body);
    const payload = parseDebriefRequest(body);
    const fingerprint = fingerprintDebriefRequest(payload);

    const cached = readDedupedDebrief(fingerprint);
    if (cached) {
      return { ok: true, status: 200, body: cached };
    }

    const { apiKey, model } = requireGeminiConfig();
    const generated = await callGeminiDebrief(
      payload,
      apiKey,
      model,
      undefined,
      fetchImpl,
    );
    const checked = validateDebriefOutput(generated.text);

    const response = checked.ok
      ? aiDebriefResponse(checked.text)
      : templateDebriefResponse();
    writeDedupedDebrief(fingerprint, response);
    return { ok: true, status: 200, body: response };
  } catch (err) {
    if (err instanceof DebriefApiError) {
      if (err.code === 'debrief_unavailable') {
        const fallback = templateDebriefResponse();
        return { ok: true, status: 200, body: fallback };
      }
      return {
        ok: false,
        status: err.httpStatus,
        body: {
          error: err.code,
          message: err.message !== err.code ? err.message : undefined,
        },
      };
    }
    return { ok: true, status: 200, body: templateDebriefResponse() };
  }
}
