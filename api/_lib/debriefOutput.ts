import type { DebriefResponse } from '../../src/engine/contracts';

const URL_PATTERN = /https?:\/\/|www\./i;
const BLOCKED_WORDS =
  /\b(died|death|kill|killed|blood|stupid|idiot|damn|hell)\b/i;

export interface OutputAcceptance {
  ok: true;
  text: string;
}

export interface OutputRejection {
  ok: false;
  reason: string;
}

export type OutputValidation = OutputAcceptance | OutputRejection;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countSentences(text: string): number {
  const parts = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length;
}

/** README §13 output checks before returning AI text. */
export function validateDebriefOutput(text: string): OutputValidation {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty' };
  }

  if (URL_PATTERN.test(trimmed)) {
    return { ok: false, reason: 'contains_link' };
  }

  if (BLOCKED_WORDS.test(trimmed)) {
    return { ok: false, reason: 'blocked_word' };
  }

  const words = countWords(trimmed);
  if (words > 60) {
    return { ok: false, reason: 'too_long' };
  }

  const sentences = countSentences(trimmed);
  if (sentences < 2 || sentences > 3) {
    return { ok: false, reason: 'sentence_count' };
  }

  if (!/^[\x20-\x7E\n\r'’,.!?“”\-–—:;()A-Za-z0-9]+$/.test(trimmed)) {
    return { ok: false, reason: 'non_english_characters' };
  }

  return { ok: true, text: trimmed };
}

export function templateDebriefResponse(): DebriefResponse {
  return { source: 'template', text: '' };
}

export function aiDebriefResponse(text: string): DebriefResponse {
  return { source: 'ai', text };
}
