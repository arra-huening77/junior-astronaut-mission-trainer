const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

interface RateState {
  count: number;
  windowStart: number;
}

const ipBuckets = new Map<string, RateState>();

export function clearDebriefRateLimits(): void {
  ipBuckets.clear();
}

export function checkDebriefRateLimit(
  clientKey: string,
  now = Date.now(),
): boolean {
  const key = clientKey.trim() || 'anonymous';
  const state = ipBuckets.get(key);
  if (!state || now - state.windowStart >= WINDOW_MS) {
    ipBuckets.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (state.count >= MAX_PER_WINDOW) {
    return false;
  }
  state.count += 1;
  return true;
}
