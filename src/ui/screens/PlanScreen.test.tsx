import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PlanScreen } from './PlanScreen';
afterEach(cleanup);
it('explains a 3-weight item with only 2 left without selecting it, then allows it after removing cargo', () => {
  const launch = vi.fn();
  render(
    <PlanScreen
      initialCargo={['solar_extra', 'shield_plating', 'batteries']}
      onLaunch={launch}
    />,
  );
  const kit = () => screen.getByRole('button', { name: /^Greenhouse kit/ });
  expect(kit()).toBeEnabled();
  fireEvent.click(kit());
  expect(screen.getByRole('status')).toHaveTextContent(
    'needs 3 weight points, but we have only 2 left',
  );
  expect(kit()).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(screen.getByRole('button', { name: /^Big batteries/ }));
  fireEvent.click(kit());
  expect(kit()).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Launch mission' }));
  expect(launch).toHaveBeenCalledExactlyOnceWith([
    'solar_extra',
    'shield_plating',
    'greenhouse_kit',
  ]);
});

it('introduces cargo one dialogue at a time and lets players skip to packing', () => {
  render(<PlanScreen onLaunch={vi.fn()} reduceMotion onBack={vi.fn()} />);
  expect(
    screen.getByRole('navigation', { name: 'Plan navigation' }),
  ).toContainElement(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Every rocket has a carrying limit',
  );
  fireEvent.keyDown(window, { key: 'Enter' });
  expect(screen.getByRole('status')).not.toHaveTextContent(
    'Every rocket has a carrying limit',
  );
  fireEvent.keyDown(window, { key: 'Enter' });
  fireEvent.keyDown(window, { key: 'Enter' });
  expect(
    screen.queryByRole('button', { name: 'Continue' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^Big batteries/ }));
  expect(screen.getByRole('status')).toHaveTextContent('These batteries');
});

it('Enter reveals typing before advancing and does not intercept cargo keyboard activation', () => {
  render(<PlanScreen onLaunch={vi.fn()} />);
  fireEvent.keyDown(window, { key: 'Enter' });
  expect(document.querySelector('.plan-speech-text')).toHaveTextContent(
    'Every rocket has a carrying limit',
  );
  fireEvent.keyDown(screen.getByRole('button', { name: /^Big batteries/ }), {
    key: 'Enter',
  });
  expect(screen.getByRole('status')).toHaveTextContent(
    'Every rocket has a carrying limit',
  );
  fireEvent.keyDown(window, { key: 'Enter' });
  expect(screen.getByRole('status')).not.toHaveTextContent(
    'Every rocket has a carrying limit',
  );
});
