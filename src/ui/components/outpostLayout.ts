import type { SpotId, SpotLayout } from './types';
/**
 * Outpost layout — bottom-center anchors, depth scaling, rock clearance.
 * Coordinates are scene-relative % so the layout stays responsive.
 */

export type BuildingSlot = {
  id: string;
  /** Bottom-center X (% from left). */
  x: number;
  /** Feet Y (% from stage bottom). Higher = farther up the vista. */
  bottom: number;
  /** Nominal width at scale 1 before depth scaling. */
  baseWidth: number;
  z: number;
};

export type RockSize = 'small' | 'medium' | 'large';

export type RockSlot = {
  id: string;
  x: number;
  bottom: number;
  baseWidth: number;
  size: RockSize;
  z: number;
};

export type LayoutRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** ~20px on a ~1180px stage → ~1.7%; use 2% for safety. */
export const LAYOUT_CLEARANCE_PCT = 2;
export const LAYOUT_MARGIN_PCT = 5;

const ROCK_SRC: Record<RockSize, string> = {
  small: '/assets/minigames/rock_small.png',
  medium: '/assets/minigames/rock_medium.png',
  large: '/assets/minigames/rock_large.png',
};

export function rockSrc(size: RockSize): string {
  return ROCK_SRC[size];
}

/**
 * Depth scale from vertical position.
 * Higher on screen (farther) → smaller. Lower (nearer) → larger.
 * Perspective is measured over the ground plane, below the 48% horizon.
 */
export function depthScale(bottomPct: number): number {
  const yFromTop = Math.max(0, Math.min(100, 100 - bottomPct));
  const groundDepth = Math.max(0, Math.min(1, (yFromTop - 48) / 40));
  return 0.6 + groundDepth * 0.9;
}

export function scaledWidth(baseWidth: number, bottomPct: number): number {
  return baseWidth * depthScale(bottomPct);
}

export function slotRect(
  x: number,
  bottom: number,
  baseWidth: number,
  heightRatio = 0.9,
): LayoutRect {
  const w = scaledWidth(baseWidth, bottom);
  const h = w * heightRatio;
  return {
    x: x - w / 2,
    y: 100 - bottom - h,
    w,
    h,
  };
}

export function rectsOverlap(
  a: LayoutRect,
  b: LayoutRect,
  pad = LAYOUT_CLEARANCE_PCT,
): boolean {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  );
}

/**
 * Reference layout:
 * Two clusters flank the winding lane. Anchors sit on sand below the painted
 * rock ridges, rather than treating the baked-in terrain as empty ground.
 */
export const OUTPOST_BUILDINGS = {
  // Far left, farther → smaller
  greenhouse: { id: 'greenhouse', x: 27, bottom: 39, baseWidth: 13, z: 3 },
  // Right-hand utility cluster, beyond the foreground solar array
  air: { id: 'air', x: 78, bottom: 35, baseWidth: 12, z: 4 },
  // Main habitat on the broad left shoulder of the lane
  habitat: { id: 'habitat', x: 37, bottom: 25, baseWidth: 17, z: 5 },
  // Far right antenna, small
  dish: { id: 'dish', x: 88, bottom: 25, baseWidth: 6, z: 5 },
  // Solar array on the clear right shoulder; never across the lane
  solar: { id: 'solar', x: 59, bottom: 23, baseWidth: 5.2, z: 6 },
  solarB: { id: 'solarB', x: 65.5, bottom: 23, baseWidth: 5.2, z: 6 },
  extraPanels: { id: 'extraPanels', x: 62, bottom: 17, baseWidth: 5.2, z: 7 },
  // Shelter and cargo attachments stay with their respective clusters
  shelter: { id: 'shelter', x: 18, bottom: 27, baseWidth: 5, z: 5 },
  batteryBox: { id: 'batteryBox', x: 72, bottom: 23, baseWidth: 2.4, z: 6 },
  shieldPlating: { id: 'shieldPlating', x: 37, bottom: 23, baseWidth: 9, z: 6 },
  garage: { id: 'garage', x: 83, bottom: 17, baseWidth: 8, z: 7 },
  // Foreground rover is larger than the distant utility structures
  rover: { id: 'rover', x: 76, bottom: 16, baseWidth: 7, z: 8 },
} as const satisfies Record<string, BuildingSlot>;

/** Commander feet in the middle of the winding path. */
export const OUTPOST_PATH_START = { x: 49, y: 76 } as const;

/** Match sprite bounds in the 16:9 scene; every stand point stays on clear sand. */
function buildingSpot(
  slot: BuildingSlot,
  label: string,
  stand: [number, number],
  aspectRatio: number,
): SpotLayout {
  const w = scaledWidth(slot.baseWidth, slot.bottom);
  const h = (w / aspectRatio) * (16 / 9);
  return { x: slot.x - w / 2, y: 100 - slot.bottom - h, w, h, stand, label };
}

/** Interaction bounds and walk destinations follow the same anchors as the artwork. */
export const MISSION_SPOTS: Record<SpotId, SpotLayout> = {
  greenhouse: buildingSpot(
    OUTPOST_BUILDINGS.greenhouse,
    'Greenhouse',
    [34, 62],
    1.5,
  ),
  solar: {
    ...buildingSpot(OUTPOST_BUILDINGS.solar, 'Solar panels', [54, 76], 1.5),
    w:
      scaledWidth(
        OUTPOST_BUILDINGS.solar.baseWidth,
        OUTPOST_BUILDINGS.solar.bottom,
      ) + 6.5,
  },
  air: buildingSpot(OUTPOST_BUILDINGS.air, 'Air module', [70, 66], 1402 / 1122),
  habitat: buildingSpot(OUTPOST_BUILDINGS.habitat, 'Habitat', [49, 73], 1.5),
  dish: buildingSpot(
    OUTPOST_BUILDINGS.dish,
    'Comms dish',
    [82, 76],
    1284 / 1225,
  ),
  rover: buildingSpot(
    OUTPOST_BUILDINGS.rover,
    'Rover garage',
    [69, 85],
    128 / 96,
  ),
};

/** Edge rock seeds only — kept away from path/props by collision resolve. */
const ROCK_SEEDS: readonly RockSlot[] = [
  { id: 'rock-bl', x: 5, bottom: 7, baseWidth: 4.5, size: 'large', z: 1 },
  { id: 'rock-br', x: 95, bottom: 6, baseWidth: 4.5, size: 'large', z: 1 },
  { id: 'rock-ml', x: 3.5, bottom: 32, baseWidth: 3, size: 'medium', z: 1 },
  { id: 'rock-mr', x: 96.5, bottom: 31, baseWidth: 3, size: 'medium', z: 1 },
];

function clampRock(rock: RockSlot): RockSlot {
  const half = scaledWidth(rock.baseWidth, rock.bottom) / 2;
  return {
    ...rock,
    x: Math.min(
      100 - LAYOUT_MARGIN_PCT - half,
      Math.max(LAYOUT_MARGIN_PCT + half, rock.x),
    ),
    bottom: Math.min(46, Math.max(6, rock.bottom)),
  };
}

function buildingObstacleRects(
  buildings: Record<string, BuildingSlot>,
  commander?: { x: number; y: number },
): LayoutRect[] {
  const rects = Object.values(buildings).map((b) =>
    slotRect(b.x, b.bottom, b.baseWidth, b.id === 'rover' ? 0.55 : 0.9),
  );
  if (commander) {
    rects.push({
      x: commander.x - 1.5,
      y: commander.y - 5,
      w: 3,
      h: 5,
    });
  }
  return rects;
}

function resolveRock(rock: RockSlot, obstacles: LayoutRect[]): RockSlot {
  let next = clampRock(rock);
  for (let i = 0; i < 28; i += 1) {
    const box = slotRect(next.x, next.bottom, next.baseWidth, 0.7);
    const hit = obstacles.find((o) => rectsOverlap(box, o));
    if (!hit) return next;

    const centerX = hit.x + hit.w / 2;
    const away = next.x >= centerX ? 1 : -1;
    next = clampRock({
      ...next,
      x: next.x + away * 4,
      bottom: Math.max(6, next.bottom + (away > 0 ? -1 : 1.5)),
    });
  }
  return clampRock({
    ...next,
    x: next.x < 50 ? LAYOUT_MARGIN_PCT + 3 : 100 - LAYOUT_MARGIN_PCT - 3,
    bottom: 8,
  });
}

/** Decorative rocks in clear edge gaps only (never overlapping props/commander). */
export function placeOutpostRocks(
  buildings: Record<string, BuildingSlot> = OUTPOST_BUILDINGS,
  commander: { x: number; y: number } = OUTPOST_PATH_START,
): RockSlot[] {
  const obstacles = buildingObstacleRects(buildings, commander);
  const placed: RockSlot[] = [];
  for (const seed of ROCK_SEEDS) {
    const resolved = resolveRock(seed, [
      ...obstacles,
      ...placed.map((r) => slotRect(r.x, r.bottom, r.baseWidth, 0.7)),
    ]);
    placed.push(resolved);
  }
  return placed;
}

export const OUTPOST_ROCKS = placeOutpostRocks();
