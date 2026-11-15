import { z } from 'zod';
import { isObservationTimestamp } from '../engine/observation-time';

import { classifySkyFromDonki, type DonkiObservationSet } from '../engine/sky';
import {
  registerDonkiArchive,
  type DonkiArchiveEntry,
  type DonkiArchiveFile,
} from '../services/sky';

import bundledDonkiArchive from './donkiArchive.json';

const skyLevelSchema = z.union([
  z.literal('calm'),
  z.literal('active'),
  z.literal('stormy'),
]);

const donkiArchiveEntrySchema = z
  .object({
    id: z.string().min(1),
    type: z.union([z.literal('FLR'), z.literal('CME'), z.literal('SEP')]),
    level: skyLevelSchema,
    observedAt: z.string().refine(isObservationTimestamp),
    sourceUrl: z.string().url(),
    classType: z.string().min(1).optional(),
  })
  .strict();

export const donkiArchiveFileSchema = z
  .object({
    events: z.array(donkiArchiveEntrySchema).min(1).max(30),
  })
  .strict();

const CME_SPEED_RE = /(\d+)\s*km\/s/i;

function entryToDonkiObservation(
  entry: DonkiArchiveEntry,
): DonkiObservationSet {
  const empty = {
    flares: [] as unknown[],
    cmes: [] as unknown[],
    seps: [] as unknown[],
  };
  if (entry.type === 'FLR') {
    return {
      ...empty,
      flares: [
        {
          flrID: entry.id,
          classType: entry.classType,
          peakTime: entry.observedAt,
          link: entry.sourceUrl,
        },
      ],
    };
  }
  if (entry.type === 'SEP') {
    return {
      ...empty,
      seps: [
        {
          sepID: entry.id,
          eventTime: entry.observedAt,
          link: entry.sourceUrl,
        },
      ],
    };
  }

  const speedMatch = entry.classType
    ? CME_SPEED_RE.exec(entry.classType)
    : null;
  const speed = speedMatch ? Number(speedMatch[1]) : undefined;
  return {
    ...empty,
    cmes: [
      {
        activityID: entry.id,
        time21_5: entry.observedAt,
        link: entry.sourceUrl,
        ...(typeof speed === 'number' && !Number.isNaN(speed) ? { speed } : {}),
      },
    ],
  };
}

/** Validate bundled archive JSON shape (Member 3 contract). */
export function parseDonkiArchiveFile(raw: unknown): DonkiArchiveFile {
  return donkiArchiveFileSchema.parse(raw);
}

/** Each stored `level` must match engine rules for that single NASA record. */
export function assertArchiveLevelsMatchClassifier(
  archive: DonkiArchiveFile,
): void {
  const ids = new Set<string>();
  for (const entry of archive.events) {
    if (ids.has(entry.id)) {
      throw new Error(`duplicate archive id: ${entry.id}`);
    }
    ids.add(entry.id);

    const classified = classifySkyFromDonki(entryToDonkiObservation(entry));
    if (!classified.ok) {
      throw new Error(
        `archive entry not classifiable: ${entry.id} (${classified.reason})`,
      );
    }
    if (classified.level !== entry.level) {
      throw new Error(
        `archive level mismatch for ${entry.id}: stored ${entry.level}, classifier ${classified.level}`,
      );
    }
  }
}

export function getBundledDonkiArchive(): DonkiArchiveFile {
  const archive = parseDonkiArchiveFile(bundledDonkiArchive);
  assertArchiveLevelsMatchClassifier(archive);
  return archive;
}

/** App bootstrap (Member 1): `registerBundledDonkiArchive()` before the first mission sky fetch. */
export function registerBundledDonkiArchive(): void {
  registerDonkiArchive(getBundledDonkiArchive());
}
