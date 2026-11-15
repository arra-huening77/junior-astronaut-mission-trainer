import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { resetSkyServiceState, writeSkyCache } from './services/sky';

beforeEach(() => {
  localStorage.clear();
  resetSkyServiceState();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function backend() {
  // Test-only backend response: never bundled into the production application.
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        date: new Date().toISOString().slice(0, 10),
        level: 'active',
        source: 'saved',
        event: null,
        fetchedAt: '2026-11-14T00:00:00Z',
      }),
    })),
  );
}
async function launch() {
  fireEvent.click(screen.getByRole('button', { name: 'Start New' }));
  await screen.findByRole('heading', { name: 'Pack your cargo' });
  fireEvent.click(screen.getByRole('button', { name: 'Launch mission' }));
  // Prologue: skip straight into Sol 1 for integration tests.
  fireEvent.click(screen.getByRole('button', { name: 'Skip prologue' }));
}
function readToChoice() {
  for (let count = 0; count < 40; count++) {
    if (screen.queryByRole('button', { name: 'Air system first' })) return;
    const target = screen.queryByRole('button', { name: 'Habitat' });
    if (target && !(target as HTMLButtonElement).disabled) {
      fireEvent.click(target);
      continue;
    }
    const arrival = screen.queryByRole('button', { name: 'Finish walk' });
    if (arrival) {
      fireEvent.click(arrival);
      continue;
    }
    const photoClose = screen.queryByRole('button', { name: 'Close' });
    if (photoClose) {
      fireEvent.click(photoClose);
      continue;
    }
    const cont = screen.queryByRole('button', { name: 'Continue' });
    if (cont) {
      fireEvent.click(cont);
      continue;
    }
    const autoPhotoClose = screen.queryByRole('button', { name: 'Close' });
    if (autoPhotoClose) fireEvent.click(autoPhotoClose);
    const explore = screen.queryByRole('button', {
      name: 'Real Mars, tap to read',
    });
    if (explore) {
      fireEvent.click(explore);
      const close = screen.queryByRole('button', { name: 'Close' });
      if (close) fireEvent.click(close);
      continue;
    }
  }
  throw new Error('Tutorial did not reach its choice');
}
describe('Sol 1 app integration', () => {
  it('launches, reads the tutorial, applies choice and night once, and continues without refetching', async () => {
    backend();
    const first = render(<App />);
    await launch();
    readToChoice();
    fireEvent.click(screen.getByRole('button', { name: 'Air system first' }));
    expect(
      screen.getByText('Life Support: 85 · Power: 72 · Shielding: 60'),
    ).toBeInTheDocument();
    first.unmount();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/Air first! Breathing/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const autoPhotoClose = screen.queryByRole('button', { name: 'Close' });
    if (autoPhotoClose) fireEvent.click(autoPhotoClose);
    const explore = screen.queryByRole('button', {
      name: 'Real Mars, tap to read',
    });
    if (explore) {
      fireEvent.click(explore);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    } else {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    }
    expect(screen.queryByText('Sol 1 complete')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('mms.activeRun')!).state.sol).toBe(
      2,
    );
    expect(
      screen.getByText('Life Support: 80 · Power: 76 · Shielding: 60'),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('starts with the bundled archive when the NASA service is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start New' }));
    await screen.findByRole('heading', { name: 'Pack your cargo' });
    expect(localStorage.getItem('mms.activeRun')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Launch mission' }));
    expect(localStorage.getItem('mms.activeRun')).toContain('"source":"saved"');
  });
  it('keeps the old save while a replacement mission plans with archive fallback', async () => {
    backend();
    const first = render(<App />);
    await launch();
    first.unmount();
    const saved = localStorage.getItem('mms.activeRun');
    localStorage.removeItem('mms.sky.' + new Date().toISOString().slice(0, 10));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start New' }));
    await screen.findByRole('heading', { name: 'Pack your cargo' });
    expect(localStorage.getItem('mms.activeRun')).toBe(saved);
    expect(
      screen.getByRole('button', { name: 'Launch mission' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Launching this new mission replaces your saved progress/,
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument();
    const requests = vi.mocked(fetch).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(document.querySelector('.app-scene')).toBeInTheDocument();
    expect(localStorage.getItem('mms.activeRun')).toBe(saved);
    expect(vi.mocked(fetch).mock.calls.length).toBe(requests);
  });
});

it('prefers a valid cached sky response before the archive when offline', async () => {
  const date = new Date().toISOString().slice(0, 10);
  writeSkyCache({
    date,
    level: 'active',
    event: null,
    source: 'live',
    fetchedAt: new Date().toISOString(),
  });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Start New' }));
  await screen.findByRole('heading', { name: 'Pack your cargo' });
  fireEvent.click(screen.getByRole('button', { name: 'Launch mission' }));
  expect(localStorage.getItem('mms.activeRun')).toContain('"source":"cache"');
  expect(localStorage.getItem('mms.activeRun')).toContain(
    '"solarVariant":"active"',
  );
});

it('restores the classroom setting and waits for teacher Continue before night', async () => {
  backend();
  localStorage.setItem(
    'mms.settings',
    JSON.stringify({
      classroomMode: true,
      soundEnabled: false,
      reduceMotion: true,
      textSize: 'lg',
    }),
  );
  render(<App />);
  await launch();
  readToChoice();
  fireEvent.click(screen.getByRole('button', { name: 'Air system first' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  const autoPhotoClose = screen.queryByRole('button', { name: 'Close' });
  if (autoPhotoClose) fireEvent.click(autoPhotoClose);
  const explore = screen.queryByRole('button', {
    name: 'Real Mars, tap to read',
  });
  if (explore) {
    fireEvent.click(explore);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  } else {
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  }
  expect(
    screen.getByRole('region', { name: 'Sol 1 discussion pause' }),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Life Support: 85 · Power: 72 · Shielding: 60'),
  ).toBeInTheDocument();
  expect(screen.queryByText('Sol 1 complete')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.queryByText('Sol 1 complete')).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('mms.activeRun')!).state.sol).toBe(2);
  expect(
    screen.getByText('Life Support: 80 · Power: 76 · Shielding: 60'),
  ).toBeInTheDocument();
});

for (const repair of ['A', 'B'] as const) {
  it(`plays all ten sols in classroom presentation through repair ${repair}, report, album and certificate`, async () => {
    backend();
    localStorage.setItem(
      'mms.settings',
      JSON.stringify({
        classroomMode: true,
        soundEnabled: false,
        reduceMotion: true,
        textSize: 'lg',
      }),
    );
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start New' }));
    await screen.findByRole('heading', { name: 'Pack your cargo' });
    fireEvent.click(screen.getByRole('button', { name: 'Balanced pack' }));
    fireEvent.click(screen.getByRole('button', { name: 'Launch mission' }));
    const paused = new Set<number>();
    const tasks = new Set<string>();
    for (let guard = 0; guard < 250; guard++) {
      if (screen.queryByRole('heading', { name: 'Mission complete!' })) break;
      const raw =
        localStorage.getItem('mms.activeRun') ??
        localStorage.getItem('mms.lastRun');
      const sol = raw ? (JSON.parse(raw).state.sol as number) : 1;
      if (screen.queryByRole('region', { name: `Sol ${sol} discussion pause` }))
        paused.add(sol);
      const skipPrologue = screen.queryByRole('button', {
        name: 'Skip prologue',
      });
      if (skipPrologue) {
        fireEvent.click(skipPrologue);
        continue;
      }
      const choices = screen.queryByRole('group', { name: 'Mission choices' });
      if (choices) {
        const index = sol === 2 || (sol === 7 && repair === 'B') ? 1 : 0;
        fireEvent.click(within(choices).getAllByRole('button')[index]);
        continue;
      }
      const active = document.querySelector<HTMLButtonElement>(
        '.ui-hotspot--active:not(:disabled)',
      );
      if (active) {
        fireEvent.click(active);
        continue;
      }
      const taskSkip = screen.queryByRole('button', { name: /^Skip$/ });
      if (taskSkip) {
        for (const title of [
          'Cover Panels',
          'Rover Drive',
          'Repair Wires',
          'Patch Leak',
        ])
          if (screen.queryByRole('heading', { name: title })) tasks.add(title);
        fireEvent.click(taskSkip);
        continue;
      }
      const photoClose = screen.queryByRole('button', { name: 'Close' });
      if (photoClose) {
        fireEvent.click(photoClose);
        continue;
      }
      const cont = screen.queryByRole('button', { name: 'Continue' });
      if (cont) {
        fireEvent.click(cont);
        continue;
      }
      const begin = screen.queryByRole('button', {
        name: new RegExp(`^Begin Sol ${sol + 1}$`),
      });
      if (begin) {
        fireEvent.click(begin);
        continue;
      }
      throw new Error(
        `Mission stuck at sol ${sol}: ${document.body.textContent?.slice(-500)}`,
      );
    }
    expect(
      screen.getByRole('heading', { name: 'Mission complete!' }),
    ).toBeInTheDocument();
    expect(paused.size).toBe(10);
    expect(tasks).toContain(repair === 'A' ? 'Repair Wires' : 'Patch Leak');
    const final = JSON.parse(localStorage.getItem('mms.lastRun')!);
    expect(final.state.history).toHaveLength(10);
    expect(final.state.schedule[7]).toBe(repair === 'A' ? 'meteors' : 'leak');
    expect(final.state.sky.level).toBe('active');
    await waitFor(() =>
      expect(screen.getByText("Robo's mission summary")).toBeInTheDocument(),
    );
    expect(fetch).toHaveBeenCalledTimes(2); // one sky read, one end-only debrief
    fireEvent.click(screen.getByRole('button', { name: 'Open album' }));
    expect(
      screen.getByText('10 cards collected this run.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close album' }));
    fireEvent.click(screen.getByRole('button', { name: 'Certificate' }));
    expect(screen.getByRole('button', { name: 'Print' })).toBeEnabled();
  }, 20000);
}

it('retries a failed sol from memory without double charges, then rejects success after final-night failure', async () => {
  backend();
  localStorage.setItem(
    'mms.settings',
    JSON.stringify({
      classroomMode: false,
      soundEnabled: false,
      reduceMotion: true,
      textSize: 'md',
    }),
  );
  render(<App />);
  await launch();
  function drive(strategy: Record<number, number>) {
    for (let guard = 0; guard < 250; guard++) {
      if (screen.queryByRole('heading', { name: 'The crew is safe' })) return;
      const raw =
        localStorage.getItem('mms.activeRun') ??
        localStorage.getItem('mms.lastRun');
      const sol = JSON.parse(raw!).state.sol as number;
      const confirm = screen.queryByRole('button', { name: 'Choose this' });
      if (confirm) {
        fireEvent.click(confirm);
        continue;
      }
      const choices = screen.queryByRole('group', { name: 'Mission choices' });
      if (choices) {
        fireEvent.click(
          within(choices).getAllByRole('button')[strategy[sol] ?? 0],
        );
        continue;
      }
      const active = document.querySelector<HTMLButtonElement>(
        '.ui-hotspot--active:not(:disabled)',
      );
      if (active) {
        fireEvent.click(active);
        continue;
      }
      const skip = screen.queryByRole('button', { name: 'Skip' });
      if (skip) {
        fireEvent.click(skip);
        continue;
      }
      const photoClose = screen.queryByRole('button', { name: 'Close' });
      if (photoClose) {
        fireEvent.click(photoClose);
        continue;
      }
      const cont = screen.queryByRole('button', { name: 'Continue' });
      if (cont) {
        fireEvent.click(cont);
        continue;
      }
      const next = screen.queryByRole('button', {
        name: `Begin Sol ${sol + 1}`,
      });
      if (next) {
        fireEvent.click(next);
        continue;
      }
      throw new Error(`Stopped at ${sol}`);
    }
    throw new Error('No ending');
  }
  // Deliberately costly choices: fail immediately on the cold-night result.
  const costly = { 2: 0, 3: 0, 4: 1, 5: 1, 6: 0, 7: 0, 8: 1, 9: 0, 10: 0 };
  drive(costly);
  const failed = JSON.parse(localStorage.getItem('mms.lastRun')!);
  expect(failed.state.sol).toBe(9);
  expect(failed.state.failedMeter).toBe('power');
  const requestCount = vi.mocked(fetch).mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Try this sol again' }));
  const retry = JSON.parse(localStorage.getItem('mms.activeRun')!);
  expect(retry.state.sol).toBe(9);
  expect(retry.state.history).toHaveLength(8);
  expect(retry.state.meters.power).toBe(14);
  expect(retry.state.sky).toEqual(failed.state.sky);
  expect(vi.mocked(fetch).mock.calls.length).toBe(requestCount);
  // Save power on Sol 9. Sol 10's choice survives, but night exhausts the remaining power.
  drive({ ...costly, 9: 2 });
  const final = JSON.parse(localStorage.getItem('mms.lastRun')!);
  expect(final.state.sol).toBe(10);
  expect(final.state.history).toHaveLength(10);
  expect(final.state.ending).toBe('gentle');
  expect(final.state.meters.power).toBe(0);
  expect(
    screen.queryByRole('heading', { name: 'Mission complete!' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Certificate' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/Welcome home/)).not.toBeInTheDocument();
}, 20000);
