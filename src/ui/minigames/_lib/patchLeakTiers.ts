export type PatchLeakDifficulty = 1 | 2 | 3;

export type PatchSizeTier = 'small' | 'medium' | 'large';
export type LeakShape = 'round' | 'oval' | 'slit';
export type PatchRotation = 0 | 90;

export type LeakSpotDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  size: PatchSizeTier;
  shape: LeakShape;
  requiredRotation: PatchRotation;
  decoy?: boolean;
  sealOrder?: number;
  pressureZone?: string;
};

export type PatchLeakTierConfig = {
  difficulty: PatchLeakDifficulty;
  spots: readonly LeakSpotDef[];
  realLeakCount: number;
  traySizes: readonly PatchSizeTier[];
  rotationSizes: readonly PatchSizeTier[];
  enforceSealOrder: boolean;
  showPressureCues: boolean;
};

const TIER2_SPOTS: readonly LeakSpotDef[] = [
  {
    id: 'leak-a',
    label: 'Leak A',
    x: 22,
    y: 30,
    size: 'small',
    shape: 'round',
    requiredRotation: 0,
  },
  {
    id: 'leak-b',
    label: 'Leak B',
    x: 50,
    y: 58,
    size: 'medium',
    shape: 'oval',
    requiredRotation: 0,
  },
  {
    id: 'leak-c',
    label: 'Leak C',
    x: 78,
    y: 36,
    size: 'large',
    shape: 'slit',
    requiredRotation: 90,
  },
];

const TIER3_SPOTS: readonly LeakSpotDef[] = [
  {
    id: 'leak-a',
    label: 'Leak A',
    x: 18,
    y: 26,
    size: 'small',
    shape: 'round',
    requiredRotation: 0,
    sealOrder: 1,
    pressureZone: 'North',
  },
  {
    id: 'leak-decoy',
    label: 'Spot E',
    x: 34,
    y: 44,
    size: 'small',
    shape: 'oval',
    requiredRotation: 0,
    decoy: true,
  },
  {
    id: 'leak-b',
    label: 'Leak B',
    x: 48,
    y: 58,
    size: 'medium',
    shape: 'oval',
    requiredRotation: 90,
    sealOrder: 2,
    pressureZone: 'Center',
  },
  {
    id: 'leak-c',
    label: 'Leak C',
    x: 66,
    y: 30,
    size: 'large',
    shape: 'slit',
    requiredRotation: 90,
    sealOrder: 3,
    pressureZone: 'East',
  },
  {
    id: 'leak-d',
    label: 'Leak D',
    x: 82,
    y: 62,
    size: 'medium',
    shape: 'slit',
    requiredRotation: 0,
    sealOrder: 4,
    pressureZone: 'South',
  },
];

export function normalizePatchLeakDifficulty(
  difficulty?: PatchLeakDifficulty,
): PatchLeakDifficulty {
  if (difficulty === 2 || difficulty === 3) return difficulty;
  return 1;
}

export function getPatchLeakTierConfig(
  difficulty: PatchLeakDifficulty,
): PatchLeakTierConfig | null {
  if (difficulty === 2) {
    return {
      difficulty: 2,
      spots: TIER2_SPOTS,
      realLeakCount: 3,
      traySizes: ['small', 'medium', 'large'],
      rotationSizes: ['large'],
      enforceSealOrder: false,
      showPressureCues: false,
    };
  }
  if (difficulty === 3) {
    return {
      difficulty: 3,
      spots: TIER3_SPOTS,
      realLeakCount: 4,
      traySizes: ['small', 'medium', 'large'],
      rotationSizes: ['medium', 'large'],
      enforceSealOrder: true,
      showPressureCues: true,
    };
  }
  return null;
}

export function sizeLabel(size: PatchSizeTier) {
  if (size === 'small') return 'Small';
  if (size === 'medium') return 'Medium';
  return 'Large';
}