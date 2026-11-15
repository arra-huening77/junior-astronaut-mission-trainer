import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PrologueScreen } from './PrologueScreen';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('keeps the whole line visible after Skip typing instead of shrinking it on the next tick', () => {
  vi.useFakeTimers();
  const complete = vi.fn();
  render(<PrologueScreen lines={['Hello Commander.']} onComplete={complete} />);
  act(() => vi.advanceTimersByTime(44));
  fireEvent.click(screen.getByRole('button', { name: 'Skip typing' }));
  expect(screen.getByText('Hello Commander.')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(44));
  expect(screen.getByText('Hello Commander.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Begin Sol 1' }));
  expect(complete).toHaveBeenCalledOnce();
});
