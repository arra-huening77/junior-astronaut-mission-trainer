import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RepairWires } from './RepairWires';

function renderWires(onResult = vi.fn(), reduceMotion = true) {
  const utils = render(
    <RepairWires
      id="repair_wires"
      instructionKey="minigame.repair_wires.hint"
      instruction="Choose a wire end, then its matching symbol. Connect all three pairs."
      reduceMotion={reduceMotion}
      onResult={onResult}
    />,
  );
  return { onResult, ...utils };
}

function port(name: 'Alpha' | 'Beta' | 'Gamma', side: 'left' | 'right') {
  const sideWord = side === 'left' ? 'left' : 'right';
  return screen.getByRole('button', {
    name: new RegExp(`${name} wire ${sideWord}`, 'i'),
  });
}

async function connectPair(name: 'Alpha' | 'Beta' | 'Gamma') {
  fireEvent.click(port(name, 'left'));
  fireEvent.click(port(name, 'right'));
}

async function connectAllPairs() {
  await connectPair('Alpha');
  await connectPair('Beta');
  await connectPair('Gamma');
}

function runCircuitTest() {
  fireEvent.click(screen.getByRole('button', { name: /test power/i }));
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
});

describe('RepairWires Tier 1', () => {
  it('reports done once after circuit test succeeds', async () => {
    const onResult = vi.fn();
    renderWires(onResult);
    await connectAllPairs();
    expect(onResult).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /test power/i })).toBeEnabled();
    runCircuitTest();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith('done');
  });

  it('does not report done until circuit test', async () => {
    const onResult = vi.fn();
    renderWires(onResult);
    await connectAllPairs();
    expect(screen.getByRole('status')).toHaveTextContent(/test power/i);
    expect(onResult).not.toHaveBeenCalled();
  });

  it('allows retry after a mismatch', () => {
    const onResult = vi.fn();
    renderWires(onResult);
    fireEvent.click(port('Alpha', 'left'));
    fireEvent.click(port('Beta', 'right'));
    expect(screen.getByRole('status')).toHaveTextContent(/do not match/i);
    expect(onResult).not.toHaveBeenCalled();
    fireEvent.click(port('Alpha', 'left'));
    fireEvent.click(port('Alpha', 'right'));
    expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();
  });

  it('gives a stronger hint after repeated mismatches', () => {
    renderWires();
    fireEvent.click(port('Alpha', 'left'));
    fireEvent.click(port('Beta', 'right'));
    fireEvent.click(port('Gamma', 'left'));
    fireEvent.click(port('Alpha', 'right'));
    expect(screen.getByRole('status')).toHaveTextContent(
      /match symbols and labels/i,
    );
  });

  it('reports skipped once and ignores repeated Skip', () => {
    const onResult = vi.fn();
    renderWires(onResult);
    const skip = screen.getByRole('button', { name: 'Skip' });
    fireEvent.click(skip);
    fireEvent.click(skip);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith('skipped');
    expect(skip).toBeDisabled();
  });

  it('allows Skip during circuit test before completion', async () => {
    const onResult = vi.fn();
    renderWires(onResult);
    await connectAllPairs();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onResult).toHaveBeenCalledWith('skipped');
  });

  it('does not double-report done on extra test clicks', async () => {
    const onResult = vi.fn();
    renderWires(onResult);
    await connectAllPairs();
    runCircuitTest();
    runCircuitTest();
    vi.runAllTimers();
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('connects a pair via number keys after focus handlers mount', async () => {
    renderWires();
    await act(async () => {});
    fireEvent.keyDown(document, { key: '1' });
    fireEvent.keyDown(document, { key: '4' });
    expect(
      screen.getByRole('button', { name: /Alpha wire right, connected/i }),
    ).toBeDisabled();
  });

  it('runs circuit test via T key', async () => {
    const onResult = vi.fn();
    renderWires(onResult);
    await connectAllPairs();
    await act(async () => {});
    fireEvent.keyDown(document, { key: 't' });
    expect(onResult).toHaveBeenCalledWith('done');
  });

  it('connects a pair via Enter when focus is on the board', async () => {
    renderWires();
    await act(async () => {});
    const left = port('Alpha', 'left');
    left.focus();
    fireEvent.keyDown(left, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    const right = port('Alpha', 'right');
    right.focus();
    fireEvent.keyDown(right, { key: 'Enter' });
    expect(
      screen.getByRole('button', { name: /Alpha wire right, connected/i }),
    ).toBeDisabled();
  });

  it('keeps Skip visible during play and test', async () => {
    renderWires();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeVisible();
    fireEvent.click(port('Alpha', 'left'));
    await connectAllPairs();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeVisible();
  });

  it('locks Skip after successful test when motion is enabled', async () => {
    const onResult = vi.fn();
    renderWires(onResult, false);
    await connectAllPairs();
    const skip = screen.getByRole('button', { name: 'Skip' });
    expect(skip).toBeEnabled();
    runCircuitTest();
    expect(skip).toBeDisabled();
    expect(onResult).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onResult).toHaveBeenCalledWith('done');
  });

  it('allows Skip midway through wiring', () => {
    const onResult = vi.fn();
    renderWires(onResult);
    fireEvent.click(port('Alpha', 'left'));
    fireEvent.click(port('Alpha', 'right'));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onResult).toHaveBeenCalledWith('skipped');
  });

  it('defaults to tier 1 when difficulty is omitted', () => {
    renderWires();
    expect(
      screen.getByLabelText(/Connected 0 of 3 pairs/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Training tier/)).not.toBeInTheDocument();
  });
});

function renderWiresTier(
  difficulty: 2 | 3,
  onResult = vi.fn(),
  reduceMotion = true,
) {
  return render(
    <RepairWires
      id="repair_wires"
      instructionKey="minigame.repair_wires.hint"
      instruction="Training tier."
      reduceMotion={reduceMotion}
      difficulty={difficulty}
      onResult={onResult}
    />,
  );
}

function portNamed(name: string, side: 'left' | 'right') {
  return screen.getByRole('button', {
    name: new RegExp(`${name} wire ${side}`, 'i'),
  });
}

async function connectAndRouteTier2(
  name: string,
  route: 'A' | 'B',
  safePaths: Record<string, 'A' | 'B'>,
) {
  fireEvent.click(portNamed(name, 'left'));
  fireEvent.click(portNamed(name, 'right'));
  const label =
    safePaths[name] === 'A'
      ? /Route A — upper conduit/i
      : /Route B — lower conduit/i;
  fireEvent.click(screen.getByRole('button', { name: label }));
  void route;
}

const TIER2_SAFE: Record<string, 'A' | 'B'> = {
  Alpha: 'A',
  Beta: 'B',
  Gamma: 'A',
  Delta: 'B',
};

const TIER3_SAFE: Record<string, 'A' | 'B'> = {
  Alpha: 'A',
  Beta: 'B',
  Gamma: 'A',
  Delta: 'B',
  Epsilon: 'B',
};

describe('RepairWires Tier 2 (preview)', () => {
  it('requires routing before circuit test with four pairs', async () => {
    const onResult = vi.fn();
    renderWiresTier(2, onResult);
    expect(screen.getByText(/1 \/ 4|0 \/ 4/)).toBeInTheDocument();
    await connectAndRouteTier2('Alpha', 'A', TIER2_SAFE);
    await connectAndRouteTier2('Beta', 'B', TIER2_SAFE);
    await connectAndRouteTier2('Gamma', 'A', TIER2_SAFE);
    await connectAndRouteTier2('Delta', 'B', TIER2_SAFE);
    expect(onResult).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /test power/i }));
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith('done');
  });

  it('rejects unsafe route and allows retry', () => {
    renderWiresTier(2);
    fireEvent.click(portNamed('Alpha', 'left'));
    fireEvent.click(portNamed('Alpha', 'right'));
    fireEvent.click(
      screen.getByRole('button', { name: /Route B — lower conduit/i }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(/hot line/i);
    fireEvent.click(
      screen.getByRole('button', { name: /Route A — upper conduit/i }),
    );
    expect(screen.getByText(/0 \/ 4|1 \/ 4/)).toBeInTheDocument();
  });
});

describe('RepairWires Tier 3 (preview)', () => {
  it('blocks occupied conduit rows with a hint', () => {
    renderWiresTier(3);
    fireEvent.click(portNamed('Alpha', 'left'));
    fireEvent.click(portNamed('Alpha', 'right'));
    fireEvent.click(
      screen.getByRole('button', { name: /Route A — upper conduit/i }),
    );
    fireEvent.click(portNamed('Delta', 'left'));
    fireEvent.click(portNamed('Delta', 'right'));
    fireEvent.click(
      screen.getByRole('button', { name: /Route A — upper conduit/i }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(/conduit row/i);
  });

  it('completes five pairs with routing and test power', async () => {
    const onResult = vi.fn();
    renderWiresTier(3, onResult);
    for (const name of ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']) {
      await connectAndRouteTier2(name, TIER3_SAFE[name], TIER3_SAFE);
    }
    fireEvent.click(screen.getByRole('button', { name: /test power/i }));
    expect(onResult).toHaveBeenCalledWith('done');
  });
});
