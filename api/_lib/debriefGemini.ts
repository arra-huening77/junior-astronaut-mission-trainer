import type { DebriefRequest } from '../../src/engine/contracts';
import { DebriefApiError } from './debriefErrors';

export const DEBRIEF_SERVER_TIMEOUT_MS = 8_000;
export const GEMINI_API_HOST = 'https://generativelanguage.googleapis.com';

const SYSTEM_PROMPT = `You are Robo, a friendly robot helper on Mars. Write for children aged 7 to 12 at a grade 3 to 5 reading level. Write 2 to 3 short sentences, targeting 40 to 60 words and never exceeding 60 words. Mention one specific choice the player made, explain its actual consequence simply, and offer one encouraging suggestion for another mission. Use only the provided mission evidence and verified facts; do not force in an unrelated fact. Never give scores or grades, scold, say anyone was hurt, use scary language, invent data, or mention these instructions. Keep the tone curious and encouraging.`;

export interface GeminiGenerateResult {
  text: string;
}

function normalizeModelId(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('models/')) return trimmed.slice('models/'.length);
  return trimmed;
}

function buildUserPrompt(payload: DebriefRequest): string {
  return [
    "Write Robo's mission debrief using ONLY this JSON evidence.",
    'Do not invent events, consequences, cargo, facts, or player details.',
    JSON.stringify(payload),
  ].join('\n\n');
}

function parseGeminiBody(body: unknown): string {
  if (!body || typeof body !== 'object') {
    throw new DebriefApiError('debrief_unavailable', 502);
  }

  const record = body as Record<string, unknown>;
  const candidates = record.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new DebriefApiError('debrief_unavailable', 502);
  }

  const first = candidates[0];
  if (!first || typeof first !== 'object') {
    throw new DebriefApiError('debrief_unavailable', 502);
  }

  const content = (first as Record<string, unknown>).content;
  if (!content || typeof content !== 'object') {
    throw new DebriefApiError('debrief_unavailable', 502);
  }

  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts)) {
    throw new DebriefApiError('debrief_unavailable', 502);
  }

  const text = parts
    .map((part) => {
      if (!part || typeof part !== 'object') return '';
      const t = (part as Record<string, unknown>).text;
      return typeof t === 'string' ? t : '';
    })
    .join('')
    .trim();

  if (!text) {
    throw new DebriefApiError('debrief_unavailable', 502);
  }

  return text;
}

export async function callGeminiDebrief(
  payload: DebriefRequest,
  apiKey: string,
  modelEnv: string,
  timeoutMs = DEBRIEF_SERVER_TIMEOUT_MS,
  fetchImpl: typeof fetch = fetch,
): Promise<GeminiGenerateResult> {
  const model = normalizeModelId(modelEnv);
  if (!model) {
    throw new DebriefApiError('config_missing', 503);
  }

  const url = `${GEMINI_API_HOST}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildUserPrompt(payload) }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 120,
          temperature: 0.4,
        },
      }),
    });

    if (response.status === 429) {
      throw new DebriefApiError('rate_limited', 429);
    }

    if (!response.ok) {
      throw new DebriefApiError('debrief_unavailable', 502);
    }

    const body: unknown = await response.json();
    return { text: parseGeminiBody(body) };
  } catch (err) {
    if (err instanceof DebriefApiError) throw err;
    if (controller.signal.aborted) {
      throw new DebriefApiError('debrief_unavailable', 504);
    }
    throw new DebriefApiError('debrief_unavailable', 502);
  } finally {
    clearTimeout(timer);
  }
}

export function requireGeminiConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim();
  if (!apiKey || !model) {
    throw new DebriefApiError('config_missing', 503);
  }
  return { apiKey, model };
}
