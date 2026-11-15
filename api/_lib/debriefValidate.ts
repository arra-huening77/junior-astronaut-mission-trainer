import { z } from 'zod';

import type { DebriefRequest } from '../../src/engine/contracts';
import { EVENT_IDS } from '../../src/engine/types';

const CARGO_IDS = [
  'solar_extra',
  'batteries',
  'shield_plating',
  'greenhouse_kit',
  'water_recycler',
  'spare_parts',
  'rover_fuel',
  'radio_booster',
] as const;
import { DebriefApiError } from './debriefErrors';

export const DEBRIEF_MAX_BODY_BYTES = 4096;

const solSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
]);

const choiceSchema = z.union([z.literal('A'), z.literal('B'), z.literal('C')]);
const meterSchema = z.union([
  z.literal('life'),
  z.literal('power'),
  z.literal('shield'),
]);
const skyLevelSchema = z.union([
  z.literal('calm'),
  z.literal('active'),
  z.literal('stormy'),
]);
const miniGameSchema = z.union([z.literal('done'), z.literal('skipped')]);

const cargoIdSchema = z.enum(CARGO_IDS);
const eventIdSchema = z.enum(EVENT_IDS);

const metersSchema = z
  .object({
    life: z.number().finite(),
    power: z.number().finite(),
    shield: z.number().finite(),
  })
  .strict();

const historyEntrySchema = z
  .object({
    sol: solSchema,
    event: eventIdSchema,
    choice: choiceSchema,
    miniGame: miniGameSchema.optional(),
    meters: metersSchema,
  })
  .strict();

const topDrainSchema = z
  .object({
    sol: solSchema,
    meter: meterSchema,
    amount: z.number().finite(),
  })
  .strict();

/** Strict mission summary — no player names, prompts, or arbitrary fields. */
export const debriefRequestSchema = z
  .object({
    ending: z.union([z.literal('success'), z.literal('gentle')]),
    failedMeter: meterSchema.nullable(),
    skyLevel: skyLevelSchema,
    cargo: z.array(cargoIdSchema).max(8),
    history: z.array(historyEntrySchema).max(30),
    topDrains: z.array(topDrainSchema).max(15),
    facts: z.array(z.string().min(1).max(500)).max(20),
  })
  .strict();

const forbiddenPromptKeys =
  /^(name|player|prompt|message|text|instruction|system)$/i;

export function assertPayloadSize(raw: unknown): void {
  const serialized = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '');
  const bytes = new TextEncoder().encode(serialized).length;
  if (bytes > DEBRIEF_MAX_BODY_BYTES) {
    throw new DebriefApiError('payload_too_large', 413);
  }
}

export function parseDebriefRequest(raw: unknown): DebriefRequest {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DebriefApiError('invalid_payload', 400);
  }

  for (const key of Object.keys(raw as object)) {
    if (forbiddenPromptKeys.test(key)) {
      throw new DebriefApiError(
        'invalid_payload',
        400,
        'Forbidden field in payload',
      );
    }
  }

  const parsed = debriefRequestSchema.safeParse(raw);
  if (!parsed.success) {
    throw new DebriefApiError('invalid_payload', 400);
  }

  return parsed.data;
}
