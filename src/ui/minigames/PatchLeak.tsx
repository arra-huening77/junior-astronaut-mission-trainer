import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { MiniGameResult, TextKey } from '../../engine/types';
import {
  normalizePatchLeakDifficulty,
  type PatchLeakDifficulty,
} from './_lib/patchLeakTiers';
import { PatchLeakAdvanced } from './PatchLeakAdvanced';
import { PatchLeakTier1 } from './PatchLeakTier1';

export type { PatchLeakDifficulty };

export type PatchLeakProps = {
  id: 'patch_leak';
  reduceMotion: boolean;
  instructionKey: TextKey;
  instruction: string;
  onResult: (result: MiniGameResult) => void;
  sol?: number;
  /** Preview-only; mission omits → Tier 1. */
  difficulty?: PatchLeakDifficulty;
};

/**
 * Patch Leak — Tier 1 in mission (Sol 8); tiers 2–3 via preview only.
 * Reports done|skipped once. Engine owns +2 Power on completion.
 */
export function PatchLeak(props: PatchLeakProps) {
  return (
    <PatchLeakErrorBoundary onResult={props.onResult}>
      <PatchLeakBody {...props} />
    </PatchLeakErrorBoundary>
  );
}

class PatchLeakErrorBoundary extends Component<
  { onResult: (result: MiniGameResult) => void; children: ReactNode },
  { crashed: boolean }
> {
  private reported = false;

  constructor(props: {
    onResult: (result: MiniGameResult) => void;
    children: ReactNode;
  }) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError(): { crashed: boolean } {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PatchLeak error', error, info.componentStack);
    if (!this.reported) {
      this.reported = true;
      this.props.onResult('skipped');
    }
  }

  render() {
    if (this.state.crashed) {
      return (
        <p className="mg-leak__fallback" role="status">
          Something went wrong with the air module. You can continue — Skip was
          applied.
        </p>
      );
    }
    return this.props.children;
  }
}

function PatchLeakBody(props: PatchLeakProps) {
  const tier = normalizePatchLeakDifficulty(props.difficulty);
  if (tier === 1) {
    return <PatchLeakTier1 {...props} />;
  }
  return <PatchLeakAdvanced {...props} difficulty={tier} />;
}