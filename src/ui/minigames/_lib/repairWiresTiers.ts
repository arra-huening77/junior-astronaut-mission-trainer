export type RepairWiresDifficulty = 1 | 2 | 3;

export type WirePairRoute = {
  id: string;
  symbol: string;
  name: string;
  color: string;
  /** Safe route (preview tiers 2–3). */
  safePath: 'A' | 'B';
  /** Conduit row index 0–4 when tier 3 path is chosen. */
  pathAConduit: number;
  pathBConduit: number;
};

export type RepairWiresTierConfig = {
  difficulty: RepairWiresDifficulty;
  pairs: readonly WirePairRoute[];
  rowY: readonly number[];
  needsRoute: boolean;
  conduitMode: boolean;
  showClueStrip: boolean;
  /** Stronger mismatch copy after this many mismatches (tier 2: 2). */
  mismatchHintAfter: number;
};

const TIER1_ROWS = [22, 50, 78] as const;

const BASE_PAIRS: readonly WirePairRoute[] = [
  {
    id: 'alpha',
    symbol: 'α',
    name: 'Alpha',
    color: '#5ad4ff',
    safePath: 'A',
    pathAConduit: 0,
    pathBConduit: 2,
  },
  {
    id: 'beta',
    symbol: 'β',
    name: 'Beta',
    color: '#ffd76a',
    safePath: 'B',
    pathAConduit: 1,
    pathBConduit: 3,
  },
  {
    id: 'gamma',
    symbol: 'γ',
    name: 'Gamma',
    color: '#b8f070',
    safePath: 'A',
    pathAConduit: 2,
    pathBConduit: 4,
  },
  {
    id: 'delta',
    symbol: 'δ',
    name: 'Delta',
    color: '#ff9ad4',
    safePath: 'B',
    pathAConduit: 0,
    pathBConduit: 1,
  },
  {
    id: 'epsilon',
    symbol: 'ε',
    name: 'Epsilon',
    color: '#c8a0ff',
    safePath: 'B',
    pathAConduit: 3,
    pathBConduit: 4,
  },
];

const TIER2_ROWS = [16, 36, 56, 76] as const;
const TIER3_ROWS = [12, 30, 48, 66, 84] as const;

export function normalizeRepairWiresDifficulty(
  difficulty?: RepairWiresDifficulty,
): RepairWiresDifficulty {
  if (difficulty === 2 || difficulty === 3) return difficulty;
  return 1;
}

export function getRepairWiresTierConfig(
  difficulty?: RepairWiresDifficulty,
): RepairWiresTierConfig {
  const tier = normalizeRepairWiresDifficulty(difficulty);
  if (tier === 1) {
    return {
      difficulty: 1,
      pairs: BASE_PAIRS.slice(0, 3),
      rowY: TIER1_ROWS,
      needsRoute: false,
      conduitMode: false,
      showClueStrip: false,
      mismatchHintAfter: 2,
    };
  }
  if (tier === 2) {
    return {
      difficulty: 2,
      pairs: BASE_PAIRS.slice(0, 4),
      rowY: TIER2_ROWS,
      needsRoute: true,
      conduitMode: false,
      showClueStrip: true,
      mismatchHintAfter: 2,
    };
  }
  return {
    difficulty: 3,
    pairs: BASE_PAIRS.slice(0, 5),
    rowY: TIER3_ROWS,
    needsRoute: true,
    conduitMode: true,
    showClueStrip: true,
    mismatchHintAfter: 2,
  };
}

export const CONDUIT_ROW_Y = [18, 34, 50, 66, 82] as const;