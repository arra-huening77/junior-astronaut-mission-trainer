import { useCallback, useRef, useState } from 'react';
import type { MiniGameResult } from '../../../engine/types';

const DONE_DELAY_MS = 240;

/**
 * Shared one-shot mini-game result handling (Skip / done).
 * Does not apply meters — engine owns bonuses.
 */
export function useMiniGameResult(
  onResult: (result: MiniGameResult) => void,
  reduceMotion: boolean,
) {
  const finished = useRef(false);
  const reported = useRef(false);
  const [ended, setEnded] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const emitResult = useCallback(
    (result: MiniGameResult) => {
      if (reported.current) return;
      reported.current = true;
      onResult(result);
    },
    [onResult],
  );

  const finish = useCallback(
    (result: 'done' | 'skipped') => {
      if (finished.current) return;
      finished.current = true;
      setEnded(true);
      if (result === 'skipped') {
        emitResult('skipped');
        return;
      }
      setCelebrating(true);
      if (reduceMotion) emitResult('done');
      else window.setTimeout(() => emitResult('done'), DONE_DELAY_MS);
    },
    [emitResult, reduceMotion],
  );

  return {
    ended,
    celebrating,
    finish,
    finishedRef: finished,
  };
}