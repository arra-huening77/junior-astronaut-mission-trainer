import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AfterCard } from './AfterCard';
import { ScenePresenter } from './ScenePresenter';
import { PREVIEW_SPOTS } from '../preview/fixtures';
afterEach(cleanup);
it('shows Robo explaining, reveals on Enter, then advances without reapplying a choice', () => {
  const next = vi.fn();
  render(
    <AfterCard
      text="Repairs used power and improved protection."
      onContinue={next}
    />,
  );
  expect(
    screen.getByRole('region', { name: 'Robo explains the result' }),
  ).toBeInTheDocument();
  expect(document.querySelector('.ui-portrait')).toHaveClass(
    'ui-robo-motion--float',
  );
  fireEvent.keyDown(window, { key: 'Enter' });
  expect(next).not.toHaveBeenCalled();
  expect(document.querySelector('.ui-dialogue__text')).toHaveTextContent(
    'Repairs used power',
  );
  fireEvent.keyDown(window, { key: 'Enter' });
  expect(next).toHaveBeenCalledOnce();
});
it('opens the learning photo automatically without a separate Real Mars button', () => {
  const input = vi.fn();
  render(
    <ScenePresenter
      step={{ id: 'test.real', type: 'real_card', realMomentId: 'test' }}
      onInput={input}
      reduceMotion
      settings={{ soundEnabled: false, reduceMotion: true }}
      spots={PREVIEW_SPOTS}
      layers={{ sky: 'day', solar: 'clean' }}
      content={{
        realCard: {
          title: 'Gale Crater',
          fact: 'A real place on Mars.',
          sourceLabel: 'NASA',
        },
      }}
    />,
  );
  expect(
    screen.getByRole('dialog', { name: 'Real Mars: Gale Crater' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(input).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Real Mars, tap to read' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(input).toHaveBeenCalledExactlyOnceWith({
    type: 'advance',
    stepId: 'test.real',
  });
});
