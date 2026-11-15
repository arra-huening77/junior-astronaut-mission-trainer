import { describe, expect, it } from 'vitest';
import {
  LAYOUT_CLEARANCE_PCT,
  OUTPOST_BUILDINGS,
  OUTPOST_PATH_START,
  depthScale,
  placeOutpostRocks,
  rectsOverlap,
  slotRect,
} from './outpostLayout';

describe('outpost layout', () => {
  it('scales nearer (lower) objects larger than far ones', () => {
    expect(depthScale(12)).toBeGreaterThan(depthScale(40));
  });

  it('keeps decorative rocks clear of buildings and the commander', () => {
    const rocks = placeOutpostRocks(OUTPOST_BUILDINGS, OUTPOST_PATH_START);
    const obstacles = [
      ...Object.values(OUTPOST_BUILDINGS).map((b) =>
        slotRect(b.x, b.bottom, b.baseWidth, b.id === 'rover' ? 0.55 : 0.9),
      ),
      {
        x: OUTPOST_PATH_START.x - 1.5,
        y: OUTPOST_PATH_START.y - 5,
        w: 3,
        h: 5,
      },
    ];

    for (const rock of rocks) {
      const box = slotRect(rock.x, rock.bottom, rock.baseWidth, 0.7);
      for (const obstacle of obstacles) {
        expect(rectsOverlap(box, obstacle, LAYOUT_CLEARANCE_PCT)).toBe(false);
      }
      expect(rock.x).toBeGreaterThan(3);
      expect(rock.x).toBeLessThan(97);
    }
  });
});
