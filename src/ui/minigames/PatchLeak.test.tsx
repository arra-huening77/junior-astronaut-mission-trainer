import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PatchLeak } from './PatchLeak';

function renderLeak(onResult = vi.fn(), reduceMotion = true) {
  return render(
    <PatchLeak
      id="patch_leak"
      instructionKey="minigame.patch_leak.hint"
      instruction="Scan each leak, pick the right patch, then check pressure."
      reduceMotion={reduceMotion}
      onResult={onResult}
    />,
  );
}

function scanSpot(label: 'Leak A' | 'Leak B' | 'Leak C') {
  return screen.getByRole('button', {
    name: new RegExp(`${label}, marked leak`, 'i'),
  });
}

function patchSpot(label: 'Leak A' | 'Leak B' | 'Leak C') {
  return screen.getByRole('button', {
    name: new RegExp(`${label}, scanned`, 'i'),
  });
}

async function scanAll() {
  fireEvent.click(scanSpot('Leak A'));
  fireEvent.click(scanSpot('Leak B'));
  fireEvent.click(scanSpot('Leak C'));
}

function selectSmall() {
  fireEvent.click(screen.getByRole('button', { name: /Select small patch/i }));
}

function selectLarge() {
  fireEvent.click(screen.getByRole('button', { name: /Select large patch/i }));
}

/** A,C small; B large */
async function sealAllCorrectly() {
  selectSmall();
  fireEvent.click(patchSpot('Leak A'));
  selectLarge();
  fireEvent.click(patchSpot('Leak B'));
  selectSmall();
  fireEvent.click(patchSpot('Leak C'));
}

function runPressureTest() {
  fireEvent.click(screen.getByRole('button', { name: /check pressure/i }));
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
});

describe('PatchLeak Tier 1', () => {
  it('reports done once after pressure test succeeds', async () => {
    const onResult = vi.fn();
    renderLeak(onResult);
    await scanAll();
    await sealAllCorrectly();
    expect(onResult).not.toHaveBeenCalled();
    runPressureTest();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith('done');
  });

  it('does not report done until pressure test', async () => {
    const onResult = vi.fn();
    renderLeak(onResult);
    await scanAll();
    await sealAllCorrectly();
    expect(
      screen.getByRole('button', { name: /check pressure/i }),
    ).toBeEnabled();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('allows retry after wrong patch size', async () => {
    const onResult = vi.fn();
    renderLeak(onResult);
    await scanAll();
    selectLarge();
    fireEvent.click(patchSpot('Leak A'));
    expect(screen.getByRole('status')).toHaveTextContent(/does not fit/i);
    selectSmall();
    fireEvent.click(patchSpot('Leak A'));
    expect(
      screen.getByRole('button', { name: /Leak A, sealed/i }),
    ).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('gives a stronger hint after repeated wrong patch sizes', async () => {
    renderLeak();
    await scanAll();
    selectSmall();
    fireEvent.click(patchSpot('Leak B'));
    selectSmall();
    fireEvent.click(patchSpot('Leak B'));
    expect(screen.getByRole('status')).toHaveTextContent(
      /match the scan reading/i,
    );
  });

  it('reports skipped once and disables Skip', () => {
    const onResult = vi.fn();
    renderLeak(onResult);
    const skip = screen.getByRole('button', { name: 'Skip' });
    fireEvent.click(skip);
    fireEvent.click(skip);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith('skipped');
    expect(skip).toBeDisabled();
  });

  it('allows Skip during pressure test before completion', async () => {
    const onResult = vi.fn();
    renderLeak(onResult);
    await scanAll();
    await sealAllCorrectly();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onResult).toHaveBeenCalledWith('skipped');
  });

  it('does not double-report done on extra pressure clicks', async () => {
    const onResult = vi.fn();
    renderLeak(onResult);
    await scanAll();
    await sealAllCorrectly();
    runPressureTest();
    runPressureTest();
    vi.runAllTimers();
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('ignores repeat taps on a sealed leak with friendly feedback', async () => {
    const onResult = vi.fn();
    renderLeak(onResult);
    await scanAll();
    selectSmall();
    fireEvent.click(patchSpot('Leak A'));
    fireEvent.click(screen.getByRole('button', { name: /Leak A, sealed/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/already sealed/i);
    expect(onResult).not.toHaveBeenCalled();
  });

  it('scans via number keys', async () => {
    renderLeak();
    await act(async () => {});
    fireEvent.keyDown(document, { key: '1' });
    fireEvent.keyDown(document, { key: '2' });
    fireEvent.keyDown(document, { key: '3' });
    expect(
      screen.getByRole('button', { name: /Select small patch/i }),
    ).toBeInTheDocument();
  });

  it('seals via tray keys S/L and leak number keys', async () => {
    renderLeak();
    await scanAll();
    await act(async () => {});
    fireEvent.keyDown(document, { key: 's' });
    fireEvent.keyDown(document, { key: '1' });
    fireEvent.keyDown(document, { key: 'l' });
    fireEvent.keyDown(document, { key: '2' });
    expect(
      screen.getByRole('button', { name: /Leak B, sealed/i }),
    ).toBeInTheDocument();
  });

  it('runs pressure test via P key', async () => {
    const onResult = vi.fn();
    renderLeak(onResult);
    await scanAll();
    await sealAllCorrectly();
    await act(async () => {});
    fireEvent.keyDown(document, { key: 'p' });
    expect(onResult).toHaveBeenCalledWith('done');
  });

  it('keeps Skip visible during scan, patch, and pressure', async () => {
    renderLeak();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeVisible();
    await scanAll();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeVisible();
    await sealAllCorrectly();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeVisible();
  });

  it('locks Skip after successful pressure when motion enabled', async () => {
    const onResult = vi.fn();
    renderLeak(onResult, false);
    await scanAll();
    await sealAllCorrectly();
    const skip = screen.getByRole('button', { name: 'Skip' });
    expect(skip).toBeEnabled();
    runPressureTest();
    expect(skip).toBeDisabled();
    expect(onResult).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onResult).toHaveBeenCalledWith('done');
  });

  it('has no rotation controls in tier 1', async () => {
    renderLeak();
    await scanAll();
    expect(
      screen.queryByRole('button', { name: /rotate/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Training tier/)).not.toBeInTheDocument();
  });

  it('defaults to tier 1 when difficulty omitted', () => {
    renderLeak();
    expect(screen.getByLabelText(/Scanned 0 of 3 leaks/i)).toBeInTheDocument();
  });
});

function renderLeakTier(
  difficulty: 2 | 3,
  onResult = vi.fn(),
  reduceMotion = true,
) {
  return render(
    <PatchLeak
      id="patch_leak"
      instructionKey="minigame.patch_leak.hint"
      instruction="Training tier."
      reduceMotion={reduceMotion}
      difficulty={difficulty}
      onResult={onResult}
    />,
  );
}

function scanAdvanced(label: string) {
  fireEvent.click(
    screen.getByRole('button', {
      name: new RegExp(`${label}, marker`, 'i'),
    }),
  );
}

function sealAdvanced(label: string) {
  fireEvent.click(
    screen.getByRole('button', {
      name: new RegExp(`${label}, scanned`, 'i'),
    }),
  );
}

function selectPatchSize(size: 'small' | 'medium' | 'large') {
  fireEvent.click(
    screen.getByRole('button', {
      name: new RegExp(`Select ${size} patch`, 'i'),
    }),
  );
}

function rotatePatch() {
  fireEvent.click(screen.getByRole('button', { name: /Rotate patch/i }));
}

describe('PatchLeak Tier 2 (preview)', () => {
  async function scanTier2() {
    await act(async () => {
      scanAdvanced('Leak A');
      scanAdvanced('Leak B');
      scanAdvanced('Leak C');
    });
    expect(
      screen.getByRole('button', { name: /Select small patch/i }),
    ).toBeInTheDocument();
  }

  it('requires rotation on large slit leak before pressure', async () => {
    const onResult = vi.fn();
    renderLeakTier(2, onResult);
    await scanTier2();
    selectPatchSize('large');
    sealAdvanced('Leak C');
    expect(screen.getByRole('status')).toHaveTextContent(/rotate/i);
    rotatePatch();
    sealAdvanced('Leak C');
    selectPatchSize('small');
    sealAdvanced('Leak A');
    selectPatchSize('medium');
    sealAdvanced('Leak B');
    fireEvent.click(screen.getByRole('button', { name: /check pressure/i }));
    expect(onResult).toHaveBeenCalledWith('done');
  });

  it('shows medium patch in tray', async () => {
    renderLeakTier(2);
    await scanTier2();
    expect(
      screen.getByRole('button', { name: /Select medium patch/i }),
    ).toBeInTheDocument();
  });
});

describe('PatchLeak Tier 3 (preview)', () => {
  async function scanTier3() {
    await act(async () => {
      scanAdvanced('Leak A');
      scanAdvanced('Spot E');
      scanAdvanced('Leak B');
      scanAdvanced('Leak C');
      scanAdvanced('Leak D');
    });
    expect(
      screen.getByRole('button', { name: /Select small patch/i }),
    ).toBeInTheDocument();
  }

  function leakToast() {
    const node = document.querySelector('.mg-leak__toast');
    expect(node).toBeTruthy();
    return node as HTMLElement;
  }

  async function sealTier3InOrder() {
    selectPatchSize('small');
    sealAdvanced('Leak A');
    selectPatchSize('medium');
    rotatePatch();
    sealAdvanced('Leak B');
    selectPatchSize('large');
    rotatePatch();
    sealAdvanced('Leak C');
    selectPatchSize('medium');
    sealAdvanced('Leak D');
  }

  it('rejects out-of-order seal using pressure cue', async () => {
    renderLeakTier(3);
    await scanTier3();
    selectPatchSize('medium');
    rotatePatch();
    sealAdvanced('Leak B');
    expect(leakToast()).toHaveTextContent(/pressure|Leak A/i);
  });

  it('identifies decoy on scan without counting toward seal total', async () => {
    renderLeakTier(3);
    await act(async () => {
      scanAdvanced('Spot E');
    });
    expect(leakToast()).toHaveTextContent(/no leak here/i);
  });

  it('completes four real leaks in pressure order', async () => {
    const onResult = vi.fn();
    renderLeakTier(3, onResult);
    await scanTier3();
    await act(async () => {
      await sealTier3InOrder();
    });
    fireEvent.click(screen.getByRole('button', { name: /check pressure/i }));
    expect(onResult).toHaveBeenCalledWith('done');
  });
});
