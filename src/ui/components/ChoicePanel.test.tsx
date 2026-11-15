import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ChoicePanel } from './ChoicePanel';
afterEach(cleanup);
it('shows actions without numeric outcomes and still sends the original choice ID', () => {
  const choose = vi.fn();
  render(
    <ChoicePanel
      onChoose={choose}
      options={[
        {
          id: 'A',
          label: 'Full heating (Power −15, Life +2)',
          costs: ['Power −15'],
        },
        { id: 'B', label: 'Balanced (a little to each system)' },
        { id: 'C', label: 'Long trip (Life +18, Power −15, Shield −5)' },
      ]}
    />,
  );
  expect(
    screen.getByRole('button', { name: 'Full heating' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Long trip' })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Balanced (a little to each system)' }),
  ).toBeInTheDocument();
  expect(screen.queryByText(/−15|\+18|\+2/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Full heating' }));
  expect(choose).toHaveBeenCalledExactlyOnceWith('A');
});
