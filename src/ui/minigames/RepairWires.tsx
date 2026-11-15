import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { MiniGameResult, TextKey } from '../../engine/types';
import { normalizeRepairWiresDifficulty } from './_lib/repairWiresTiers';
import type { RepairWiresDifficulty } from './_lib/repairWiresTiers';
import { RepairWiresRouted } from './RepairWiresRouted';
import { RepairWiresTier1 } from './RepairWiresTier1';

export type { RepairWiresDifficulty };

export type RepairWiresProps = {
  id: 'repair_wires';
  reduceMotion: boolean;
  instructionKey: TextKey;
  /** Parent resolves instructionKey from story.json */
  instruction: string;
  onResult: (result: MiniGameResult) => void;
  sol?: number;
  /** Preview-only; mission integration omits this → Tier 1. */
  difficulty?: RepairWiresDifficulty;
};

/**
 * Repair Wires — Tier 1 in mission (Sol 7); tiers 2–3 via preview only.
 * Reports done|skipped once. Engine owns +2 Power on completion.
 */
export function RepairWires(props: RepairWiresProps) {
  return (
    <RepairWiresErrorBoundary onResult={props.onResult}>
      <RepairWiresBody {...props} />
    </RepairWiresErrorBoundary>
  );
}

class RepairWiresErrorBoundary extends Component<
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
    console.error('RepairWires error', error, info.componentStack);
    if (!this.reported) {
      this.reported = true;
      this.props.onResult('skipped');
    }
  }

  render() {
    if (this.state.crashed) {
      return (
        <p className="mg-wires__fallback" role="status">
          Something went wrong with the wiring panel. You can continue — Skip
          was applied.
        </p>
      );
    }
    return this.props.children;
  }
}

function RepairWiresBody(props: RepairWiresProps) {
  const tier = normalizeRepairWiresDifficulty(props.difficulty);
  if (tier === 1) {
    return <RepairWiresTier1 {...props} />;
  }
  return <RepairWiresRouted {...props} difficulty={tier} />;
}